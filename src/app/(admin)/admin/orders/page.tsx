import Link from 'next/link'
import type { Route } from 'next'
import type { Metadata } from 'next'
import { ClipboardList } from 'lucide-react'
import { OrderStatusBadge, ORDER_STATUS_LABELS } from '@/components/ui/badge'
import { requireStaff } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'
import { ORDER_SEQUENCE } from '@/lib/orders'
import { cn } from '@/lib/cn'
import type { OrderStatus } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Orders' }

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  await requireStaff('orders.view')
  const { status, q } = await searchParams

  const search = q?.trim()
  const filtered = ORDER_SEQUENCE.includes(status as OrderStatus) || status === 'CANCELLED'

  const orders = await prisma.order.findMany({
    where: {
      status: filtered ? (status as OrderStatus) : undefined,
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' as const } },
              { customer: { businessName: { contains: search, mode: 'insensitive' as const } } },
              { poReference: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { placedAt: 'desc' },
    include: {
      customer: { select: { businessName: true, customerNumber: true } },
      _count: { select: { lines: true } },
    },
    take: 200,
  })

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-display font-semibold">Orders</h1>
      <p className="tnum mt-1 text-small text-ink-muted">
        {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        {filtered ? ` at ${ORDER_STATUS_LABELS[status as OrderStatus].toLowerCase()}` : ''}
      </p>

      <form className="mt-5">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Order number, business or your reference"
          className="h-10 w-full max-w-md rounded-sm border border-hairline-strong bg-surface px-3 text-base focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
        />
      </form>

      <div className="table-scroll mt-3">
        <ul className="flex gap-1.5 pb-1">
          <FilterChip href="/admin/orders" active={!filtered}>
            All
          </FilterChip>
          {[...ORDER_SEQUENCE, 'CANCELLED' as const].map((value) => (
            <FilterChip
              key={value}
              href={`/admin/orders?status=${value}` as Route}
              active={status === value}
            >
              {ORDER_STATUS_LABELS[value]}
            </FilterChip>
          ))}
        </ul>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-hairline-strong bg-surface px-6 py-16 text-center">
          <ClipboardList className="mx-auto size-6 text-ink-faint" />
          <p className="mt-3 font-medium">No orders here</p>
          <p className="mt-1 text-small text-ink-muted">Orders appear the moment a customer places one.</p>
        </div>
      ) : (
        <div className="table-scroll mt-4 rounded-lg border border-hairline bg-surface shadow-xs">
          <table className="w-full min-w-[820px] text-small">
            <thead className="border-b border-hairline bg-sunken text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Placed</th>
                <th className="px-4 py-2.5 font-medium">Lines</th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-hairline last:border-b-0 hover:bg-sunken">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.orderNumber}`}
                      className="tnum font-medium hover:text-accent"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {order.customer.businessName}
                    <span className="tnum mt-0.5 block text-micro text-ink-muted">
                      {order.customer.customerNumber}
                    </span>
                  </td>
                  <td className="tnum px-4 py-3 text-ink-muted">
                    {order.placedAt.toLocaleDateString('en-GB')}
                  </td>
                  <td className="tnum px-4 py-3 text-ink-muted">{order._count.lines}</td>
                  <td className="tnum px-4 py-3 font-medium">{formatPence(order.totalPence)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: Route
  active: boolean
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          'inline-flex h-8 items-center rounded-sm border px-3 text-small whitespace-nowrap',
          active
            ? 'border-ink bg-ink text-ink-inverse'
            : 'border-hairline-strong bg-surface text-ink-muted hover:bg-sunken'
        )}
      >
        {children}
      </Link>
    </li>
  )
}
