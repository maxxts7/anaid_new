import Link from 'next/link'
import type { Metadata } from 'next'
import { ReceiptText } from 'lucide-react'
import { OrderStatusBadge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { requireCustomer } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'
import { canSeeOwnOrderHistory } from '@/lib/permissions'

export const metadata: Metadata = { title: 'Your orders' }

export default async function OrdersPage() {
  const session = await requireCustomer()

  // A suspended or rejected customer keeps sight of their history — suspension
  // is usually for non-payment, and they need to see what they owe (gap #7).
  if (!canSeeOwnOrderHistory(session.customer.status)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ReceiptText className="mx-auto size-7 text-ink-faint" />
        <h1 className="mt-4 text-title font-semibold">No orders yet</h1>
        <p className="mt-2 text-ink-muted">
          Your orders will appear here once your account is approved and you have placed one.
        </p>
        <ButtonLink href="/products" className="mt-6">
          Browse the catalogue
        </ButtonLink>
      </div>
    )
  }

  const orders = await prisma.order.findMany({
    where: { customerId: session.customer.id },
    orderBy: { placedAt: 'desc' },
    include: { _count: { select: { lines: true } } },
  })

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ReceiptText className="mx-auto size-7 text-ink-faint" />
        <h1 className="mt-4 text-title font-semibold">No orders yet</h1>
        <p className="mt-2 text-ink-muted">When you place your first order it will appear here.</p>
        <ButtonLink href="/products" className="mt-6">
          Browse the catalogue
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-display font-semibold">Your orders</h1>

      <ul className="mt-6 overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs">
        {orders.map((order) => (
          <li key={order.id} className="border-b border-hairline last:border-b-0">
            <Link
              href={`/orders/${order.orderNumber}`}
              className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-sunken"
            >
              <div>
                <p className="tnum font-semibold">{order.orderNumber}</p>
                <p className="tnum mt-0.5 text-small text-ink-muted">
                  {order.placedAt.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {` · ${order._count.lines} ${order._count.lines === 1 ? 'line' : 'lines'}`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <OrderStatusBadge status={order.status} />
                <span className="tnum w-24 text-right font-semibold">{formatPence(order.totalPence)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
