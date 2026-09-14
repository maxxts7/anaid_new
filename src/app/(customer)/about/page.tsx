import type { Metadata } from 'next'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { ButtonLink, buttonClass } from '@/components/ui/button'
import { BROCHURE, ONE_STOP, PILLARS, PROMISES, WHO_WE_ARE } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'About us',
  description: WHO_WE_ARE,
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <section className="border-b border-hairline py-12 md:py-16">
        <p className="eyebrow">
          Always from nature
        </p>
        <h1 className="mt-2.5 max-w-2xl text-hero font-bold">
          Trusted. Reliable. Sustainable.
        </h1>
        <p className="mt-5 max-w-2xl text-read text-ink-soft">{WHO_WE_ARE}</p>
      </section>

      <section className="grid items-center gap-8 border-b border-hairline py-10 md:grid-cols-2 md:py-14">
        <div className="product-media aspect-[16/10] overflow-hidden rounded-lg border border-hairline">
          <img
            src="/brand/who-we-are.webp"
            alt="A barista handing a customer a takeaway coffee in an ANAID cup."
            loading="lazy"
            className="!object-cover"
          />
        </div>

        <div>
          <p className="eyebrow">
            Who are we?
          </p>
          <h2 className="mt-2.5 text-display font-bold">Behind the brand</h2>
          <p className="mt-4 text-ink-muted">{ONE_STOP}</p>
          <p className="mt-4 text-ink-muted">
            Our range is sourced from trusted manufacturers and supported by in-house production,
            which is what lets us hold price and availability on the lines a kitchen reorders every
            week.
          </p>
        </div>
      </section>

      <section className="border-b border-hairline py-10 md:py-14">
        <p className="eyebrow">Nature</p>
        <h2 className="mt-2.5 text-display font-bold">The pure promise</h2>

        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <li key={pillar.id}>
              <img src={pillar.image} alt="" width={64} height={64} loading="lazy" className="size-16" />
              <h3 className="mt-4 text-lead font-semibold">{pillar.title}</h3>
              <p className="mt-1.5 text-small text-ink-muted">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid items-center gap-8 border-b border-hairline py-10 md:grid-cols-2 md:py-14">
        <div>
          <h2 className="text-display font-bold">Your all-in-one catering supplier</h2>
          <p className="mt-4 text-ink-muted">
            Bulk catering and hygiene essentials, built for UK food businesses — one supplier for
            everything you need, trusted by caterers and chosen for quality.
          </p>

          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {PROMISES.map((promise) => (
              <li key={promise.title}>
                <h3 className="text-small font-semibold">{promise.title}</h3>
                <p className="mt-0.5 text-small text-ink-muted">{promise.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="product-media aspect-[4/3] overflow-hidden rounded-lg border border-hairline">
          <img
            src="/brand/packaging-detail.webp"
            alt="A bagasse clamshell container, kraft coffee cup and wooden fork."
            loading="lazy"
            className="!object-cover"
          />
        </div>
      </section>

      <section className="py-10 md:py-14">
        <h2 className="text-title font-bold">Open an account</h2>
        <p className="mt-2 max-w-xl text-ink-muted">
          We supply the trade only. Register your business and we will approve your account and set
          your pricing — usually within one working day.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <ButtonLink href="/register" size="lg">
            Open a trade account
          </ButtonLink>
          <ButtonLink href="/products" size="lg" variant="secondary">
            Browse the shop
          </ButtonLink>
          <a
            href={BROCHURE}
            download
            className={buttonClass('secondary', 'lg')}
          >
            <Download className="size-4" />
            Download brochure
          </a>
        </div>

        <p className="mt-5 text-small text-ink-muted">
          Questions first?{' '}
          <Link href="/contact" className="font-medium text-accent underline underline-offset-2">
            Contact the sales team
          </Link>
        </p>
      </section>
    </div>
  )
}
