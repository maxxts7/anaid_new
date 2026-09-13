import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/customer/product-card'
import { ButtonLink } from '@/components/ui/button'
import { getCustomerSession } from '@/lib/auth/session'
import { categoryTree, listProducts, pricesFor } from '@/lib/catalogue'
import { canSeePrices } from '@/lib/permissions'

export default async function HomePage() {
  const [session, categories, featured] = await Promise.all([
    getCustomerSession(),
    categoryTree(),
    listProducts({ featuredOnly: true, take: 8 }),
  ])

  const pricing = await pricesFor(featured)
  const approved = session ? canSeePrices(session.customer.status) : false
  // The category photography is ANAID's strongest and most consistent, so the
  // hero is built from that rather than from individual product shots.
  const heroImages = categories.filter((category) => category.imageUrl).slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-4">
      {approved ? (
        <section className="border-b border-hairline py-8">
          <p className="text-small text-ink-muted">Signed in as</p>
          <h1 className="mt-0.5 text-display font-semibold">{session!.customer.businessName}</h1>
          <p className="tnum mt-1 text-small text-ink-muted">
            Account {session!.customer.customerNumber}
            {session!.customer.pricingLevel ? ` — ${session!.customer.pricingLevel.name} pricing` : ''}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink href="/products">Browse catalogue</ButtonLink>
            <ButtonLink href="/orders" variant="secondary">
              Your orders
            </ButtonLink>
          </div>
        </section>
      ) : (
        <section className="grid items-center gap-10 border-b border-hairline py-12 md:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="max-w-xl">
            <h1 className="text-hero font-bold" style={{ fontStretch: '88%' }}>
              Wholesale disposables, priced for your account.
            </h1>
            <p className="mt-4 max-w-lg text-lead text-ink-muted">
              Cups, containers, foil, gloves and packaging for restaurants, takeaways, cafés and caterers
              across the UK. Browse everything we stock — prices appear once we approve your trade account.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <ButtonLink href="/register" size="lg">
                Open a trade account
              </ButtonLink>
              <ButtonLink href="/products" size="lg" variant="secondary">
                Browse catalogue
              </ButtonLink>
            </div>

            <p className="mt-4 text-small text-ink-muted">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-accent underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>

          {heroImages.length === 3 && (
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-3">
              <div className="product-media rise row-span-2 aspect-[3/4] overflow-hidden rounded-lg border border-hairline shadow-sm">
                <img src={heroImages[0].imageUrl!} alt="" className="!object-cover" loading="eager" />
              </div>
              {heroImages.slice(1).map((category, index) => (
                <div
                  key={category.id}
                  className="product-media rise aspect-[4/3] overflow-hidden rounded-lg border border-hairline shadow-sm"
                  style={{ animationDelay: `${(index + 1) * 90}ms` }}
                >
                  <img src={category.imageUrl!} alt="" className="!object-cover" loading="eager" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="py-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-title font-semibold">Shop by category</h2>
          <Link href="/products" className="text-small font-medium text-accent hover:underline">
            Everything we stock
          </Link>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/products?category=${category.slug}`}
                className="group block h-full overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-md"
              >
                <div className="product-media aspect-[4/3] border-b border-hairline bg-sunken">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt=""
                      loading="lazy"
                      className="!object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--color-hairline)_10px,var(--color-hairline)_11px)]">
                      <span className="rounded-sm bg-surface px-2 py-1 text-micro font-medium text-ink-muted">
                        {category.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="text-small leading-snug font-medium transition-colors group-hover:text-accent">
                    {category.name}
                  </p>
                  <p className="tnum mt-0.5 text-micro text-ink-faint">{category.count} products</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-hairline py-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-title font-semibold">Popular lines</h2>
          <Link
            href="/products"
            className="flex items-center gap-1 text-small font-medium text-accent hover:underline"
          >
            All products
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((product, index) => (
            <div key={product.id} className="rise" style={{ animationDelay: `${index * 40}ms` }}>
              <ProductCard
                product={product}
                price={pricing.prices.get(product.id)}
                withheldMessage={pricing.withheldShort}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
