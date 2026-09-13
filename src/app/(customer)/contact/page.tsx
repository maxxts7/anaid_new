import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { ButtonLink, buttonClass } from '@/components/ui/button'
import { getSettings } from '@/lib/settings'
import { OPENING_HOURS } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Speak to the ANAID Quality Disposables sales team about trade accounts, pricing and own-brand printing.',
}

export default async function ContactPage() {
  const settings = await getSettings()
  const tel = settings['company.phone'].replace(/\s/g, '')

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="border-b border-hairline py-12 md:py-16">
        <h1 className="text-hero font-bold" style={{ fontStretch: '88%' }}>
          Drop us a line
        </h1>
        <p className="mt-4 max-w-xl text-lead text-ink-muted">
          Get in touch with the sales team about trade accounts, bulk pricing, stock availability or
          own-brand printing.
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          <a href={`mailto:${settings['company.email']}`} className={buttonClass('primary', 'lg')}>
            Email the sales team
          </a>
          <a href={`tel:${tel}`} className={buttonClass('secondary', 'lg', 'tnum')}>
            {settings['company.phone']}
          </a>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <h2 className="text-title font-semibold">Our store</h2>

        <dl className="mt-5 grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-surface p-5">
            <dt className="flex items-center gap-2 text-small font-semibold">
              <MapPin className="size-4 text-ink-faint" />
              Address
            </dt>
            <dd className="mt-2 text-small text-ink-muted">
              <address className="not-italic">
                {settings['company.name']}
                <br />
                {settings['company.address']}
              </address>
            </dd>
          </div>

          <div className="bg-surface p-5">
            <dt className="flex items-center gap-2 text-small font-semibold">
              <Phone className="size-4 text-ink-faint" />
              Telephone
            </dt>
            <dd className="mt-2 text-small">
              <a href={`tel:${tel}`} className="tnum text-ink-muted hover:text-accent">
                {settings['company.phone']}
              </a>
              <span className="mt-0.5 block text-micro text-ink-faint">Office</span>
            </dd>
          </div>

          <div className="bg-surface p-5">
            <dt className="flex items-center gap-2 text-small font-semibold">
              <Mail className="size-4 text-ink-faint" />
              Email
            </dt>
            <dd className="mt-2 text-small">
              <a
                href={`mailto:${settings['company.email']}`}
                className="break-all text-ink-muted hover:text-accent"
              >
                {settings['company.email']}
              </a>
            </dd>
          </div>

          <div className="bg-surface p-5">
            <dt className="flex items-center gap-2 text-small font-semibold">
              <Clock className="size-4 text-ink-faint" />
              Working hours
            </dt>
            <dd className="tnum mt-2 text-small text-ink-muted">{OPENING_HOURS}</dd>
          </div>
        </dl>

        <div className="mt-10 rounded-lg border border-hairline bg-surface p-6 shadow-xs">
          <h2 className="text-title font-semibold">Opening a trade account</h2>
          <p className="mt-2 max-w-xl text-ink-muted">
            You do not need to call to get started. Register your business online and we will review
            it and set your pricing — usually within one working day.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink href="/register">Open a trade account</ButtonLink>
            <ButtonLink href="/about" variant="secondary">
              About ANAID
            </ButtonLink>
          </div>
          <p className="mt-4 text-small text-ink-muted">
            Already registered?{' '}
            <Link href="/login" className="font-medium text-accent underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
