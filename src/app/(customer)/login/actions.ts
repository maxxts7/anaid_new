'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { identifierChannel, issueOtp, normaliseIdentifier } from '@/lib/otp'

export type LoginState = { message?: string }

/**
 * Step one of signing in: prove you are the person who owns this number or
 * email address. Whether that account may then see prices is a separate
 * question, answered after the code is accepted.
 */
export async function requestLoginCode(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const raw = String(formData.get('identifier') ?? '').trim()

  if (!raw) {
    return { message: 'Enter the mobile number or email address on your account.' }
  }

  const identifier = normaliseIdentifier(raw)

  const user = await prisma.customerUser.findFirst({
    where: {
      disabledAt: null,
      OR: [{ email: identifier }, { mobile: identifier }],
    },
    select: { id: true },
  })

  if (!user) {
    return {
      message: 'We could not find an account with those details. Check them, or open a trade account.',
    }
  }

  const outcome = await issueOtp({
    identifier,
    channel: identifierChannel(identifier),
    purpose: 'LOGIN',
  })

  if (!outcome.ok) {
    return {
      message: `Too many codes requested. Try again in ${outcome.retryAfterMinutes} minutes.`,
    }
  }

  redirect(`/verify?to=${encodeURIComponent(identifier)}&purpose=login`)
}
