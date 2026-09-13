'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/guards'
import { revokeCustomerSessions } from '@/lib/auth/session'
import { allocateCustomerNumber } from '@/lib/numbering'
import { recordAudit } from '@/lib/audit'
import { notifyCustomer } from '@/lib/notifications'
import { parsePence } from '@/lib/money'

/**
 * The approvals desk (LEVEL-4 §10 and §11).
 *
 * This is where the central rule of the system is actually exercised: a human
 * being at ANAID decides whether a business may trade, and only that decision
 * makes prices visible.
 */

export type DecisionState = { message?: string; ok?: boolean }

export async function approveCustomer(
  _previous: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const { staff } = await requireStaff('customers.approve')

  const customerId = String(formData.get('customerId') ?? '')
  const pricingLevelId = String(formData.get('pricingLevelId') ?? '')
  const creditLimitRaw = String(formData.get('creditLimit') ?? '0').trim()
  const paymentTermsDays = Number(formData.get('paymentTermsDays') ?? 0)

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) return { message: 'That customer no longer exists.' }

  if (customer.status === 'APPROVED') {
    return { message: 'This account is already approved.' }
  }

  let creditLimitPence = 0
  try {
    creditLimitPence = creditLimitRaw ? parsePence(creditLimitRaw) : 0
  } catch {
    return { message: 'Enter the credit limit as a number, for example 2000 or 2000.00.' }
  }

  const customerNumber = await prisma.$transaction(async (tx) => {
    // Issued at approval, never before, and never reissued (LEVEL-4 §11).
    const number = customer.customerNumber ?? (await allocateCustomerNumber(tx))

    await tx.customer.update({
      where: { id: customer.id },
      data: {
        status: 'APPROVED',
        customerNumber: number,
        approvedAt: new Date(),
        approvedById: staff.id,
        pricingLevelId: pricingLevelId || null,
        creditLimitPence,
        paymentTermsDays: Number.isFinite(paymentTermsDays) ? paymentTermsDays : 0,
        infoRequested: false,
        infoRequestedMessage: null,
        rejectionReason: null,
        rejectedAt: null,
        suspensionReason: null,
        suspendedAt: null,
      },
    })

    return number
  })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'customer.approved',
    entityType: 'Customer',
    entityId: customer.id,
    before: { status: customer.status },
    after: { status: 'APPROVED', customerNumber, creditLimitPence, paymentTermsDays },
  })

  await notifyCustomer({
    customerId: customer.id,
    type: 'account.approved',
    title: 'Your ANAID account has been approved',
    body: `Your ANAID Quality Disposables account has been approved. Your account number is ${customerNumber}. You can now sign in to view your prices and place orders.`,
    link: '/account',
  })

  revalidatePath('/admin/approvals')
  revalidatePath(`/admin/customers/${customer.id}`)

  return { ok: true, message: `Approved as ${customerNumber}.` }
}

export async function rejectCustomer(
  _previous: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const { staff } = await requireStaff('customers.approve')

  const customerId = String(formData.get('customerId') ?? '')
  const reason = String(formData.get('reason') ?? '').trim()

  if (!reason) return { message: 'Give a reason. The customer never sees it, but your colleagues will.' }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) return { message: 'That customer no longer exists.' }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { status: 'REJECTED', rejectionReason: reason, rejectedAt: new Date() },
  })

  // Access stops at once; they keep the catalogue, without prices.
  await revokeCustomerSessions(customer.id)

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'customer.rejected',
    entityType: 'Customer',
    entityId: customer.id,
    before: { status: customer.status },
    after: { status: 'REJECTED', reason },
  })

  await notifyCustomer({
    customerId: customer.id,
    type: 'account.rejected',
    title: 'About your ANAID account application',
    body: 'Your ANAID Quality Disposables account application has not been approved. Please contact us for further information.',
  })

  revalidatePath('/admin/approvals')
  revalidatePath(`/admin/customers/${customer.id}`)

  return { ok: true, message: 'Application rejected.' }
}

export async function suspendCustomer(
  _previous: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const { staff } = await requireStaff('customers.edit')

  const customerId = String(formData.get('customerId') ?? '')
  const reason = String(formData.get('reason') ?? '').trim()

  if (!reason) return { message: 'Give a reason for the suspension.' }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) return { message: 'That customer no longer exists.' }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { status: 'SUSPENDED', suspensionReason: reason, suspendedAt: new Date() },
  })

  await revokeCustomerSessions(customer.id)

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'customer.suspended',
    entityType: 'Customer',
    entityId: customer.id,
    before: { status: customer.status },
    after: { status: 'SUSPENDED', reason },
  })

  await notifyCustomer({
    customerId: customer.id,
    type: 'account.suspended',
    title: 'Your ANAID account has been suspended',
    body: 'Your ANAID Quality Disposables account has been temporarily suspended. Orders already placed will still be delivered, and your invoices remain visible. Please contact ANAID Quality Disposables Limited.',
  })

  revalidatePath(`/admin/customers/${customer.id}`)

  return { ok: true, message: 'Account suspended. Orders in progress continue.' }
}

