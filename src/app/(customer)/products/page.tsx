import Link from 'next/link'
import type { Route } from 'next'
import type { Metadata } from 'next'
import { PackageSearch } from 'lucide-react'
import { ProductCard } from '@/components/customer/product-card'
import { SearchField } from '@/components/customer/site-header'
import { categoryTree, listProducts, pricesFor } from '@/lib/catalogue'
import { cn } from '@/lib/cn'

export const metadata: Metadata = { title: 'Catalogue' }

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q, category } = await searchParams

  const [categories, products] = await Promise.all([
    categoryTree(),
    listProducts({ search: q?.trim() || undefined, categorySlug: category }),
  ])

  const active =
    categories.find((entry) => entry.slug === category) ??
    categories.find((entry) => entry.children.some((child) => child.slug === category))

  const activeChild = active?.children.find((child) => child.slug === category)
  const pricing = await pricesFor(products)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-display font-semibold">
            {activeChild ? activeChild.name : (active?.name ?? 'Catalogue')}
          </h1>
          <p className="tnum mt-1 text-small text-ink-muted">
            {products.length} {products.length === 1 ? 'product' : 'products'}
            {q ? ` matching “${q}”` : ''}
          </p>
        </div>

        <SearchField query={q} className="hidden w-full max-w-sm md:block" />
      </div>

      <div className="rail -mx-4 mt-5 px-4">
        <ul className="flex gap-2 pb-1">
          <li>
            <Chip href={'/products' as Route} active={!category}>
              All
            </Chip>
          </li>
          {categories.map((entry) => (
            <li key={entry.id}>
              <Chip
                href={`/products?category=${entry.slug}` as Route}
                active={active?.slug === entry.slug}
              >
                {entry.name}
                <span className="tnum ml-1.5 opacity-55">{entry.count}</span>
              </Chip>
            </li>
          ))}
        </ul>
      </div>

      {active && active.children.length > 0 && (
        <div className="rail -mx-4 mt-2 px-4">
          <ul className="flex gap-2 pb-1">
            <li>
              <Chip href={`/products?category=${active.slug}` as Route} active={!activeChild} subtle>
                All {active.name.toLowerCase()}
              </Chip>
            </li>
            {active.children.map((child) => (
              <li key={child.slug}>
                <Chip
                  href={`/products?category=${child.slug}` as Route}
                  active={child.slug === category}
                  subtle
                >
                  {child.name}
                  <span className="tnum ml-1.5 opacity-55">{child.count}</span>
                </Chip>
              </li>
            ))}
          </ul>
        </div>
      )}

      {products.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-hairline-strong bg-surface px-6 py-16 text-center">
          <PackageSearch className="mx-auto size-6 text-ink-faint" />
          <p className="mt-3 font-medium">Nothing matches that search</p>
          <p className="mx-auto mt-1 max-w-sm text-small text-ink-muted">
            Try a product code, or browse a category above.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block text-small font-medium text-accent hover:underline"
          >
            Show all products
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="rise"
              style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
            >
              <ProductCard
                product={product}
                price={pricing.prices.get(product.id)}
                withheldMessage={pricing.withheldShort}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({
  href,
  active,
  subtle,
  children,
}: {
  href: Route
  active: boolean
  subtle?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center rounded-md border px-3 whitespace-nowrap transition-all duration-150 ease-out',
        subtle ? 'h-7 text-micro' : 'h-9 text-small',
        active
          ? 'border-ink bg-ink text-ink-inverse shadow-xs'
          : 'border-hairline-strong bg-surface text-ink-muted hover:border-ink-faint hover:bg-sunken hover:text-ink'
      )}
    >
      {children}
    </Link>
  )
}
