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

  // Fetched here rather than added to the draft. `buildOrderDraft` is what
  // decides money, and the checkout calls the same function to decide what to
  // charge — a photograph has no business travelling through that. On a phone
  // it earns its place: a column of names is read word by word, and a column of
  // pictures is recognised at a glance, which is what a customer checking their
  // own basket is actually doing.
  const images = await prisma.productImage.findMany({
    where: { productId: { in: lines.map((line) => line.productId) } },
    orderBy: { sortOrder: 'asc' },
    select: { productId: true, url: true, alt: true },
  })

  const imageByProduct = new Map<string, { url: string; alt: string | null }>()
  for (const image of images) {
    if (!imageByProduct.has(image.productId)) imageByProduct.set(image.productId, image)
  }

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

  const blocked = draft.blockers.length > 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="text-display font-bold">Your basket</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
          {draft.lines.map((line) => {
            const image = imageByProduct.get(line.productId)

            return (
              <div key={line.productId} className="border-b border-hairline p-3 last:border-b-0 sm:p-4">
                <div className="flex gap-3">
                  <Link
                    href={`/products/${line.slug}`}
                    className="product-media size-14 shrink-0 self-start rounded-sm border border-hairline sm:size-16"
                    aria-hidden
                    tabIndex={-1}
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.url.replace(/\.webp$/, '@small.webp')}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="p-1"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-sunken-soft" />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    {/* Name and line total on one line, and nothing else on it.
                        The unit price used to sit beside the pricing-level note
                        on a phone and the two wrapped through each other —
                        "£9.18 per carton Your" over "pricing level". They are
                        their own line now, and the note is a quiet second one
                        beneath, so nothing has to break mid-phrase. */}
                    <div className="flex items-baseline justify-between gap-3">
                      <Link
                        href={`/products/${line.slug}`}
                        className="text-small leading-snug font-semibold hover:text-accent sm:text-base"
                      >
                        {line.name}
                      </Link>
                      <span className="tnum shrink-0 text-base font-semibold sm:text-lead">
                        {formatPence(line.lineNetPence)}
                      </span>
                    </div>

                    <p className="tnum mt-1 text-micro text-ink-faint">
                      {line.sku}
                      {line.packSize ? ` · ${line.packSize}` : ''}
                    </p>

                    <p className="tnum mt-0.5 text-micro text-ink-muted">
                      {formatPence(line.unitPricePence)} per {line.sellUnit} ·{' '}
                      {PRICE_SOURCE_LABELS[line.source]}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <BasketLineControls
                        lineId={lineIdByProduct.get(line.productId)!}
                        quantity={line.quantity}
                        minOrderQuantity={line.minOrderQuantity}
                      />
                    </div>
                  </div>
                </div>

                {line.issues.length > 0 && (
                  <ul className="mt-2.5 space-y-1">
                    {line.issues.map((issue) => (
                      <li key={issue} className="flex items-center gap-1.5 text-micro text-refused">
                        <AlertCircle className="size-3.5 shrink-0" />
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
            )
          })}
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

          {blocked && (
            <ul className="mt-3 space-y-1.5 rounded-sm border border-refused/20 bg-refused-soft p-2.5">
              {draft.blockers.map((blocker) => (
                <li key={blocker} className="flex items-start gap-1.5 text-micro text-refused">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  {blocker}
                </li>
              ))}
            </ul>
          )}

          {/* The phone gets this button fixed to the bottom of the screen
              instead — see below — so the one in the summary is for the layouts
              that show the summary beside the lines rather than under them. */}
          <ButtonLink
            href="/checkout"
            size="lg"
            className={`mt-4 hidden w-full lg:inline-flex ${blocked ? 'pointer-events-none opacity-45' : ''}`}
            aria-disabled={blocked}
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

      {/* Below the wide breakpoint the summary sits underneath a basket that may
          be forty lines long, and the way out of it was forty lines down. The
          total and the way on are pinned to the bottom of the screen instead,
          which is where a phone expects to find them.

          It stands on the bottom navigation rather than over it — the same
          variable the navigation is measured by, which goes to zero once that
          navigation is gone, so between the two breakpoints this simply sits on
          the floor. The page's own clearance comes from the footer's
          `pb-page`, which already leaves room for both. */}
      <div
        className="fixed inset-x-0 z-30 border-t border-hairline bg-surface px-4 py-3 lg:hidden"
        style={{ bottom: 'var(--bottom-nav)', boxShadow: '0 -8px 24px -20px rgb(16 20 24 / 0.5)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-micro leading-tight text-ink-muted">Total inc. VAT</p>
            <p className="tnum text-lead leading-tight font-semibold">
              {formatPence(draft.totalPence)}
            </p>
          </div>

          <ButtonLink
            href="/checkout"
            size="lg"
            className={`ml-auto flex-1 ${blocked ? 'pointer-events-none opacity-45' : ''}`}
            aria-disabled={blocked}
          >
            {blocked ? 'Check the basket' : 'Go to checkout'}
          </ButtonLink>
        </div>
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
