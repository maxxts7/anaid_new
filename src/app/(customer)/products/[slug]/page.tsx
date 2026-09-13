import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { AddToBasket } from '@/components/customer/add-to-basket'
import { PriceDetail, PriceWithheld } from '@/components/ui/price'
import { ButtonLink } from '@/components/ui/button'
import { availableStock, getProductBySlug, pricesFor } from '@/lib/catalogue'
import { formatBasisPoints, formatPence } from '@/lib/money'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  return { title: product?.name ?? 'Product' }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const pricing = await pricesFor([product])
  const price = pricing.prices.get(product.id)
  const available = availableStock(product)
  const image = product.images[0]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link
        href={`/products?category=${product.category.slug}`}
        className="inline-flex items-center gap-1 text-small text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        {product.category.name}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs">
          <div className="product-media aspect-[5/4]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.url}
                alt={image.alt ?? product.name}
                className="p-6"
                fetchPriority="high"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,var(--color-hairline)_12px,var(--color-hairline)_13px)]">
                <span className="tnum rounded-sm bg-surface px-3 py-1.5 text-base font-semibold text-ink-muted">
                  {product.sku}
                </span>
                <span className="rounded-sm bg-surface px-2 text-micro text-ink-faint">
                  Photography to follow
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-display font-semibold">{product.name}</h1>
          <p className="tnum mt-1 text-small text-ink-muted">
            {product.sku}
            {product.packSize ? `, ${product.packSize}` : ''}
          </p>

          {product.description && <p className="mt-4 max-w-prose text-ink-muted">{product.description}</p>}

          <div className="mt-6 rounded-lg border border-hairline bg-surface p-4 shadow-xs">
            {price ? (
              <>
                <PriceDetail price={price} unit={product.sellUnit} />

                <div className="mt-4">
                  <AddToBasket
                    productId={product.id}
                    minOrderQuantity={product.minOrderQuantity}
                    sellUnit={product.sellUnit}
                    disabled={available === 0}
                  />
                </div>

                {available !== null && (
                  <p className="tnum mt-3 text-micro text-ink-muted">
                    {available === 0
                      ? 'Out of stock — contact us for the next delivery date'
                      : `${available} ${product.sellUnit}s available`}
                  </p>
                )}
              </>
            ) : (
              <>
                <PriceWithheld message={pricing.withheldMessage} size="lg" />
                <p className="mt-3 max-w-sm text-small text-ink-muted">{pricing.withheldExplanation}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pricing.customerStatus === null ? (
                    <>
                      <ButtonLink href="/register">Open a trade account</ButtonLink>
                      <ButtonLink href="/login" variant="secondary">
                        Sign in
                      </ButtonLink>
                    </>
                  ) : (
                    <ButtonLink href="/account/status" variant="secondary">
                      Check your account status
                    </ButtonLink>
                  )}
                </div>
              </>
            )}
          </div>

          {price && price.bands.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs">
              <p className="border-b border-hairline px-4 py-2.5 text-small font-medium">Bulk prices</p>
              <table className="w-full text-small">
                <tbody className="hairline-grid">
                  {price.bands.map((band) => (
                    <tr key={band.minQuantity} className="border-t border-hairline">
                      <td className="tnum px-4 py-2 text-ink-muted">
                        {band.minQuantity} {product.sellUnit}s or more
                      </td>
                      <td className="tnum px-4 py-2 text-right font-medium">
                        {formatPence(band.pricePence)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <dl className="mt-5 overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs text-small">
            <Spec label="Product code" value={product.sku} tabular />
            {product.barcode && <Spec label="Barcode" value={product.barcode} tabular />}
            {product.packSize && <Spec label="Pack" value={product.packSize} />}
            <Spec label="Units per carton" value={String(product.unitsPerCarton)} tabular />
            <Spec
              label="Minimum order"
              value={`${product.minOrderQuantity} ${product.sellUnit}${product.minOrderQuantity === 1 ? '' : 's'}`}
              tabular
            />
            {product.brand && <Spec label="Brand" value={product.brand} />}
            {product.size && <Spec label="Size" value={product.size} />}
            {product.material && <Spec label="Material" value={product.material} />}
            {product.colour && <Spec label="Colour" value={product.colour} />}
            {product.dimensions && <Spec label="Dimensions" value={product.dimensions} />}
            <Spec label="VAT" value={formatBasisPoints(product.vatRateBasisPoints)} tabular />
          </dl>
        </div>
      </div>
    </div>
  )
}

function Spec({ label, value, tabular }: { label: string; value: string; tabular?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-hairline px-4 py-2 last:border-b-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={tabular ? 'tnum font-medium' : 'font-medium'}>{value}</dd>
    </div>
  )
}
