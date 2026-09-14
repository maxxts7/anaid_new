import Link from 'next/link'
import { SiteHeader } from '@/components/customer/site-header'
import { StatusBanner } from '@/components/customer/status-banner'
import { BottomNav } from '@/components/customer/bottom-nav'
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
      <footer className="border-t border-hairline px-4 pt-12 pb-28 md:pb-12">
        <div className="mx-auto grid max-w-6xl gap-10 text-small sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-ink-muted">{ONE_STOP}</p>
          </div>

          <div>
            <h2 className="eyebrow">Shop</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-ink-muted">
              <li>
                <Link href="/products" className="hover:text-ink">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-ink">
                  Open a trade account
                </Link>
              </li>
              <li>
                <a href={BROCHURE} className="hover:text-ink" download>
                  Download brochure (PDF)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="eyebrow">Company</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-ink-muted">
              <li>
                <Link href="/about" className="hover:text-ink">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-ink">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="eyebrow">Get in touch</h2>
            <address className="mt-4 flex flex-col gap-2.5 not-italic text-ink-muted">
              <span>{settings['company.address']}</span>
              <a href={`mailto:${settings['company.email']}`} className="hover:text-ink">
                {settings['company.email']}
              </a>
              <a href={`tel:${settings['company.phone'].replace(/\s/g, '')}`} className="tnum hover:text-ink">
                {settings['company.phone']}
              </a>
              <span className="tnum text-ink-faint">{OPENING_HOURS}</span>
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

      <BottomNav showBasket={approved} />
    </div>
    </BasketProvider>
  )
}
