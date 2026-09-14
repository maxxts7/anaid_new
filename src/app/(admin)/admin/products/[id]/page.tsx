import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ProductForm, QuantityBreaks, StockForm } from '@/components/admin/product-forms'
import { requireStaff } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { formatPence, penceToInput } from '@/lib/money'
import { staffCan } from '@/lib/permissions'

export const metadata: Metadata = { title: 'Product' }

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { staff } = await requireStaff('products.view')

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      quantityBreaks: { orderBy: { minQuantity: 'asc' } },
      customerPrices: { include: { customer: { select: { businessName: true, customerNumber: true } } } },
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { staff: { select: { name: true } } },
      },
    },
  })

  if (!product) notFound()

  const [categories, levels] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    prisma.pricingLevel.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <div className="p-4 lg:p-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-small text-ink-muted hover:text-ink">
        <ChevronLeft className="size-4" />
        Products
      </Link>

      <h1 className="mt-3 text-display font-bold">{product.name}</h1>
      <p className="tnum mt-1 text-small text-ink-muted">
        {product.sku} — {product.category.name}
      </p>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-hairline bg-surface p-5">
          <h2 className="mb-4 font-medium">Details</h2>
          {staffCan(staff.roles, 'products.edit') ? (
            <ProductForm
              product={{
                id: product.id,
                name: product.name,
                description: product.description,
                categoryId: product.categoryId,
                packSize: product.packSize,
                unitsPerCarton: product.unitsPerCarton,
                minOrderQuantity: product.minOrderQuantity,
                standardPrice: penceToInput(product.standardPricePence),
                vatRatePercent: (product.vatRateBasisPoints / 100).toFixed(2),
                lowStockThreshold: product.lowStockThreshold,
                trackStock: product.trackStock,
                featured: product.featured,
                active: product.active,
              }}
              categories={categories}
            />
          ) : (
            <p className="text-small text-ink-muted">You can view this product but not change it.</p>
          )}
        </section>

        <div className="space-y-4">
          <Panel title="Stock">
            {staffCan(staff.roles, 'inventory.adjust') ? (
              <StockForm
                productId={product.id}
                stockOnHand={product.stockOnHand}
                stockReserved={product.stockReserved}
              />
            ) : (
              <p className="tnum text-small text-ink-muted">
                {Math.max(0, product.stockOnHand - product.stockReserved)} available,{' '}
                {product.stockReserved} reserved
              </p>
            )}
          </Panel>

          {staffCan(staff.roles, 'pricing.view') && (
            <Panel title="Bulk prices">
              <QuantityBreaks
                productId={product.id}
                bands={product.quantityBreaks.map((band) => ({
                  id: band.id,
                  minQuantity: band.minQuantity,
                  pricePence: band.pricePence,
                }))}
              />
            </Panel>
          )}

          {staffCan(staff.roles, 'pricing.view') && (
            <Panel title="What each level pays">
              <ul className="space-y-1.5 text-small">
                {levels.map((level) => (
                  <li key={level.id} className="flex justify-between">
                    <span className="text-ink-muted">{level.name}</span>
                    <span className="tnum font-medium">
                      {formatPence(
                        product.standardPricePence -
                          Math.floor(
                            (product.standardPricePence * level.discountBasisPoints + 5000) / 10000
                          )
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {product.customerPrices.length > 0 && (
                <div className="mt-3 border-t border-hairline pt-3">
                  <p className="mb-1.5 text-micro text-ink-muted">Agreed prices</p>
                  <ul className="space-y-1.5 text-small">
                    {product.customerPrices.map((price) => (
                      <li key={price.id} className="flex justify-between gap-3">
                        <span className="truncate text-ink-muted">{price.customer.businessName}</span>
                        <span className="tnum font-medium">{formatPence(price.pricePence)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>
          )}

          {product.stockMovements.length > 0 && (
            <Panel title="Recent stock movements">
              <ul className="space-y-2 text-small">
                {product.stockMovements.map((movement) => (
                  <li key={movement.id} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      <span className="tnum font-medium">
                        {movement.quantity > 0 ? '+' : ''}
                        {movement.quantity}
                      </span>
                      <span className="ml-2 text-ink-muted">{movement.note}</span>
                    </span>
                    <span className="tnum shrink-0 text-micro text-ink-faint">
                      {movement.createdAt.toLocaleDateString('en-GB')}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-hairline bg-surface">
      <h2 className="border-b border-hairline px-4 py-2.5 font-medium">{title}</h2>
      <div className="p-4">{children}</div>
    </section>
  )
}
