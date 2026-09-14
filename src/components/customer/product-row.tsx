import Link from 'next/link'
import { Price, PriceWithheld } from '@/components/ui/price'
import { QuantityStepper } from '@/components/customer/quantity-stepper'
import { BulkPriceHint } from '@/components/customer/bulk-price-hint'
import { availableStock, type ProductListItem } from '@/lib/catalogue'
import { tidyName } from '@/lib/text'
import { cn } from '@/lib/cn'
import type { PriceResult } from '@/lib/pricing'

/**
 * One product as a row.
 *
 * The grid answers "what does it look like"; this answers "what exactly am I
 * buying". A trade customer reordering fifteen lines is comparing pack sizes,
 * carton quantities and minimums against each other, and those comparisons are
 * what a column is for — reading down one is the whole point, and no amount of
 * card layout does it.
 *
 * It is a real table for the same reason: the pack size of one product and the
 * pack size of the next are the same kind of fact, and saying so in the markup
 * is what lets a screen reader announce "Pack, 1×6" instead of a loose "1×6".
 *
 * The middle columns come and go with the width of the column the table is
 * standing in, not the width of the window — a container query, because the
 * basket alongside it takes its room from the same place. Judging this on the
 * viewport meant the table showed most columns exactly where it had least space
 * for them, and the price fell off the end.
 */

/** When each column has earned its place, measured against the table's column. */
const AT = {
  pack: '@lg:table-cell',
  minimum: '@2xl:table-cell',
  carton: '@3xl:table-cell',
  stock: '@4xl:table-cell',
} as const
export function ProductRow({
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
    <tr className="group border-b border-hairline-soft last:border-b-0">
      <th scope="row" className="w-full py-3 pr-4 text-left font-normal">
        <Link href={`/products/${product.slug}`} className="flex items-center gap-3 focus:outline-none">
          <span className="product-media size-12 shrink-0 rounded-sm border border-hairline">
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
          </span>

          <span className="min-w-0">
            <span className="block text-small leading-snug font-semibold text-ink transition-colors group-hover:text-accent">
              {product.name}
            </span>
            <span className="tnum mt-0.5 block text-micro text-ink-faint [overflow-wrap:anywhere]">
              {product.sku} · {tidyName(product.category.name)}
              {product.featured && <span className="font-medium text-accent"> · Popular</span>}
            </span>
          </span>
        </Link>
      </th>

      <Cell at={AT.pack}>{product.packSize ?? '—'}</Cell>
      <Cell at={AT.minimum}>
        {product.minOrderQuantity} {product.sellUnit}
        {product.minOrderQuantity === 1 ? '' : 's'}
      </Cell>
      <Cell at={AT.carton}>{product.unitsPerCarton}</Cell>
      <Cell at={AT.stock}>
        {available === null ? 'In stock' : available === 0 ? 'Out of stock' : `${available} ${product.sellUnit}s`}
      </Cell>

      <td className="w-px py-3 pl-4 text-right align-middle whitespace-nowrap">
        {price ? (
          <Price pence={price.unitPricePence} unit={product.sellUnit} size="sm">
            <BulkPriceHint
              bands={price.bands}
              sellUnit={product.sellUnit}
              appliedMinQuantity={price.appliedBand?.minQuantity}
            />
          </Price>
        ) : (
          <PriceWithheld message={withheldMessage ?? 'Price after approval'} size="sm" />
        )}

        {canOrder && (
          <QuantityStepper
            className="mt-2 flex justify-end"
            productId={product.id}
            name={product.name}
            slug={product.slug}
            minOrderQuantity={product.minOrderQuantity}
            unitPricePence={price?.unitPricePence ?? product.standardPricePence}
            sellUnit={product.sellUnit}
            soldOut={available === 0}
          />
        )}
      </td>
    </tr>
  )
}

function Cell({ at, children }: { at: string; children: React.ReactNode }) {
  return (
    <td
      className={cn(
        'tnum hidden w-px px-3 py-3 align-middle text-small whitespace-nowrap text-ink-muted',
        at
      )}
    >
      {children}
    </td>
  )
}

/** The column headings the rows above are answering. */
export function ProductRowHeader() {
  return (
    <tr className="border-b border-hairline">
      <th scope="col" className="eyebrow w-full py-2.5 pr-4 text-left">
        Product
      </th>
      <HeadCell at={AT.pack}>Pack</HeadCell>
      <HeadCell at={AT.minimum}>Min order</HeadCell>
      <HeadCell at={AT.carton}>Per carton</HeadCell>
      <HeadCell at={AT.stock}>Stock</HeadCell>
      <th scope="col" className="eyebrow w-px py-2.5 pl-4 text-right whitespace-nowrap">
        Price
      </th>
    </tr>
  )
}

function HeadCell({ at, children }: { at: string; children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className={cn('eyebrow hidden w-px px-3 py-2.5 text-left whitespace-nowrap', at)}
    >
      {children}
    </th>
  )
}
