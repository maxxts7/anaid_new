import Link from 'next/link'
import { Price, PriceWithheld } from '@/components/ui/price'
import { availableStock, type ProductListItem } from '@/lib/catalogue'
import type { PriceResult } from '@/lib/pricing'

/**
 * One product in a list.
 *
 * The price block is always the same size and in the same place whether or not
 * a price is shown, so the page does not jump about when a customer is approved
 * and prices appear.
 */
export function ProductCard({
  product,
  price,
  withheldMessage,
}: {
  product: ProductListItem
  price?: PriceResult
  withheldMessage?: string
}) {
  const image = product.images[0]
  const available = availableStock(product)

  return (
    <article className="group h-full">
      <Link
        href={`/products/${product.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:shadow-md"
      >
        <div className="product-media relative aspect-[5/4] border-b border-hairline">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              srcSet={`${image.url.replace(/\.webp$/, '@small.webp')} 440w, ${image.url} 1100w`}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
              alt={image.alt ?? product.name}
              loading="lazy"
              decoding="async"
              className="p-2"
            />
          ) : (
            <ProductPlaceholder sku={product.sku} packSize={product.packSize} />
          )}

          {product.featured && (
            <span className="absolute top-2 left-2 rounded-sm bg-ink/90 px-1.5 py-0.5 text-micro font-medium text-ink-inverse backdrop-blur-sm">
              Popular
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <h3 className="text-small leading-snug font-medium text-ink transition-colors group-hover:text-accent">
            {product.name}
          </h3>

          <p className="tnum mt-1 text-micro text-ink-muted">
            {product.sku}
            {product.packSize ? `, ${product.packSize}` : ''}
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

          <div className="pt-1.5">
            {price ? (
              <Price pence={price.unitPricePence} unit={product.sellUnit} />
            ) : (
              <PriceWithheld message={withheldMessage ?? 'Price after approval'} size="sm" />
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}

/**
 * No photography for this line yet. Rather than a grey box, the tile shows what
 * is actually printed on an unlabelled carton: the code and the pack.
 */
function ProductPlaceholder({ sku, packSize }: { sku: string; packSize: string | null }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-1 bg-sunken bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--color-hairline)_10px,var(--color-hairline)_11px)]">
      <span className="tnum rounded-sm bg-surface px-2 py-1 text-micro font-semibold tracking-wide text-ink-muted">
        {sku}
      </span>
      {packSize && <span className="rounded-sm bg-surface px-1.5 text-micro text-ink-faint">{packSize}</span>}
    </div>
  )
}
