import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Check, ChevronLeft, CircleCheck } from 'lucide-react'
import { CancelOrder } from '@/components/customer/cancel-order'
import { OrderStatusBadge, ORDER_STATUS_LABELS } from '@/components/ui/badge'
import { requireCustomer } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'
import { cn } from '@/lib/cn'
import type { OrderStatus } from '@/generated/prisma/client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}): Promise<Metadata> {
  const { orderNumber } = await params
  return { title: `Order ${orderNumber}` }
}

/** The path an order travels. Cancellation steps outside it. */
const PROGRESS: OrderStatus[] = [
  'RECEIVED',
  'CONFIRMED',
  'PROCESSING',
  'PICKING',
  'PACKED',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ placed?: string }>
}) {
  const [{ orderNumber }, { placed }] = await Promise.all([params, searchParams])
  const session = await requireCustomer()

  const order = await prisma.order.findFirst({
    where: { orderNumber, customerId: session.customer.id },
    include: {
      lines: { orderBy: { createdAt: 'asc' } },
      statusChanges: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!order) notFound()

  const currentStep = PROGRESS.indexOf(order.status)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/orders" className="inline-flex items-center gap-1 text-small text-ink-muted hover:text-ink">
        <ChevronLeft className="size-4" />
        Your orders
      </Link>

      {placed && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-approved/20 bg-approved-soft px-4 py-3 text-approved">
          <CircleCheck className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Order placed</p>
            <p className="mt-0.5 text-small">
              We have it. You will get a message when it is confirmed and again when it is on its way.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="tnum text-display font-bold">{order.orderNumber}</h1>
          <p className="tnum mt-1 text-small text-ink-muted">
            Placed{' '}
            {order.placedAt.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status !== 'CANCELLED' && (
        <ol className="mt-6 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {PROGRESS.map((status, index) => {
            const done = index <= currentStep
            return (
              <li key={status} className="flex flex-col gap-1.5">
                <span
                  className={cn('h-1 rounded-full', done ? 'bg-accent' : 'bg-hairline')}
                  aria-hidden
                />
                <span
                  className={cn(
                    'text-[10px] leading-tight',
                    done ? 'font-medium text-ink' : 'text-ink-faint'
                  )}
                >
                  {ORDER_STATUS_LABELS[status]}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-hairline bg-surface">
        <table className="w-full text-small">
          <thead className="border-b border-hairline bg-sunken text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 text-right font-medium">Qty</th>
              <th className="px-4 py-2 text-right font-medium">Unit</th>
              <th className="px-4 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.id} className="border-b border-hairline last:border-b-0">
                <td className="px-4 py-2.5">
                  <span className="font-medium">{line.name}</span>
                  <span className="tnum mt-0.5 block text-micro text-ink-muted">
                    {line.sku}
                    {line.packSummary ? `, ${line.packSummary}` : ''}
                  </span>
                </td>
                <td className="tnum px-4 py-2.5 text-right">{line.quantity}</td>
                <td className="tnum px-4 py-2.5 text-right">{formatPence(line.unitPricePence)}</td>
                <td className="tnum px-4 py-2.5 text-right font-medium">
                  {formatPence(line.lineNetPence)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="space-y-1.5 border-t border-hairline bg-sunken px-4 py-3 text-small">
          <Row label="Subtotal" value={formatPence(order.subtotalPence)} />
          <Row label="VAT" value={formatPence(order.vatTotalPence)} />
          <Row
            label="Delivery"
            value={order.deliveryChargePence === 0 ? 'Free' : formatPence(order.deliveryChargePence)}
          />
          <div className="flex justify-between border-t border-hairline-strong pt-1.5 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tnum">{formatPence(order.totalPence)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Panel title="Delivery address">
          <p className="tnum text-small text-ink-muted">
            {[
              order.deliveryName,
              order.deliveryLine1,
              order.deliveryLine2,
              order.deliveryCity,
              order.deliveryPostcode,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
          {order.deliveryInstructions && (
            <p className="mt-2 text-micro text-ink-muted">{order.deliveryInstructions}</p>
          )}
          {order.preferredDeliveryDate && (
            <p className="tnum mt-2 text-micro text-ink-muted">
              Requested for {order.preferredDeliveryDate.toLocaleDateString('en-GB')}
            </p>
          )}
        </Panel>

        <Panel title="Order details">
          <dl className="space-y-1 text-small text-ink-muted">
            <Row label="Contact" value={order.contactPhone} />
            {order.poReference && <Row label="Your reference" value={order.poReference} />}
            <Row label="Payment" value="On account" />
          </dl>
        </Panel>
      </div>

      {order.statusChanges.length > 1 && (
        <Panel title="History" className="mt-4">
          <ol className="space-y-2 text-small">
            {order.statusChanges.map((change) => (
              <li key={change.id} className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-approved" />
                <span>
                  {ORDER_STATUS_LABELS[change.toStatus]}
                  <span className="tnum ml-2 text-micro text-ink-faint">
                    {change.createdAt.toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {order.status === 'RECEIVED' && (
        <div className="mt-6">
          <CancelOrder orderNumber={order.orderNumber} />
        </div>
      )}

      {order.status === 'CANCELLED' && order.cancellationReason && (
        <p className="mt-6 rounded-lg border border-hairline bg-surface p-4 text-small text-ink-muted">
          Cancelled: {order.cancellationReason}
        </p>
      )}
    </div>
  )
}

function Panel({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-lg border border-hairline bg-surface p-4', className)}>
      <h2 className="mb-2 font-medium">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className="tnum text-ink">{value}</dd>
    </div>
  )
}
