import Link from 'next/link'
import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { formatPence } from '@/lib/money'
import { cn } from '@/lib/cn'

export const metadata: Metadata = { title: 'Products' }

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>
}) {
  await requireStaff('products.view')
  const { q, filter } = await searchParams

  const search = q?.trim()

  const products = await prisma.product.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: { category: { select: { name: true } } },
    orderBy: [{ active: 'desc' }, { sku: 'asc' }],
    take: 300,
  })

  const lowStockOnly = filter === 'low-stock'
  const visible = lowStockOnly
    ? products.filter(
        (product) =>
          product.trackStock && product.stockOnHand - product.stockReserved <= product.lowStockThreshold
      )
    : products

  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-display font-semibold">Products</h1>
      <p className="tnum mt-1 text-small text-ink-muted">
        {visible.length} {visible.length === 1 ? 'product' : 'products'}
        {lowStockOnly ? ' at or below the low-stock warning' : ''}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <form className="min-w-60 flex-1">
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Name or product code"
            className="h-10 w-full max-w-md rounded-sm border border-hairline-strong bg-surface px-3 text-base focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
          />
          {lowStockOnly && <input type="hidden" name="filter" value="low-stock" />}
        </form>

        <Link
          href={lowStockOnly ? '/admin/products' : '/admin/products?filter=low-stock'}
          className={cn(
            'inline-flex h-10 items-center rounded-sm border px-3 text-small',
            lowStockOnly
              ? 'border-ink bg-ink text-ink-inverse'
              : 'border-hairline-strong bg-surface text-ink-muted hover:bg-sunken'
          )}
        >
          Low stock only
        </Link>
      </div>

      <div className="table-scroll mt-4 rounded-lg border border-hairline bg-surface shadow-xs">
        <table className="w-full min-w-[860px] text-small">
          <thead className="border-b border-hairline bg-sunken text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Code</th>
              <th className="px-4 py-2.5 font-medium">Product</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 text-right font-medium">List price</th>
              <th className="px-4 py-2.5 text-right font-medium">Min</th>
              <th className="px-4 py-2.5 text-right font-medium">Available</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((product) => {
              const available = product.stockOnHand - product.stockReserved
              const low = product.trackStock && available <= product.lowStockThreshold

              return (
                <tr key={product.id} className="border-b border-hairline last:border-b-0 hover:bg-sunken">
                  <td className="tnum px-4 py-3 text-ink-muted">{product.sku}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${product.id}`} className="font-medium hover:text-accent">
                      {product.name}
                    </Link>
                    {product.packSize && (
                      <span className="tnum mt-0.5 block text-micro text-ink-muted">{product.packSize}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{product.category.name}</td>
                  <td className="tnum px-4 py-3 text-right font-medium">
                    {formatPence(product.standardPricePence)}
                  </td>
                  <td className="tnum px-4 py-3 text-right text-ink-muted">{product.minOrderQuantity}</td>
                  <td className={cn('tnum px-4 py-3 text-right', low ? 'font-semibold text-pending' : '')}>
                    {product.trackStock ? available : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {product.active ? (
                      <span className="text-small text-ink-muted">Active</span>
                    ) : (
                      <span className="text-small text-refused">Hidden</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {visible.length === 0 && (
          <p className="px-4 py-12 text-center text-small text-ink-muted">No products match.</p>
        )}
      </div>
    </div>
  )
}
