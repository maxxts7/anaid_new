import type { AccountStatus, StaffRole } from '../generated/prisma/client'

/**
 * The permission rules, in one file, expressed once.
 *
 * LEVEL-4 §3 (the permission matrix) and §27 (staff roles) are both encoded
 * here. Nothing else in the codebase is allowed to decide who may see a price
 * or place an order — screens ask these functions.
 */

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

/**
 * THE CENTRAL RULE.
 *
 * A customer sees a price only when an administrator has approved the account.
 * Verifying a telephone number is not approval. Nothing else grants it.
 */
export function canSeePrices(status: AccountStatus): boolean {
  return status === 'APPROVED'
}

/** Ordering requires approval too, and is checked again server-side at checkout. */
export function canPlaceOrders(status: AccountStatus): boolean {
  return status === 'APPROVED'
}

/** Every status may browse the catalogue. That is the point of the catalogue. */
export function canBrowseCatalogue(): boolean {
  return true
}

/**
 * A suspended customer keeps sight of existing orders and invoices — suspension
 * is usually for non-payment, and a customer who cannot see an invoice cannot
 * pay it (gap #7). Rejected accounts keep the same view of their history.
 */
export function canSeeOwnOrderHistory(status: AccountStatus): boolean {
  return status === 'APPROVED' || status === 'SUSPENDED' || status === 'REJECTED'
}

/** Whether the account has reached a state where a dashboard makes sense. */
export function hasVerifiedContact(status: AccountStatus): boolean {
  return status !== 'REGISTERED'
}

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  REGISTERED: 'Not yet verified',
  PENDING_APPROVAL: 'Awaiting approval',
  APPROVED: 'Approved',
  REJECTED: 'Not approved',
  SUSPENDED: 'Suspended',
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

/**
 * What a member of staff may do. Deliberately fine-grained: a warehouse picker
 * must not be able to change a price, and a delivery driver must not be able to
 * read a customer's credit limit.
 */
export type Capability =
  | 'customers.view'
  | 'customers.approve'
  | 'customers.edit'
  | 'customers.create'
  | 'customers.credit'
  | 'products.view'
  | 'products.edit'
  | 'pricing.view'
  | 'pricing.edit'
  | 'orders.view'
  | 'orders.amend'
  | 'orders.advance'
  | 'orders.cancel'
  | 'inventory.view'
  | 'inventory.adjust'
  | 'delivery.view'
  | 'delivery.update'
  | 'invoices.view'
  | 'invoices.manage'
  | 'reports.view'
  | 'settings.manage'
  | 'staff.manage'
  | 'audit.view'

const SALES: Capability[] = [
  'customers.view',
  'customers.approve',
  'customers.edit',
  'customers.create',
  'customers.credit',
  'products.view',
  'products.edit',
  'pricing.view',
  'pricing.edit',
  'orders.view',
  'orders.amend',
  'orders.advance',
  'orders.cancel',
  'inventory.view',
  'delivery.view',
  'invoices.view',
  'reports.view',
]

const WAREHOUSE: Capability[] = [
  'products.view',
  'orders.view',
  'orders.advance',
  'inventory.view',
  'inventory.adjust',
  'delivery.view',
]

const ACCOUNTS: Capability[] = [
  'customers.view',
  'customers.credit',
  'orders.view',
  'invoices.view',
  'invoices.manage',
  'reports.view',
]

const DELIVERY: Capability[] = ['orders.view', 'delivery.view', 'delivery.update']

const ALL: Capability[] = [
  'customers.view',
  'customers.approve',
  'customers.edit',
  'customers.create',
  'customers.credit',
  'products.view',
  'products.edit',
  'pricing.view',
  'pricing.edit',
  'orders.view',
  'orders.amend',
  'orders.advance',
  'orders.cancel',
  'inventory.view',
  'inventory.adjust',
  'delivery.view',
  'delivery.update',
  'invoices.view',
  'invoices.manage',
  'reports.view',
  'settings.manage',
  'staff.manage',
  'audit.view',
]

export const ROLE_CAPABILITIES: Record<StaffRole, Capability[]> = {
  SUPER_ADMIN: ALL,
  SALES_ADMIN: SALES,
  WAREHOUSE,
  ACCOUNTS,
  DELIVERY,
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  SUPER_ADMIN: 'Super Administrator',
  SALES_ADMIN: 'Sales Administrator',
  WAREHOUSE: 'Warehouse Staff',
  ACCOUNTS: 'Accounts Staff',
  DELIVERY: 'Delivery Staff',
}

/** Staff may hold several roles (gap #24); capabilities are the union. */
export function capabilitiesFor(roles: StaffRole[]): Set<Capability> {
  const capabilities = new Set<Capability>()
  for (const role of roles) {
    for (const capability of ROLE_CAPABILITIES[role]) {
      capabilities.add(capability)
    }
  }
  return capabilities
}

export function staffCan(roles: StaffRole[], capability: Capability): boolean {
  return roles.some((role) => ROLE_CAPABILITIES[role].includes(capability))
}
