import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { getSettings } from './settings'
import type { OtpChannel, OtpPurpose } from '../generated/prisma/client'

/**
 * One-time codes.
 *
 * WHILE OTP_FIXED_CODE IS SET, EVERY CODE IS THAT VALUE AND NOTHING IS SENT.
 * This is deliberate and temporary: there is no verified sending domain yet.
 * The row is still written, the expiry still applies, the attempt limit still
 * applies and the rate limit still applies, so the day the pin is removed
 * nothing else has to change.
 *
 * Delete OTP_FIXED_CODE from the environment to switch to real random codes.
 */

export const fixedCode = process.env.OTP_FIXED_CODE?.trim() || null
export const isOtpPinned = fixedCode !== null

export type IssueOutcome =
  | { ok: true; expiresAt: Date; pinned: boolean; devCode: string | null }
  | { ok: false; reason: 'RATE_LIMITED'; retryAfterMinutes: number }

export type VerifyOutcome =
  | { ok: true }
  | { ok: false; reason: 'NO_CODE' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'INCORRECT'; attemptsLeft?: number }

function randomCode(length: number): string {
  const max = 10 ** length
  return String(Math.floor(Math.random() * max)).padStart(length, '0')
}

export async function issueOtp(input: {
  identifier: string
  channel: OtpChannel
  purpose: OtpPurpose
  ipAddress?: string | null
}): Promise<IssueOutcome> {
  const settings = await getSettings()
  const identifier = normaliseIdentifier(input.identifier)

  // Rate limit: how many codes has this identifier been sent in the last hour?
  const since = new Date(Date.now() - 60 * 60 * 1000)
  const recent = await prisma.otpCode.count({
    where: { identifier, purpose: input.purpose, createdAt: { gte: since } },
  })

  if (recent >= settings['otp.resendsPerHour']) {
    const oldest = await prisma.otpCode.findFirst({
      where: { identifier, purpose: input.purpose, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    })
    const retryAfterMinutes = oldest
      ? Math.max(1, Math.ceil((oldest.createdAt.getTime() + 60 * 60 * 1000 - Date.now()) / 60000))
      : 60
    return { ok: false, reason: 'RATE_LIMITED', retryAfterMinutes }
  }

  const code = fixedCode ?? randomCode(settings['otp.codeLength'])
  const expiresAt = new Date(Date.now() + settings['otp.expiryMinutes'] * 60 * 1000)

  // Any earlier code for this identifier is spent the moment a new one is sent,
  // so an old text message cannot be used after a new one arrives.
  await prisma.otpCode.updateMany({
    where: { identifier, purpose: input.purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  })

  await prisma.otpCode.create({
    data: {
      identifier,
      channel: input.channel,
      purpose: input.purpose,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt,
      ipAddress: input.ipAddress ?? null,
    },
  })

  // TODO: send by email or SMS once a sending domain is verified. While the code
  // is pinned there is nothing to send.
  return {
    ok: true,
    expiresAt,
    pinned: isOtpPinned,
    // Surfaced in development only, so the flow can be walked without a phone.
    devCode: process.env.NODE_ENV === 'development' ? code : null,
  }
}

export async function verifyOtp(input: {
  identifier: string
  purpose: OtpPurpose
  code: string
}): Promise<VerifyOutcome> {
  const settings = await getSettings()
  const identifier = normaliseIdentifier(input.identifier)

  const record = await prisma.otpCode.findFirst({
    where: { identifier, purpose: input.purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) return { ok: false, reason: 'NO_CODE' }

  if (record.expiresAt < new Date()) {
    return { ok: false, reason: 'EXPIRED' }
  }

  if (record.attempts >= settings['otp.maxAttempts']) {
    return { ok: false, reason: 'TOO_MANY_ATTEMPTS' }
  }

  const matches = await bcrypt.compare(input.code.trim(), record.codeHash)

  if (!matches) {
    const updated = await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    })
    return {
      ok: false,
      reason: 'INCORRECT',
      attemptsLeft: Math.max(0, settings['otp.maxAttempts'] - updated.attempts),
    }
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
  return { ok: true }
}

/** Lower-cased email, or a mobile number stripped of spaces and punctuation. */
export function normaliseIdentifier(value: string): string {
  const trimmed = value.trim()
  if (trimmed.includes('@')) return trimmed.toLowerCase()
  return trimmed.replace(/[\s()-]/g, '').replace(/^\+44/, '0')
}

export function identifierChannel(value: string): OtpChannel {
  return value.includes('@') ? 'EMAIL' : 'SMS'
}
