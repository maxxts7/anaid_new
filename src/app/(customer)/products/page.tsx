import Link from 'next/link'
import type { Metadata } from 'next'
import { PackageSearch } from 'lucide-react'
import { ProductCard } from '@/components/customer/product-card'
import { ProductRow, ProductRowHeader } from '@/components/customer/product-row'
import {
  CatalogueFilters,
  type CatalogueCard,
  type CatalogueView,
} from '@/components/customer/catalogue-filters'
import { SearchField } from '@/components/customer/site-header'
import { catalogueGroups, listProducts, pricesFor } from '@/lib/catalogue'
import { getCustomerSession } from '@/lib/auth/session'
import { canSeePrices } from '@/lib/permissions'

export const metadata: Metadata = { title: 'Shop' }

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; view?: string }>
}) {
  const { q, category, view } = await searchParams
  const search = q?.trim() || undefined

  // The whole catalogue is fetched, priced and rendered in one pass, and the
  // category tabs then filter what is already on the page. A search still goes
  // to the database, because that is a different question being asked of it.
  const products = await listProducts({ search })
  const [{ groups, paths }, pricing, session] = await Promise.all([
    catalogueGroups(products),
    pricesFor(products),
    getCustomerSession(),
  ])

  // Only an approved customer can order, so only they get the ordering controls
  // and the running basket. The action behind the button refuses anyone else
  // regardless, but there is no sense drawing what cannot be pressed.
  const canOrder = session ? canSeePrices(session.customer.status) : false

  const cards: CatalogueCard[] = products.map((product) => {
    const path = paths[product.categoryId]

    return {
      id: product.id,
      top: path?.top ?? '',
      child: path?.child ?? null,
      // Both shapes are rendered here rather than in the browser, because a
      // price is only ever computed on the server. Switching view is then a
      // choice between two things already on the page, not a round trip.
      card: (
        <ProductCard
          product={product}
          price={pricing.prices.get(product.id)}
          withheldMessage={pricing.withheldShort}
          canOrder={canOrder}
        />
      ),
      row: (
        <ProductRow
          key={product.id}
          product={product}
          price={pricing.prices.get(product.id)}
          withheldMessage={pricing.withheldShort}
          canOrder={canOrder}
        />
      ),
    }
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 xl:max-w-[84rem] md:py-14">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">{search ? 'Search' : 'Trade shop'}</p>
          <h1 className="mt-2.5 text-display font-bold">
            {search ? `“${search}”` : 'Everything we stock'}
          </h1>
          <p className="tnum mt-2 text-small text-ink-muted">
            {products.length} {products.length === 1 ? 'product' : 'products'}
            {search ? ' matching' : ' across ' + groups.length + ' departments'}
          </p>
        </div>

        <SearchField query={q} className="hidden w-full max-w-sm md:block" />
      </div>

      {products.length === 0 ? (
        <div className="mt-10 border-t border-hairline py-20 text-center">
          <PackageSearch className="mx-auto size-6 text-ink-faint" />
          <p className="mt-4 font-medium">Nothing matches that search</p>
          <p className="mx-auto mt-1 max-w-sm text-small text-ink-muted">
            Try a product code, or browse the departments.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-block text-small font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            Show all products
          </Link>
        </div>
      ) : (
        <CatalogueFilters
          groups={groups}
          cards={cards}
          header={<ProductRowHeader />}
          initialCategory={category}
          initialView={view === 'list' ? ('list' as CatalogueView) : 'grid'}
        />
      )}
    </div>
  )
}
