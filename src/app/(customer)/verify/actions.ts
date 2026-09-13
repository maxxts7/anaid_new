'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { recordAudit } from '@/lib/audit'
import { createSession } from '@/lib/auth/session'
import { notifyStaff } from '@/lib/notifications'
import { identifierChannel, issueOtp, normaliseIdentifier, verifyOtp } from '@/lib/otp'

export type VerifyState = { message?: string; sent?: string }

const FAILURE_MESSAGES = {
  NO_CODE: 'That code has expired or was already used. Ask for a new one.',
  EXPIRED: 'That code has expired. Ask for a new one.',
  TOO_MANY_ATTEMPTS: 'Too many incorrect attempts. Ask for a new code.',
  INCORRECT: 'That code is not right.',
} as const

/**
 * Step two: the code.
 *
 * On registration this moves the account from REGISTERED to PENDING_APPROVAL
 * and puts it in front of ANAID staff. That is all it does — verification is
 * emphatically not approval, and the customer is told so in those words.
 */
export async function submitCode(_previous: VerifyState, formData: FormData): Promise<VerifyState> {
  const identifier = normaliseIdentifier(String(formData.get('to') ?? ''))
  const purpose = String(formData.get('purpose') ?? 'login') === 'registration' ? 'REGISTRATION' : 'LOGIN'
  const code = String(formData.get('code') ?? '').trim()

  if (!identifier) return { message: 'Start again — we lost track of which account this is for.' }
  if (!code) return { message: 'Enter the code we sent you.' }

  const outcome = await verifyOtp({ identifier, purpose, code })

  if (!outcome.ok) {
    const base = FAILURE_MESSAGES[outcome.reason]
    const suffix =
      outcome.reason === 'INCORRECT' && outcome.attemptsLeft !== undefined
        ? ` ${outcome.attemptsLeft} ${outcome.attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`
        : ''
    return { message: base + suffix }
  }

  const user = await prisma.customerUser.findFirst({
    where: { disabledAt: null, OR: [{ email: identifier }, { mobile: identifier }] },
    include: { customer: true },
  })

  if (!user) return { message: 'We could not find an account with those details.' }

  if (purpose === 'REGISTRATION' && user.customer.status === 'REGISTERED') {
    await prisma.customer.update({
      where: { id: user.customerId },
      data: { status: 'PENDING_APPROVAL', verifiedAt: new Date() },
    })

    await recordAudit({
      actorType: 'CUSTOMER',
      actorId: user.id,
      actorLabel: `${user.name} (${user.customer.businessName})`,
      action: 'customer.verified',
      entityType: 'Customer',
      entityId: user.customerId,
      after: { status: 'PENDING_APPROVAL' },
    })

    // The application only reaches the approvals queue now, so abandoned
    // registrations never fill it (LEVEL-4 §7).
    await notifyStaff({
      type: 'customer.awaiting_approval',
      title: 'New trade account application',
      body: `${user.customer.businessName} (${user.customer.businessType.toLowerCase().replace(/_/g, ' ')}) in ${user.customer.postcode} has verified their details and is waiting for approval.`,
      link: `/admin/customers/${user.customerId}`,
    })
  }

  await prisma.customerUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  await createSession('customer', user.id)

  redirect(user.customer.status === 'APPROVED' ? '/' : '/account/status')
}

export async function resendCode(_previous: VerifyState, formData: FormData): Promise<VerifyState> {
  const identifier = normaliseIdentifier(String(formData.get('to') ?? ''))
  const purpose = String(formData.get('purpose') ?? 'login') === 'registration' ? 'REGISTRATION' : 'LOGIN'

  if (!identifier) return { message: 'Start again — we lost track of which account this is for.' }

  const outcome = await issueOtp({
    identifier,
    channel: identifierChannel(identifier),
    purpose,
  })

  if (!outcome.ok) {
    return { message: `Too many codes requested. Try again in ${outcome.retryAfterMinutes} minutes.` }
  }

  return { sent: 'A new code is on its way.' }
}
