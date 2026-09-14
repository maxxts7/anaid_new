import Link from 'next/link'
import { SiteHeader } from '@/components/customer/site-header'
import { StatusBanner } from '@/components/customer/status-banner'
import { BottomNav } from '@/components/customer/bottom-nav'
import { BasketBar } from '@/components/customer/basket-bar'
import { getCustomerSession } from '@/lib/auth/session'
import { getSettings } from '@/lib/settings'
import { canSeePrices } from '@/lib/permissions'
import { BROCHURE, ONE_STOP, OPENING_HOURS } from '@/lib/brand'
import { BasketProvider } from '@/components/customer/basket-store'
import { basketSummary } from '@/lib/basket'
import { Wordmark } from '@/components/ui/wordmark'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getCustomerSession(), getSettings()])
  const approved = session ? canSeePrices(session.customer.status) : false

  // Seeded once here and kept in the browser from then on, so a line added in
  // the shop shows in the header and the margin panel without a round trip.
  const basket = approved ? await basketSummary(session!.customer, session!.user.id) : null

  return (
    <BasketProvider initial={basket}>
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <StatusBanner />

      <main className="flex-1">{children}</main>

      {/* One continuous sheet of paper from the header down. The footer is
          marked off by a rule and by the drop in type size rather than by a
          block of colour, which is the whole trick of this layout: contrast
          comes from space and weight, not from filling areas in. */}
      {/* The page has to end above the fixed furniture. The footer carries that
          clearance rather than the main element, because it is what the bottom
          of the page actually is — and `pb-page` measures it from the same
          variable the bars position themselves with, so the three cannot drift
          apart. */}
      <footer className="pb-page px-safe [--gutter:1rem] border-t border-hairline pt-12">
        <div className="mx-auto grid max-w-6xl gap-10 text-small sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-ink-muted">{ONE_STOP}</p>
          </div>

          {/* A footer link is 13px of text, which as a target is about a third
              of what a thumb needs. The rows carry their own padding so the
              target is the height of the row rather than the height of the
              lettering, and the gap between rows comes down to match — the
              links end up further apart than they were, while the block as a
              whole is the same size. The pseudo-element trick used elsewhere
              will not do here: at this spacing 44px boxes would overlap each
              other, and tapping About would sometimes get you Contact. */}
          <div>
            <h2 className="eyebrow">Shop</h2>
            <ul className="mt-3 flex flex-col gap-0.5 text-ink-muted">
              <li>
                <Link href="/products" className="inline-block py-1.5 hover:text-ink">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/register" className="inline-block py-1.5 hover:text-ink">
                  Open a trade account
                </Link>
              </li>
              <li>
                <a href={BROCHURE} className="inline-block py-1.5 hover:text-ink" download>
                  Download brochure (PDF)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="eyebrow">Company</h2>
            <ul className="mt-3 flex flex-col gap-0.5 text-ink-muted">
              <li>
                <Link href="/about" className="inline-block py-1.5 hover:text-ink">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="inline-block py-1.5 hover:text-ink">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="eyebrow">Get in touch</h2>
            <address className="mt-3 flex flex-col gap-0.5 not-italic text-ink-muted">
              <span className="py-1.5">{settings['company.address']}</span>
              <a
                href={`mailto:${settings['company.email']}`}
                className="inline-block py-1.5 hover:text-ink"
              >
                {settings['company.email']}
              </a>
              <a
                href={`tel:${settings['company.phone'].replace(/\s/g, '')}`}
                className="tnum inline-block py-1.5 hover:text-ink"
              >
                {settings['company.phone']}
              </a>
              <span className="tnum py-1.5 text-ink-faint">{OPENING_HOURS}</span>
            </address>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-2 border-t border-hairline-soft pt-6 text-micro text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings['company.name']}. Trade supplier — we do not sell to the public.
          </p>
          {(settings['company.vatNumber'] || settings['company.companyNumber']) && (
            <p className="tnum">
              {[
                settings['company.vatNumber'] && `VAT ${settings['company.vatNumber']}`,
                settings['company.companyNumber'] && `Company ${settings['company.companyNumber']}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      </footer>

      {/* The phone's answer to the margin panel: the running total, carried
          across the bottom of every shopping screen. */}
      {approved && <BasketBar />}
      <BottomNav showBasket={approved} />
    </div>
    </BasketProvider>
  )
}
