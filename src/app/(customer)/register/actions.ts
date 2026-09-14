'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { recordAudit } from '@/lib/audit'
import { identifierChannel, issueOtp, normaliseIdentifier } from '@/lib/otp'
import { notifyStaff } from '@/lib/notifications'
import { BUSINESS_TYPES } from '@/lib/business-types'

/**
 * Registration (LEVEL-4 §7).
 *
 * Creates the business, its first login, and its addresses, then sends a code.
 * The account starts at REGISTERED and can do nothing at all until the code is
 * entered — and can still see no prices after that, until a human approves it.
 */

const ukMobile = /^0\d{9,10}$/
const ukPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

const schema = z
  .object({
    businessName: z.string().trim().min(2, 'Enter your business name').max(120),
    contactName: z.string().trim().min(2, 'Enter a contact name').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    mobile: z
      .string()
      .trim()
      .transform(normaliseIdentifier)
      .refine((value) => ukMobile.test(value), 'Enter a UK mobile number, for example 07700 900123'),
    altPhone: z.string().trim().max(30).optional().or(z.literal('')),
    businessType: z.enum(BUSINESS_TYPES),
    vatNumber: z.string().trim().max(20).optional().or(z.literal('')),
    companyNumber: z.string().trim().max(20).optional().or(z.literal('')),
    website: z.string().trim().max(200).optional().or(z.literal('')),

    billingLine1: z.string().trim().min(2, 'Enter the first line of your address').max(120),
    billingLine2: z.string().trim().max(120).optional().or(z.literal('')),
    billingCity: z.string().trim().min(2, 'Enter a town or city').max(80),
    billingPostcode: z.string().trim().refine((value) => ukPostcode.test(value), 'Enter a valid postcode'),

    deliverySameAsBilling: z.coerce.boolean().default(false),
    deliveryLine1: z.string().trim().max(120).optional().or(z.literal('')),
    deliveryLine2: z.string().trim().max(120).optional().or(z.literal('')),
    deliveryCity: z.string().trim().max(80).optional().or(z.literal('')),
    deliveryPostcode: z.string().trim().max(12).optional().or(z.literal('')),
    deliveryInstructions: z.string().trim().max(500).optional().or(z.literal('')),

    acceptTerms: z.literal('on', { message: 'You must accept the terms and conditions' }),
    acceptPrivacy: z.literal('on', { message: 'You must accept the privacy policy' }),
    marketing: z.string().optional(),
  })
  .refine(
    (value) =>
      value.deliverySameAsBilling ||
      (value.deliveryLine1 && value.deliveryCity && ukPostcode.test(value.deliveryPostcode ?? '')),
    { message: 'Enter the delivery address, or tick that it is the same as the billing address', path: ['deliveryLine1'] }
  )

export type RegisterState = {
  errors?: Record<string, string>
  message?: string
}

