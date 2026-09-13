import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { AdvanceOrder, CancelOrderAsStaff, InternalNote } from '@/components/admin/order-controls'
import { OrderStatusBadge, ORDER_STATUS_LABELS } from '@/components/ui/badge'
import { requireStaff } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'
import { ADVANCE_LABELS, nextStatus } from '@/lib/orders'
import { PRICE_SOURCE_LABELS } from '@/lib/pricing'
import { staffCan } from '@/lib/permissions'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}): Promise<Metadata> {
  const { orderNumber } = await params
  return { title: orderNumber }
}

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params
  const { staff } = await requireStaff('orders.view')

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      customer: { select: { id: true, businessName: true, customerNumber: true, status: true } },
      placedBy: { select: { name: true } },
      lines: { orderBy: { createdAt: 'asc' } },
      statusChanges: {
        orderBy: { createdAt: 'desc' },
        include: { staff: { select: { name: true } } },
      },
    },
  })

  if (!order) notFound()

  const upcoming = nextStatus(order.status)
  const canAdvance = staffCan(staff.roles, 'orders.advance')

  return (
    <div className="p-4 lg:p-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-small text-ink-muted hover:text-ink">
        <ChevronLeft className="size-4" />
        Orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="tnum text-display font-semibold">{order.orderNumber}</h1>
          <p className="mt-1 text-small text-ink-muted">
            <Link href={`/admin/customers/${order.customer.id}`} className="font-medium hover:text-accent">
              {order.customer.businessName}
            </Link>
            <span className="tnum"> — {order.customer.customerNumber}</span>
            {order.placedBy && ` — placed by ${order.placedBy.name}`}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs">
            <div className="table-scroll">
              <table className="w-full min-w-[620px] text-small">
                <thead className="border-b border-hairline bg-sunken text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Item</th>
                    <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                    <th className="px-4 py-2.5 text-right font-medium">Unit</th>
                    <th className="px-4 py-2.5 text-right font-medium">VAT</th>
                    <th className="px-4 py-2.5 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((line) => (
                    <tr key={line.id} className="border-b border-hairline last:border-b-0">
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{line.name}</span>
                        <span className="tnum mt-0.5 block text-micro text-ink-muted">
                          {line.sku}
                          {line.packSummary ? `, ${line.packSummary}` : ''} —{' '}
                          {PRICE_SOURCE_LABELS[line.priceSource]}
                          {line.standardPricePence > line.unitPricePence &&
                            ` (list ${formatPence(line.standardPricePence)})`}
                        </span>
                      </td>
                      <td className="tnum px-4 py-2.5 text-right">{line.quantity}</td>
                      <td className="tnum px-4 py-2.5 text-right">{formatPence(line.unitPricePence)}</td>
                      <td className="tnum px-4 py-2.5 text-right text-ink-muted">
                        {formatPence(line.lineVatPence)}
                      </td>
                      <td className="tnum px-4 py-2.5 text-right font-medium">
                        {formatPence(line.lineNetPence)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Panel title="Deliver to">
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
              <p className="tnum mt-2 text-small">{order.contactPhone}</p>
              {order.deliveryInstructions && (
                <p className="mt-2 rounded-sm bg-sunken p-2 text-micro">{order.deliveryInstructions}</p>
              )}
              {order.preferredDeliveryDate && (
                <p className="tnum mt-2 text-micro text-ink-muted">
                  Requested for {order.preferredDeliveryDate.toLocaleDateString('en-GB')}
                </p>
              )}
            </Panel>

            <Panel title="Invoice to">
              <p className="tnum text-small text-ink-muted">
                {[
                  order.billingName,
                  order.billingLine1,
                  order.billingLine2,
                  order.billingCity,
                  order.billingPostcode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {order.poReference && (
                <p className="tnum mt-2 text-small">Their reference: {order.poReference}</p>
              )}
              <p className="mt-2 text-small text-ink-muted">Payment on account</p>
            </Panel>
          </div>

          {order.customerNotes && (
            <Panel title="From the customer">
              <p className="text-small">{order.customerNotes}</p>
            </Panel>
          )}

          <Panel title="History">
            <ol className="space-y-2 text-small">
              {order.statusChanges.map((change) => (
                <li key={change.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {ORDER_STATUS_LABELS[change.toStatus]}
                    {change.note && <span className="text-ink-muted"> — {change.note}</span>}
                  </span>
                  <span className="tnum text-micro text-ink-faint">
                    {change.staff?.name ?? 'Customer'} —{' '}
                    {change.createdAt.toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-4">
          {canAdvance && upcoming && order.status !== 'CANCELLED' && (
            <Panel title="Next step" padded>
              <AdvanceOrder
                orderNumber={order.orderNumber}
                toStatus={upcoming}
                label={ADVANCE_LABELS[order.status]}
                warning={
                  upcoming === 'DISPATCHED'
                    ? 'This takes the goods off the shelf: reserved stock becomes stock that has left.'
                    : undefined
                }
              />
            </Panel>
          )}

          {order.status === 'CANCELLED' && (
            <Panel title="Cancelled" padded>
              <p className="text-small text-ink-muted">{order.cancellationReason}</p>
            </Panel>
          )}

          <Panel title="Internal notes" padded>
            <InternalNote orderNumber={order.orderNumber} defaultValue={order.internalNotes ?? ''} />
          </Panel>

          {staffCan(staff.roles, 'orders.cancel') && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <Panel title="Other actions" padded>
              <CancelOrderAsStaff orderNumber={order.orderNumber} />
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

function Panel({
  title,
  children,
  padded,
}: {
  title: string
  children: React.ReactNode
  padded?: boolean
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs">
      <h2 className="border-b border-hairline px-4 py-2.5 font-medium">{title}</h2>
      <div className={padded ? 'p-4' : 'p-4'}>{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tnum">{value}</dd>
    </div>
  )
}
