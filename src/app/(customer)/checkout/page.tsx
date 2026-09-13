import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CheckoutForm } from '@/components/customer/checkout-form'
import { requireOrderingCustomer } from '@/lib/auth/guards'
import { buildOrderDraft, creditCheck } from '@/lib/basket'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'

export const metadata: Metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const session = await requireOrderingCustomer()

  const [basketLines, addresses] = await Promise.all([
    prisma.basketLine.findMany({
      where: { basket: { userId: session.user.id } },
      select: { productId: true, quantity: true },
    }),
    prisma.address.findMany({
      where: { customerId: session.customer.id, archivedAt: null },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (basketLines.length === 0) redirect('/basket')

  const draft = await buildOrderDraft(session.customer, basketLines)
  if (draft.blockers.length > 0) redirect('/basket')

  const credit = await creditCheck(session.customer, draft.totalPence)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-display font-semibold">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-hairline bg-surface shadow-xs p-5">
          <CheckoutForm
            addresses={addresses.map((address) => ({
              id: address.id,
              label: [address.label, address.line1, address.city, address.postcode]
                .filter(Boolean)
                .join(', '),
              isDefaultDelivery: address.isDefaultDelivery,
              isDefaultBilling: address.isDefaultBilling,
            }))}
            defaultPhone={session.customer.mobile}
            earliestDeliveryDate={tomorrow.toISOString().slice(0, 10)}
            totalLabel={formatPence(draft.totalPence)}
            disabled={credit.wouldExceed}
          />
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-20">
          <div className="rounded-lg border border-hairline bg-surface shadow-xs p-4">
            <h2 className="font-semibold">Your order</h2>

            <ul className="mt-3 space-y-2 text-small">
              {draft.lines.map((line) => (
                <li key={line.productId} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    <span className="tnum text-ink-muted">{line.quantity} ×</span> {line.name}
                  </span>
                  <span className="tnum shrink-0">{formatPence(line.lineNetPence)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-hairline pt-3 text-small">
              <Line label="Subtotal" value={formatPence(draft.subtotalPence)} />
              <Line label="VAT" value={formatPence(draft.vatTotalPence)} />
              <Line
                label="Delivery"
                value={draft.deliveryChargePence === 0 ? 'Free' : formatPence(draft.deliveryChargePence)}
              />
              <div className="flex justify-between border-t border-hairline pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tnum">{formatPence(draft.totalPence)}</dd>
              </div>
            </dl>
          </div>

          {credit.required && (
            <div
              className={`rounded-md border p-4 text-small ${
                credit.wouldExceed
                  ? 'border-refused/20 bg-refused-soft text-refused'
                  : 'border-hairline bg-surface'
              }`}
            >
              <h2 className="font-semibold">Credit</h2>
              <dl className="mt-2 space-y-1.5">
                <Line label="Credit limit" value={formatPence(credit.limitPence)} />
                <Line label="Outstanding" value={formatPence(credit.outstandingPence)} />
                <Line label="Available" value={formatPence(Math.max(0, credit.availablePence))} />
                <div className="flex justify-between border-t border-current/15 pt-1.5">
                  <dt>After this order</dt>
                  <dd className="tnum">{formatPence(credit.availablePence - draft.totalPence)}</dd>
                </div>
              </dl>

              {credit.wouldExceed && (
                <p className="mt-2 font-medium">
                  This order would exceed your credit limit. Please contact ANAID.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="opacity-70">{label}</dt>
      <dd className="tnum">{value}</dd>
    </div>
  )
}
