import Link from 'next/link'
import { ArrowRight, Download } from 'lucide-react'
import { ProductCard } from '@/components/customer/product-card'
import { ButtonLink, buttonClass } from '@/components/ui/button'
import { getCustomerSession } from '@/lib/auth/session'
import { categoryTree, listProducts, pricesFor } from '@/lib/catalogue'
import { canSeePrices } from '@/lib/permissions'
import { BROCHURE, ONE_STOP, PILLARS, PROMISES, SECTORS, SUB_TAGLINE, TAGLINE } from '@/lib/brand'

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
              {TAGLINE}
            </h1>
            <p className="mt-4 max-w-lg text-lead text-ink-muted">
              {SUB_TAGLINE}. Cups, containers, foil, cutlery and hygiene essentials for restaurants,
              takeaways, cafés and caterers across the UK. Browse everything we stock — prices appear
              once we approve your trade account.
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

      {/* ANAID's four promises. Baked into the banner artwork on the old site;
          live text here so they reflow on a phone and can be read aloud. */}
      {!approved && (
        <section className="grid gap-px border-b border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((promise) => (
            <div key={promise.title} className="bg-ground px-1 py-6 sm:px-4">
              <h2 className="text-small font-semibold">{promise.title}</h2>
              <p className="mt-1 text-small text-ink-muted">{promise.body}</p>
            </div>
          ))}
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

      {/* ANAID's sector artwork. The offer is part of the picture, so each alt
          string repeats it rather than describing the photograph. */}
      {!approved && (
        <section className="border-t border-hairline py-10">
          <h2 className="text-title font-semibold">Packed for your trade</h2>
          <p className="mt-1 max-w-xl text-small text-ink-muted">
            Complete packing solutions, put together for the way each kitchen actually works.
          </p>

          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SECTORS.map((sector) => (
              <li key={sector.id}>
                <Link
                  href="/products"
                  className="group block overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-md"
                >
                  {/* Fitted whole, not cropped: the offer is lettered into the
                      artwork and a cover crop would cut the headline off. */}
                  <div className="product-media aspect-square border-b border-hairline">
                    <img src={sector.image} alt={sector.alt} loading="lazy" />
                  </div>
                  <p className="p-3 text-small font-medium transition-colors group-hover:text-accent">
                    {sector.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {!approved && (
        <>
          {/* Own-brand printing is a real ANAID service, and the one thing on the
              old site that is worth a picture the width of the page. */}
          <section className="border-t border-hairline py-10">
            <div className="grid items-center gap-8 overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs md:grid-cols-2">
              <div className="product-media aspect-[4/3] bg-sunken">
                <img
                  src="/brand/custom-branding.webp"
                  alt="Kraft cups, bags, boxes and napkins printed with a customer's own logo, under the line “Your brand, our quality — customised disposable solutions that represent your brand”."
                  loading="lazy"
                />
              </div>

              <div className="p-6 md:p-8">
                <h2 className="text-display font-semibold">Your brand, our quality</h2>
                <p className="mt-3 text-ink-muted">
                  Customised disposable solutions that represent your brand — custom printing across
                  cups, bags, boxes and napkins, with low minimum order quantities and the same
                  food-safe stock we sell plain.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <ButtonLink href="/contact">Talk to the sales team</ButtonLink>
                  <a
                    href={BROCHURE}
                    download
                    className={buttonClass('secondary')}
                  >
                    <Download className="size-4" />
                    Download brochure
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-hairline py-10">
            <h2 className="text-title font-semibold">The pure promise</h2>
            <p className="mt-1 max-w-xl text-small text-ink-muted">{ONE_STOP}</p>

            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar) => (
                <li key={pillar.id}>
                  <img src={pillar.image} alt="" width={56} height={56} loading="lazy" className="size-14" />
                  <h3 className="mt-3 text-base font-semibold">{pillar.title}</h3>
                  <p className="mt-1 text-small text-ink-muted">{pillar.body}</p>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-small text-ink-muted">
              <Link href="/about" className="font-medium text-accent underline underline-offset-2">
                More about ANAID
              </Link>
            </p>
          </section>
        </>
      )}
    </div>
  )
}
