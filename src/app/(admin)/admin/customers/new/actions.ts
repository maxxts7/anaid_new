'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/guards'
import { allocateCustomerNumber } from '@/lib/numbering'
import { recordAudit } from '@/lib/audit'
import { parsePence } from '@/lib/money'
import { normaliseIdentifier } from '@/lib/otp'
import type { BusinessType } from '@/generated/prisma/client'

export type NewCustomerState = { message?: string }

/**
 * Staff-created accounts (gap #13).
 *
 * ANAID already has a book of customers who order by telephone. Making each of
 * them fill in a registration form before the system can be used for them would
 * be absurd, so staff enter the details and the account starts APPROVED with
 * its commercial terms already set. The customer simply signs in with a code.
 */
export async function createCustomer(
  _previous: NewCustomerState,
  formData: FormData
): Promise<NewCustomerState> {
  const { staff } = await requireStaff('customers.create')

  const value = (key: string) => String(formData.get(key) ?? '').trim()

  const businessName = value('businessName')
  const contactName = value('contactName')
  const email = value('email').toLowerCase()
  const mobile = normaliseIdentifier(value('mobile'))
  const businessType = value('businessType') as BusinessType
  const line1 = value('line1')
  const city = value('city')
  const postcode = value('postcode').toUpperCase()

  if (!businessName || !contactName || !email || !mobile || !line1 || !city || !postcode) {
    return { message: 'Fill in the business, contact, address and postcode.' }
  }

  const clash = await prisma.customer.findFirst({
    where: { OR: [{ email }, { mobile }] },
    select: { id: true, businessName: true },
  })

  if (clash) {
    return { message: `${clash.businessName} already uses that email address or mobile number.` }
  }

  let creditLimitPence = 0
  try {
    const raw = value('creditLimit')
    creditLimitPence = raw ? parsePence(raw) : 0
  } catch {
    return { message: 'Enter the credit limit as a number, for example 2000.' }
  }

  const paymentTermsDays = Number(value('paymentTermsDays') || 0)
  const pricingLevelId = value('pricingLevelId') || null
  const now = new Date()

  const customer = await prisma.$transaction(async (tx) => {
    const customerNumber = await allocateCustomerNumber(tx)

    return tx.customer.create({
      data: {
        customerNumber,
        businessName,
        contactName,
        email,
        mobile,
        businessType: businessType || 'OTHER',
        vatNumber: value('vatNumber') || null,
        postcode,
        status: 'APPROVED',
        pricingLevelId,
        creditLimitPence,
        paymentTermsDays: Number.isFinite(paymentTermsDays) ? paymentTermsDays : 0,
        // Set up by staff on the customer's behalf: they accepted the terms when
        // the account was agreed, and the audit entry records who did it.
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        verifiedAt: now,
        approvedAt: now,
        approvedById: staff.id,
        createdById: staff.id,
        users: {
          create: { name: contactName, email, mobile, isPrimary: true },
        },
        addresses: {
          create: {
            label: 'Main',
            line1,
            line2: value('line2') || null,
            city,
            postcode,
            isDefaultBilling: true,
            isDefaultDelivery: true,
            contactPhone: mobile,
          },
        },
      },
    })
  })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'customer.created_by_staff',
    entityType: 'Customer',
    entityId: customer.id,
    after: {
      businessName,
      customerNumber: customer.customerNumber,
      status: 'APPROVED',
      creditLimitPence,
    },
  })

  redirect(`/admin/customers/${customer.id}`)
}