export async function registerCustomer(
  _previous: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = Object.fromEntries(formData) as Record<string, string>
  const parsed = schema.safeParse({ ...raw, deliverySameAsBilling: raw.deliverySameAsBilling === 'on' })

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      errors[key] ??= issue.message
    }
    return { errors, message: 'Check the highlighted fields and try again.' }
  }

  const input = parsed.data

  // Email and mobile are unique across all customers, so a repeat application
  // from the same contact is a sign-in, not a second account.
  const existing = await prisma.customer.findFirst({
    where: { OR: [{ email: input.email }, { mobile: input.mobile }] },
    select: { id: true },
  })

  if (existing) {
    return {
      message:
        'An account already exists with that email address or mobile number. Sign in instead, and we will send you a code.',
    }
  }

  const delivery = input.deliverySameAsBilling
    ? {
        line1: input.billingLine1,
        line2: input.billingLine2 || null,
        city: input.billingCity,
        postcode: input.billingPostcode.toUpperCase(),
      }
    : {
        line1: input.deliveryLine1!,
        line2: input.deliveryLine2 || null,
        city: input.deliveryCity!,
        postcode: (input.deliveryPostcode ?? '').toUpperCase(),
      }

  const now = new Date()

  const customer = await prisma.customer.create({
    data: {
      businessName: input.businessName,
      contactName: input.contactName,
      email: input.email,
      mobile: input.mobile,
      altPhone: input.altPhone || null,
      businessType: input.businessType,
      vatNumber: input.vatNumber || null,
      companyNumber: input.companyNumber || null,
      website: input.website || null,
      postcode: delivery.postcode,
      status: 'REGISTERED',
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      marketingConsent: raw.marketing === 'on',
      marketingConsentAt: raw.marketing === 'on' ? now : null,
      users: {
        create: {
          name: input.contactName,
          email: input.email,
          mobile: input.mobile,
          isPrimary: true,
        },
      },
      addresses: {
        create: [
          {
            label: 'Billing',
            line1: input.billingLine1,
            line2: input.billingLine2 || null,
            city: input.billingCity,
            postcode: input.billingPostcode.toUpperCase(),
            isDefaultBilling: true,
            isDefaultDelivery: input.deliverySameAsBilling,
            contactPhone: input.mobile,
          },
          ...(input.deliverySameAsBilling
            ? []
            : [
                {
                  label: 'Delivery',
                  line1: delivery.line1,
                  line2: delivery.line2,
                  city: delivery.city,
                  postcode: delivery.postcode,
                  isDefaultBilling: false,
                  isDefaultDelivery: true,
                  contactPhone: input.mobile,
                  deliveryInstructions: input.deliveryInstructions || null,
                },
              ]),
        ],
      },
    },
  })

  // Gap #22 — a business applying twice under a different contact is flagged for
  // staff to judge, never blocked automatically.
  await flagPossibleDuplicate(customer.id, input.businessName, delivery.postcode, input.vatNumber || null)

  await recordAudit({
    actorType: 'CUSTOMER',
    actorId: customer.id,
    actorLabel: `${input.contactName} (${input.businessName})`,
    action: 'customer.registered',
    entityType: 'Customer',
    entityId: customer.id,
    after: { businessName: input.businessName, status: 'REGISTERED' },
  })

  // The outcome matters. When the hourly limit is reached no code is written at
  // all, and sending the customer on to a screen that asks for one leaves them
  // typing into a check that cannot pass — against whatever older code happens
  // still to be live. The account is made either way; only the code is refused,
  // so they are told to wait rather than sent in a circle.
  const sent = await issueOtp({
    identifier: input.mobile,
    channel: identifierChannel(input.mobile),
    purpose: 'REGISTRATION',
  })

  if (!sent.ok) {
    return {
      message:
        `Your account is set up, but we have sent several codes to ${input.mobile} in the last hour. ` +
        `Try signing in again in ${sent.retryAfterMinutes} minutes and we will send a fresh one.`,
    }
  }

  redirect(`/verify?to=${encodeURIComponent(input.mobile)}&purpose=registration`)
}

async function flagPossibleDuplicate(
  customerId: string,
  businessName: string,
  postcode: string,
  vatNumber: string | null
) {
  const matches = await prisma.customer.findMany({
    where: {
      id: { not: customerId },
      OR: [
        { AND: [{ businessName: { equals: businessName, mode: 'insensitive' } }, { postcode }] },
        ...(vatNumber ? [{ vatNumber }] : []),
      ],
    },
    select: { id: true, businessName: true, customerNumber: true },
    take: 3,
  })

  if (matches.length === 0) return

  const description = matches
    .map((match) => `${match.businessName}${match.customerNumber ? ` (${match.customerNumber})` : ''}`)
    .join(', ')

  await prisma.customerNote.create({
    data: {
      customerId,
      body: `Possible duplicate application. Similar existing account: ${description}. Check before approving.`,
    },
  })

  await notifyStaff({
    type: 'customer.duplicate_suspected',
    title: 'Possible duplicate application',
    body: `${businessName} looks similar to ${description}.`,
    link: `/admin/customers/${customerId}`,
  })
}
