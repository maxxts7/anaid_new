import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { getCustomerSession, getStaffSession, type CustomerSession } from './session'
import { canPlaceOrders, canSeePrices, staffCan, type Capability } from '../permissions'

/**
 * Guards.
 *
 * Every page and every action that is not public begins with a call into this
 * file. The rule from LEVEL-1 — "hiding a price on the screen is not security;
 * refusing to send the price at all is security" — is only true if these are
 * used consistently, so they are deliberately the easiest thing to reach for.
 */

/** Signed in as a customer, whatever their account status. */
export async function requireCustomer(): Promise<CustomerSession> {
  const session = await getCustomerSession()
  if (!session) redirect('/login')
  return session
}

/**
 * Signed in AND approved. Anything that would reveal a price or accept an order
 * must go through here, never through requireCustomer.
 *
 * Unapproved customers are sent to the holding screen that explains their
 * position rather than to a dead end.
 */
export async function requireApprovedCustomer(): Promise<CustomerSession> {
  const session = await requireCustomer()

  if (!canSeePrices(session.customer.status)) {
    redirect('/account/status')
  }

  return session
}

/** As above, for the actions that create orders. */
export async function requireOrderingCustomer(): Promise<CustomerSession> {
  const session = await requireCustomer()

  if (!canPlaceOrders(session.customer.status)) {
    redirect('/account/status')
  }

  return session
}

export type StaffSession = NonNullable<Awaited<ReturnType<typeof getStaffSession>>>

/**
 * Signed in as staff, holding `capability` if one is named.
 *
 * A member of staff who lacks the capability is sent to their own dashboard
 * rather than shown a 403 — the navigation already hides what they cannot use,
 * so arriving here usually means a stale link.
 */
export async function requireStaff(capability?: Capability): Promise<StaffSession> {
  const session = await getStaffSession()
  if (!session) redirect('/admin/login')

  if (capability && !staffCan(session.staff.roles, capability)) {
    redirect(`/admin?denied=${encodeURIComponent(capability)}` as Route)
  }

  return session
}

/**
 * What the current visitor is allowed to see of the catalogue.
 *
 * The catalogue is public, so this never redirects. It returns the pricing
 * context, and `showPrices: false` means no price is fetched at all — not
 * fetched and hidden.
 */
export async function catalogueViewer() {
  const session = await getCustomerSession()

  if (!session) {
    return { showPrices: false as const, customer: null, user: null }
  }

  return {
    showPrices: canSeePrices(session.customer.status),
    customer: session.customer,
    user: session.user,
  }
}
