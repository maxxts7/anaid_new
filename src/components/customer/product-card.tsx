import Link from 'next/link'
import { QuantityStepper } from '@/components/customer/quantity-stepper'
import { BulkPriceHint } from '@/components/customer/bulk-price-hint'
import { Price, PriceWithheld } from '@/components/ui/price'
import { availableStock, type ProductListItem } from '@/lib/catalogue'
import type { PriceResult } from '@/lib/pricing'

/**
 * One product in a list.
 *
 * The photograph is the only part inside a border; the name, code and price sit
 * on the page beneath it, in the open. A grid of these reads as a list of goods
 * rather than a wall of boxes, and the picture — which is the thing a customer
 * actually scans for — is left to carry the tile on its own.
 *
 * The price block is always the same size and in the same place whether or not
 * a price is shown, so the page does not jump about when a customer is approved
 * and prices appear.
 */
export function ProductCard({
  product,
  price,
  withheldMessage,
  canOrder,
}: {
  product: ProductListItem
  price?: PriceResult
  withheldMessage?: string
  canOrder?: boolean
}) {
  const image = product.images[0]
  const available = availableStock(product)

  return (
    <article className="group flex h-full flex-col">
      {/* The link stops before the price. A button inside an anchor is invalid
          markup and, worse, presses through to the anchor — so the ordering
          controls sit outside it. */}
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col focus:outline-none">
        <div className="lift product-media relative aspect-[5/4] rounded-lg border border-hairline">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              srcSet={`${image.url.replace(/\.webp$/, '@small.webp')} 440w, ${image.url} 1100w`}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
              alt={image.alt ?? product.name}
              loading="lazy"
              decoding="async"
              className="p-3"
            />
          ) : (
            <ProductPlaceholder sku={product.sku} packSize={product.packSize} />
          )}
        </div>

        <div className="flex flex-1 flex-col pt-3.5">
          <h3 className="text-small leading-snug font-semibold text-ink transition-colors group-hover:text-accent">
            {product.name}
          </h3>

          {/* ANAID's photography is mostly marketing tiles with their own
              lettering, so nothing is laid over a picture — a "Popular" flag in
              the corner of the image covered the headline it was selling. It
              sits in the line of small print instead, where it costs nothing. */}
          <p className="tnum mt-1 text-micro text-ink-faint">
            {product.sku}
            {product.packSize ? ` · ${product.packSize}` : ''}
            {product.featured && <span className="font-medium text-accent"> · Popular</span>}
          </p>

          {/* Always present, empty or not, so the price sits at the same height
              on every card in a row. */}
          <p className="tnum mt-auto min-h-4 pt-3 text-micro text-ink-muted">
            {available === 0
              ? 'Out of stock'
              : product.minOrderQuantity > 1
                ? `Minimum ${product.minOrderQuantity} ${product.sellUnit}s`
                : ''}
          </p>

        </div>
      </Link>

      <div className="flex items-center gap-1.5 pt-1.5">
        {price ? (
          <Price pence={price.unitPricePence} unit={product.sellUnit}>
            <BulkPriceHint
              bands={price.bands}
              sellUnit={product.sellUnit}
              appliedMinQuantity={price.appliedBand?.minQuantity}
            />
          </Price>
        ) : (
          <PriceWithheld message={withheldMessage ?? 'Price after approval'} size="sm" />
        )}
      </div>

      {canOrder && (
        <QuantityStepper
          className="mt-2.5"
          productId={product.id}
          name={product.name}
          slug={product.slug}
          minOrderQuantity={product.minOrderQuantity}
          unitPricePence={price?.unitPricePence ?? product.standardPricePence}
          sellUnit={product.sellUnit}
          soldOut={available === 0}
        />
      )}
    </article>
  )
}

/**
 * No photography for this line yet. Rather than a grey box, the tile shows what
 * is actually printed on an unlabelled carton: the code and the pack.
 */
function ProductPlaceholder({ sku, packSize }: { sku: string; packSize: string | null }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-1 bg-sunken-soft bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--color-hairline)_10px,var(--color-hairline)_11px)]">
      <span className="tnum rounded-sm bg-surface px-2 py-1 text-micro font-semibold tracking-wide text-ink-muted">
        {sku}
      </span>
      {packSize && <span className="rounded-sm bg-surface px-1.5 text-micro text-ink-faint">{packSize}</span>}
    </div>
  )
}
