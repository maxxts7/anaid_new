import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { CheckoutForm } from '@/components/customer/checkout-form'
import { requireOrderingCustomer } from '@/lib/auth/guards'
import { buildOrderDraft, creditCheck } from '@/lib/basket'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'
import type { OrderDraft } from '@/lib/basket'

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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="text-display font-bold">Checkout</h1>

      {/* Two columns from the wide breakpoint, where the order stands beside the
          form and is in sight the whole time it is being filled in. Stacked, the
          same source order would put the form — and the button that commits the
          order — above the list of what is being committed, so on one column the
          order comes first. It arrives folded down to a single line, because a
          customer who has just come from the basket does not need to read it
          again, only to be able to. */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px] lg:gap-6">
        <details className="group rounded-lg border border-hairline bg-surface lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <span className="font-semibold">Your order</span>
            <span className="tnum text-small text-ink-muted">
              {draft.lines.length} {draft.lines.length === 1 ? 'line' : 'lines'}
            </span>
            <span className="tnum ml-auto font-semibold">{formatPence(draft.totalPence)}</span>
            <ChevronDown
              className="size-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="border-t border-hairline p-4 pt-3">
            <OrderLines draft={draft} />
          </div>
        </details>

        {/* The credit warning decides whether the form below can be submitted at
            all, so on one column it has to be read before the form and not
            after it. */}
        {credit.required && (
          <div className="lg:hidden">
            <CreditCard credit={credit} totalPence={draft.totalPence} />
          </div>
        )}

        <div className="rounded-lg border border-hairline bg-surface p-4 sm:p-5">
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

        <aside className="hidden h-fit space-y-4 lg:sticky lg:top-20 lg:block">
          <div className="rounded-lg border border-hairline bg-surface p-4">
            <h2 className="font-semibold">Your order</h2>
            <div className="mt-3">
              <OrderLines draft={draft} />
            </div>
          </div>

          {credit.required && <CreditCard credit={credit} totalPence={draft.totalPence} />}
        </aside>
      </div>
    </div>
  )
}

/** The lines and what they come to. Rendered on both layouts, so it is one
 *  thing rather than two that have to be kept saying the same. */
function OrderLines({ draft }: { draft: OrderDraft }) {
  return (
    <>
      <ul className="space-y-2 text-small">
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
    </>
  )
}

function CreditCard({
  credit,
  totalPence,
}: {
  credit: Awaited<ReturnType<typeof creditCheck>>
  totalPence: number
}) {
  return (
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
          <dd className="tnum">{formatPence(credit.availablePence - totalPence)}</dd>
        </div>
      </dl>

      {credit.wouldExceed && (
        <p className="mt-2 font-medium">
          This order would exceed your credit limit. Please contact ANAID.
        </p>
      )}
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
