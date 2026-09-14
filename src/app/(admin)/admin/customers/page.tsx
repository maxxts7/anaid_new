import Link from 'next/link'
import type { Route } from 'next'
import type { Metadata } from 'next'
import { Search, UserPlus } from 'lucide-react'
import { AccountStatusBadge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { requireStaff } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'
import { staffCan } from '@/lib/permissions'
import { cn } from '@/lib/cn'
import type { AccountStatus } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Customers' }

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PENDING_APPROVAL', label: 'Awaiting approval' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'REJECTED', label: 'Not approved' },
  { value: 'REGISTERED', label: 'Unverified' },
]

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { staff } = await requireStaff('customers.view')
  const { q, status } = await searchParams

  const search = q?.trim()

  const customers = await prisma.customer.findMany({
    where: {
      status: FILTERS.some((filter) => filter.value === status && filter.value)
        ? (status as AccountStatus)
        : undefined,
      ...(search
        ? {
            OR: [
              { businessName: { contains: search, mode: 'insensitive' as const } },
              { contactName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { mobile: { contains: search } },
              { customerNumber: { contains: search, mode: 'insensitive' as const } },
              { postcode: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: 'asc' }, { businessName: 'asc' }],
    include: { pricingLevel: { select: { name: true } }, _count: { select: { orders: true } } },
    take: 200,
  })

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display font-bold">Customers</h1>
          <p className="tnum mt-1 text-small text-ink-muted">
            {customers.length} {customers.length === 1 ? 'account' : 'accounts'}
          </p>
        </div>

        {staffCan(staff.roles, 'customers.create') && (
          <ButtonLink href="/admin/customers/new">
            <UserPlus className="size-4" />
            Add a customer
          </ButtonLink>
        )}
      </div>

      <form className="mt-5 flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Business, contact, postcode or account number"
            className="h-10 w-full rounded-sm border border-hairline-strong bg-surface pr-3 pl-9 text-base focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
          />
        </div>
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <div className="table-scroll mt-3">
        <ul className="flex gap-1.5 pb-1">
          {FILTERS.map((filter) => {
            const href = (filter.value
              ? `/admin/customers?status=${filter.value}${search ? `&q=${encodeURIComponent(search)}` : ''}`
              : `/admin/customers${search ? `?q=${encodeURIComponent(search)}` : ''}`) as Route
            const active = (status ?? '') === filter.value

            return (
              <li key={filter.label}>
                <Link
                  href={href}
                  className={cn(
                    'inline-flex h-8 items-center rounded-sm border px-3 text-small whitespace-nowrap',
                    active
                      ? 'border-ink bg-ink text-ink-inverse'
                      : 'border-hairline-strong bg-surface text-ink-muted hover:bg-sunken'
                  )}
                >
                  {filter.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="table-scroll mt-4 rounded-lg border border-hairline bg-surface">
        <table className="w-full min-w-[860px] text-small">
          <thead className="border-b border-hairline bg-sunken text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Business</th>
              <th className="px-4 py-2.5 font-medium">Account</th>
              <th className="px-4 py-2.5 font-medium">Contact</th>
              <th className="px-4 py-2.5 font-medium">Level</th>
              <th className="px-4 py-2.5 font-medium">Credit</th>
              <th className="px-4 py-2.5 font-medium">Orders</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-hairline last:border-b-0 hover:bg-sunken">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${customer.id}`} className="font-medium hover:text-accent">
                    {customer.businessName}
                  </Link>
                  <span className="tnum mt-0.5 block text-micro text-ink-muted">{customer.postcode}</span>
                </td>
                <td className="tnum px-4 py-3 text-ink-muted">{customer.customerNumber ?? '—'}</td>
                <td className="px-4 py-3">
                  {customer.contactName}
                  <span className="tnum mt-0.5 block text-micro text-ink-muted">{customer.mobile}</span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{customer.pricingLevel?.name ?? '—'}</td>
                <td className="tnum px-4 py-3 text-ink-muted">
                  {customer.creditLimitPence > 0 ? formatPence(customer.creditLimitPence) : '—'}
                </td>
                <td className="tnum px-4 py-3 text-ink-muted">{customer._count.orders}</td>
                <td className="px-4 py-3">
                  <AccountStatusBadge status={customer.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customers.length === 0 && (
          <p className="px-4 py-12 text-center text-small text-ink-muted">
            No customers match that search.
          </p>
        )}
      </div>
    </div>
  )
}
