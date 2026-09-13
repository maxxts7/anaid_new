import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '../db'
import { getSettings } from '../settings'

/**
 * Sessions.
 *
 * A signed cookie carries nothing but a session id. The session itself is a row
 * in the database, so that suspending a customer or disabling a member of staff
 * takes effect on their very next request rather than whenever a token happens
 * to expire.
 *
 * Customers and staff use separate cookies. One person may legitimately be both
 * — a member of staff testing the customer application — and the two must never
 * overwrite each other.
 */

const CUSTOMER_COOKIE = 'anaid_customer'
const STAFF_COOKIE = 'anaid_staff'

export type SessionKind = 'customer' | 'staff'

function cookieName(kind: SessionKind) {
  return kind === 'customer' ? CUSTOMER_COOKIE : STAFF_COOKIE
}

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET
  if (!value || value.length < 16) {
    throw new Error('SESSION_SECRET is missing or too short. Generate one with: openssl rand -base64 32')
  }
  return new TextEncoder().encode(value)
}

async function requestContext() {
  const headerList = await headers()
  return {
    userAgent: headerList.get('user-agent')?.slice(0, 500) ?? null,
    ipAddress:
      headerList.get('x-nf-client-connection-ip') ??
      headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      null,
  }
}

/**
 * Start a session and set the cookie. Only callable from a Server Action or a
 * Route Handler — Next forbids writing cookies while rendering.
 */
export async function createSession(kind: SessionKind, subjectId: string): Promise<void> {
  const settings = await getSettings()
  const days = kind === 'customer' ? settings['auth.sessionDays'] : 1
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const context = await requestContext()

  const session = await prisma.session.create({
    data: {
      customerUserId: kind === 'customer' ? subjectId : null,
      staffId: kind === 'staff' ? subjectId : null,
      expiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    },
  })

  const token = await new SignJWT({ sid: session.id, kind })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret())

  const jar = await cookies()
  jar.set(cookieName(kind), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

async function readSessionId(kind: SessionKind): Promise<string | null> {
  const jar = await cookies()
  const token = jar.get(cookieName(kind))?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    return payload.kind === kind && typeof payload.sid === 'string' ? payload.sid : null
  } catch {
    // Expired, tampered with, or signed by an older SESSION_SECRET.
    return null
  }
}

export type CustomerSession = NonNullable<Awaited<ReturnType<typeof loadCustomerSession>>>

async function loadCustomerSession() {
  const sessionId = await readSessionId('customer')
  if (!sessionId) return null

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      customerUser: {
        include: {
          customer: { include: { pricingLevel: true } },
        },
      },
    },
  })

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null
  if (!session.customerUser || session.customerUser.disabledAt) return null

  return {
    sessionId: session.id,
    user: session.customerUser,
    customer: session.customerUser.customer,
  }
}

async function loadStaffSession() {
  const sessionId = await readSessionId('staff')
  if (!sessionId) return null

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { staff: true },
  })

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null
  if (!session.staff || !session.staff.active) return null

  return { sessionId: session.id, staff: session.staff }
}

/**
 * Memoised for the duration of one request, so a page, its layout and half a
 * dozen components can all ask "who is this?" without repeating the query.
 */
export const getCustomerSession = cache(loadCustomerSession)
export const getStaffSession = cache(loadStaffSession)

export async function endSession(kind: SessionKind): Promise<void> {
  const sessionId = await readSessionId(kind)
  if (sessionId) {
    await prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  const jar = await cookies()
  jar.delete(cookieName(kind))
}

/** Used when an account is suspended or rejected — access stops immediately. */
export async function revokeCustomerSessions(customerId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { customerUser: { customerId }, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeStaffSessions(staffId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { staffId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
