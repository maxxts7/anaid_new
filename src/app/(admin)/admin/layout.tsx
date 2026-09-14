import Link from 'next/link'
import type { Metadata, Route } from 'next'
import { AdminNav, type NavItem } from '@/components/admin/admin-nav'
import { Button } from '@/components/ui/button'
import { getStaffSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { ROLE_LABELS, staffCan } from '@/lib/permissions'
import { signOutStaff } from './login/actions'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · ANAID Admin' },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession()

  // The sign-in page lives under /admin too, and must render without a shell.
  if (!session) return <>{children}</>

  const { staff } = session

  const awaitingApproval = staffCan(staff.roles, 'customers.approve')
    ? await prisma.customer.count({ where: { status: 'PENDING_APPROVAL' } })
    : 0

  const items: NavItem[] = [
    { href: '/admin' as Route, label: 'Dashboard', icon: 'dashboard' },
    ...(staffCan(staff.roles, 'customers.approve')
      ? [{ href: '/admin/approvals' as Route, label: 'Approvals', icon: 'approvals' as const, badge: awaitingApproval }]
      : []),
    ...(staffCan(staff.roles, 'customers.view')
      ? [{ href: '/admin/customers' as Route, label: 'Customers', icon: 'customers' as const }]
      : []),
    ...(staffCan(staff.roles, 'orders.view')
      ? [{ href: '/admin/orders' as Route, label: 'Orders', icon: 'orders' as const }]
      : []),
    ...(staffCan(staff.roles, 'products.view')
      ? [{ href: '/admin/products' as Route, label: 'Products', icon: 'products' as const }]
      : []),
    ...(staffCan(staff.roles, 'pricing.view')
      ? [{ href: '/admin/pricing' as Route, label: 'Pricing levels', icon: 'pricing' as const }]
      : []),
    ...(staffCan(staff.roles, 'settings.manage')
      ? [{ href: '/admin/settings' as Route, label: 'Settings', icon: 'settings' as const }]
      : []),
  ]

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="border-b border-hairline bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3 lg:block">
          <Link href="/admin" className="block">
            <span className="text-lead font-bold tracking-[-0.03em]">
              ANAID
            </span>
            <span className="ml-2 text-micro text-ink-muted lg:ml-0 lg:block">Staff dashboard</span>
          </Link>
        </div>

        <AdminNav items={items} />

        <div className="hidden border-t border-hairline p-3 lg:block">
          <p className="text-small font-medium">{staff.name}</p>
          <p className="mt-0.5 text-micro text-ink-muted">
            {staff.roles.map((role) => ROLE_LABELS[role]).join(', ')}
          </p>
          <form action={signOutStaff} className="mt-2">
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 bg-ground">{children}</main>
    </div>
  )
}
