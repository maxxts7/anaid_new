import Link from 'next/link'
import { SiteHeader } from '@/components/customer/site-header'
import { StatusBanner } from '@/components/customer/status-banner'
import { BottomNav } from '@/components/customer/bottom-nav'
import { getCustomerSession } from '@/lib/auth/session'
import { getSettings } from '@/lib/settings'
import { canSeePrices } from '@/lib/permissions'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getCustomerSession(), getSettings()])
  const approved = session ? canSeePrices(session.customer.status) : false

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <StatusBanner />

      <main className="flex-1 pb-20 md:pb-12">{children}</main>

      <footer className="border-t border-hairline bg-surface px-4 py-8 pb-24 md:pb-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-small text-ink-muted md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-semibold text-ink">{settings['company.name']}</p>
            <p className="mt-1">{settings['company.address']}</p>
            <p className="mt-2">
              Trade supplier. We do not sell to the public — accounts are approved individually.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Link href="/products" className="hover:text-ink">
              Catalogue
            </Link>
            <Link href="/register" className="hover:text-ink">
              Open a trade account
            </Link>
            <a href={`mailto:${settings['company.email']}`} className="hover:text-ink">
              {settings['company.email']}
            </a>
            <a href={`tel:${settings['company.phone'].replace(/\s/g, '')}`} className="tnum hover:text-ink">
              {settings['company.phone']}
            </a>
          </div>

          <p className="tnum text-micro text-ink-faint">
            VAT {settings['company.vatNumber']} · Company {settings['company.companyNumber']}
          </p>
        </div>
      </footer>

      <BottomNav showBasket={approved} />
    </div>
  )
}
