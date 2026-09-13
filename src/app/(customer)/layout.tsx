import Link from 'next/link'
import { SiteHeader } from '@/components/customer/site-header'
import { StatusBanner } from '@/components/customer/status-banner'
import { BottomNav } from '@/components/customer/bottom-nav'
import { getCustomerSession } from '@/lib/auth/session'
import { getSettings } from '@/lib/settings'
import { canSeePrices } from '@/lib/permissions'
import { BROCHURE, ONE_STOP, OPENING_HOURS } from '@/lib/brand'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getCustomerSession(), getSettings()])
  const approved = session ? canSeePrices(session.customer.status) : false

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <StatusBanner />

      <main className="flex-1 pb-20 md:pb-12">{children}</main>

      <footer className="border-t border-hairline bg-inverse px-4 py-10 pb-24 text-ink-inverse md:pb-10">
        <div className="mx-auto grid max-w-6xl gap-8 text-small sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-sm">
            <img
              src="/brand/logo-lockup-inverse.png"
              alt={settings['company.name']}
              width={168}
              height={143}
              className="h-14 w-auto"
              loading="lazy"
            />
            <p className="mt-4 text-ink-inverse/65">{ONE_STOP}</p>
          </div>

          <div>
            <h2 className="text-micro font-semibold tracking-[0.08em] uppercase text-ink-inverse/50">Shop</h2>
            <ul className="mt-3 flex flex-col gap-2 text-ink-inverse/80">
              <li>
                <Link href="/products" className="hover:text-white">
                  Catalogue
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white">
                  Open a trade account
                </Link>
              </li>
              <li>
                <a href={BROCHURE} className="hover:text-white" download>
                  Download brochure (PDF)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-micro font-semibold tracking-[0.08em] uppercase text-ink-inverse/50">Company</h2>
            <ul className="mt-3 flex flex-col gap-2 text-ink-inverse/80">
              <li>
                <Link href="/about" className="hover:text-white">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-micro font-semibold tracking-[0.08em] uppercase text-ink-inverse/50">Get in touch</h2>
            <address className="mt-3 flex flex-col gap-2 not-italic text-ink-inverse/80">
              <span>{settings['company.address']}</span>
              <a href={`mailto:${settings['company.email']}`} className="hover:text-white">
                {settings['company.email']}
              </a>
              <a href={`tel:${settings['company.phone'].replace(/\s/g, '')}`} className="tnum hover:text-white">
                {settings['company.phone']}
              </a>
              <span className="tnum text-ink-inverse/55">{OPENING_HOURS}</span>
            </address>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-white/10 pt-5 text-micro text-ink-inverse/45 sm:flex-row sm:items-center sm:justify-between">
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
  )
}