/**
 * Gap #19 — how an account leaves REJECTED or SUSPENDED. Back to
 * PENDING_APPROVAL if it was never approved, straight to APPROVED if it was.
 */
export async function reinstateCustomer(
  _previous: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const { staff } = await requireStaff('customers.approve')

  const customerId = String(formData.get('customerId') ?? '')
  const note = String(formData.get('note') ?? '').trim()

  if (!note) return { message: 'Say why the account is being reinstated.' }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) return { message: 'That customer no longer exists.' }

  const nextStatus = customer.customerNumber ? 'APPROVED' : 'PENDING_APPROVAL'

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      status: nextStatus,
      suspensionReason: null,
      suspendedAt: null,
      rejectionReason: null,
      rejectedAt: null,
    },
  })

  await prisma.customerNote.create({
    data: { customerId: customer.id, staffId: staff.id, body: `Reinstated: ${note}` },
  })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'customer.reinstated',
    entityType: 'Customer',
    entityId: customer.id,
    before: { status: customer.status },
    after: { status: nextStatus, note },
  })

  if (nextStatus === 'APPROVED') {
    await notifyCustomer({
      customerId: customer.id,
      type: 'account.reinstated',
      title: 'Your ANAID account is active again',
      body: 'Your account has been reinstated. You can sign in, see your prices and place orders as usual.',
    })
  }

  revalidatePath(`/admin/customers/${customer.id}`)

  return { ok: true, message: `Account moved to ${nextStatus.toLowerCase().replace(/_/g, ' ')}.` }
}

/**
 * Gap #12 — "request more information" is a flag on PENDING_APPROVAL rather
 * than a sixth status.
 */
export async function requestMoreInformation(
  _previous: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const { staff } = await requireStaff('customers.approve')

  const customerId = String(formData.get('customerId') ?? '')
  const message = String(formData.get('message') ?? '').trim()

  if (!message) return { message: 'Say what you need from them.' }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) return { message: 'That customer no longer exists.' }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      status: 'PENDING_APPROVAL',
      infoRequested: true,
      infoRequestedMessage: message,
      infoRequestedAt: new Date(),
    },
  })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'customer.info_requested',
    entityType: 'Customer',
    entityId: customer.id,
    after: { message },
  })

  await notifyCustomer({
    customerId: customer.id,
    type: 'account.info_requested',
    title: 'We need a little more information',
    body: message,
  })

  revalidatePath('/admin/approvals')
  revalidatePath(`/admin/customers/${customer.id}`)

  return { ok: true, message: 'Asked the customer for more information.' }
}

export async function addCustomerNote(
  _previous: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const { staff } = await requireStaff('customers.view')

  const customerId = String(formData.get('customerId') ?? '')
  const body = String(formData.get('body') ?? '').trim()

  if (!body) return { message: 'Write something first.' }

  await prisma.customerNote.create({ data: { customerId, staffId: staff.id, body } })

  revalidatePath(`/admin/customers/${customerId}`)

  return { ok: true }
}

export async function updateCommercialTerms(
  _previous: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const { staff } = await requireStaff('customers.credit')

  const customerId = String(formData.get('customerId') ?? '')
  const pricingLevelId = String(formData.get('pricingLevelId') ?? '')
  const creditLimitRaw = String(formData.get('creditLimit') ?? '0').trim()
  const paymentTermsDays = Number(formData.get('paymentTermsDays') ?? 0)

  const before = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!before) return { message: 'That customer no longer exists.' }

  let creditLimitPence = 0
  try {
    creditLimitPence = creditLimitRaw ? parsePence(creditLimitRaw) : 0
  } catch {
    return { message: 'Enter the credit limit as a number, for example 2000 or 2000.00.' }
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      pricingLevelId: pricingLevelId || null,
      creditLimitPence,
      paymentTermsDays: Number.isFinite(paymentTermsDays) ? paymentTermsDays : 0,
    },
  })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'customer.terms_changed',
    entityType: 'Customer',
    entityId: customerId,
    before: {
      pricingLevelId: before.pricingLevelId,
      creditLimitPence: before.creditLimitPence,
      paymentTermsDays: before.paymentTermsDays,
    },
    after: { pricingLevelId: pricingLevelId || null, creditLimitPence, paymentTermsDays },
  })

  revalidatePath(`/admin/customers/${customerId}`)

  return { ok: true, message: 'Terms updated.' }
}
