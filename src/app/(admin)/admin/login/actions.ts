'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth/session'
import { recordAudit } from '@/lib/audit'

export type StaffLoginState = { message?: string }

/**
 * Staff sign-in.
 *
 * Email and password, on a separate route and a separate cookie from the
 * customer application: staff work on shared office machines and cannot wait
 * for a code on a personal phone, and one person may legitimately be both a
 * member of staff and a customer.
 */
export async function signInStaff(
  _previous: StaffLoginState,
  formData: FormData
): Promise<StaffLoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { message: 'Enter your email address and password.' }
  }

  const staff = await prisma.staff.findUnique({ where: { email } })

  // Same message either way: a sign-in form should not confirm which email
  // addresses belong to ANAID staff.
  const failure = { message: 'That email address and password do not match.' }

  if (!staff || !staff.active) return failure

  const matches = await bcrypt.compare(password, staff.passwordHash)
  if (!matches) return failure

  await prisma.staff.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } })
  await createSession('staff', staff.id)

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'staff.signed_in',
    entityType: 'Staff',
    entityId: staff.id,
  })

  redirect('/admin')
}

export async function signOutStaff() {
  const { endSession } = await import('@/lib/auth/session')
  await endSession('staff')
  redirect('/admin/login')
}
