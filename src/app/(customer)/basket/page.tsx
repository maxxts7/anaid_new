import Link from 'next/link'
import type { Metadata } from 'next'
import { AlertCircle, ShoppingBasket } from 'lucide-react'
import { BasketLineControls } from '@/components/customer/basket-line-controls'
import { ButtonLink } from '@/components/ui/button'
import { requireApprovedCustomer } from '@/lib/auth/guards'
import { buildOrderDraft } from '@/lib/basket'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'
import { PRICE_SOURCE_LABELS } from '@/lib/pricing'

export const metadata: Metadata = { title: 'Your basket' }

export default async function BasketPage() {
  const session = await requireApprovedCustomer()

  const lines = await prisma.basketLine.findMany({
    where: { basket: { userId: session.user.id } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, productId: true, quantity: true },
  })

  const draft = await buildOrderDraft(
    session.customer,
    lines.map((line) => ({ productId: line.productId, quantity: line.quantity }))
  )

  const lineIdByProduct = new Map(lines.map((line) => [line.productId, line.id]))

  if (draft.lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingBasket className="mx-auto size-7 text-ink-faint" />
        <h1 className="mt-4 text-title font-bold">Your basket is empty</h1>
        <p className="mt-2 text-ink-muted">
          Everything you add appears here with your own prices and running totals.
        </p>
        <ButtonLink href="/products" className="mt-6">
          Browse the shop
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-display font-bold">Your basket</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
          {draft.lines.map((line) => (
            <div key={line.productId} className="border-b border-hairline p-4 last:border-b-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${line.slug}`} className="font-medium hover:text-accent">
                    {line.name}
                  </Link>
                  <p className="tnum mt-0.5 text-micro text-ink-muted">
                    {line.sku}
                    {line.packSize ? `, ${line.packSize}` : ''}
                  </p>
                  <p className="tnum mt-1.5 text-small text-ink-muted">
                    {formatPence(line.unitPricePence)} per {line.sellUnit}
                    <span className="ml-2 text-micro">{PRICE_SOURCE_LABELS[line.source]}</span>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="tnum text-lead font-semibold">{formatPence(line.lineNetPence)}</span>
                  <BasketLineControls
                    lineId={lineIdByProduct.get(line.productId)!}
                    quantity={line.quantity}
                    minOrderQuantity={line.minOrderQuantity}
                  />
                </div>
              </div>

              {line.issues.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {line.issues.map((issue) => (
                    <li key={issue} className="flex items-center gap-1.5 text-micro text-refused">
                      <AlertCircle className="size-3.5" />
                      {issue}
                    </li>
                  ))}
                </ul>
              )}

              {line.nextBand && line.nextBand.savingPerUnitPence > 0 && (
                <p className="tnum mt-2 text-micro text-accent">
                  Add {line.nextBand.minQuantity - line.quantity} more to pay{' '}
                  {formatPence(line.nextBand.pricePence)} each
                </p>
              )}
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-lg border border-hairline bg-surface p-4 lg:sticky lg:top-20">
          <h2 className="font-semibold">Order summary</h2>

          <dl className="mt-3 space-y-2 text-small">
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

          {draft.remainingForFreeDeliveryPence > 0 && (
            <p className="tnum mt-3 rounded-sm border border-accent/20 bg-accent-soft px-2.5 py-2 text-micro text-accent">
              Spend {formatPence(draft.remainingForFreeDeliveryPence)} more for free delivery
            </p>
          )}

          {draft.blockers.length > 0 && (
            <ul className="mt-3 space-y-1.5 rounded-sm border border-refused/20 bg-refused-soft p-2.5">
              {draft.blockers.map((blocker) => (
                <li key={blocker} className="flex items-start gap-1.5 text-micro text-refused">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  {blocker}
                </li>
              ))}
            </ul>
          )}

          <ButtonLink
            href="/checkout"
            size="lg"
            className={`mt-4 w-full ${draft.blockers.length > 0 ? 'pointer-events-none opacity-45' : ''}`}
            aria-disabled={draft.blockers.length > 0}
          >
            Go to checkout
          </ButtonLink>

          <Link
            href="/products"
            className="mt-3 block text-center text-small text-ink-muted underline underline-offset-2 hover:text-ink"
          >
            Keep shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tnum">{value}</dd>
    </div>
  )
}
