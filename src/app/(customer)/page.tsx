import { Fragment } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { ArrowRight, Award, Boxes, Download, HandCoins, Layers, Leaf, Tag, Truck } from 'lucide-react'
import { ButtonLink, buttonClass } from '@/components/ui/button'
import { getCustomerSession } from '@/lib/auth/session'
import { categoryTree } from '@/lib/catalogue'
import { canSeePrices } from '@/lib/permissions'
import {
  BROCHURE,
  DELIVERY_MARK,
  HEADLINE,
  HEADLINE_RULE,
  HERO_MARKS,
  HERO_RANGE,
  MASTHEAD,
  ONE_STOP,
  PRICE_MARK,
  PILLARS,
  SECTORS,
  SUB_TAGLINE,
} from '@/lib/brand'

export default async function HomePage() {
  const [session, categories] = await Promise.all([getCustomerSession(), categoryTree()])
  const approved = session ? canSeePrices(session.customer.status) : false

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* ANAID's second banner, standing as the masthead over the hero. This
          one stays artwork: it is a painted title rather than a piece of the
          interface, and the offer it carries is said again in live text in the
          hero directly beneath it — so nothing is lost if it never loads. It is
          shown to visitors only; a signed-in customer wants their account and
          the shop, not a poster. */}
      {!approved && (
        <img
          src={MASTHEAD.image}
          srcSet={`/brand/banner-catering-supplier@small.webp 800w, ${MASTHEAD.image} 1600w`}
          sizes="(max-width: 1200px) 100vw, 1088px"
          width={1600}
          height={586}
          alt={MASTHEAD.alt}
          fetchPriority="high"
          className="mt-6 w-full rounded-lg border border-hairline md:mt-8"
        />
      )}

      {approved ? (
        <section className="border-b border-hairline py-12">
          <p className="eyebrow">Signed in as</p>
          <h1 className="mt-2.5 text-display font-bold">{session!.customer.businessName}</h1>
          <p className="tnum mt-2 text-small text-ink-muted">
            Account {session!.customer.customerNumber}
            {session!.customer.pricingLevel ? ` — ${session!.customer.pricingLevel.name} pricing` : ''}
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <ButtonLink href="/products">Browse the shop</ButtonLink>
            <ButtonLink href="/orders" variant="secondary">
              Your orders
            </ButtonLink>
          </div>
        </section>
      ) : (
        /* ANAID's own banner, taken apart.
           
           On the old site this is a single flat PNG — headline, marks and range
           strip all baked in — so none of it reflows, none of it is readable by
           a screen reader, and none of it survives a phone. Only the photograph
           is an image here. The two-tone headline is the banner's own device,
           and the five marks are drawn from the icon set at whatever size the
           window asks for. */
        <section className="grid items-center gap-12 pt-10 pb-14 md:pt-12 md:pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-14 lg:pb-20">
          <div className="max-w-xl">
            <p className="eyebrow">Trade supplier since 1994</p>

            <h1 className="mt-2.5 text-hero font-bold">
              {HEADLINE.lead}
              <br />
              <span className="text-accent">{HEADLINE.turn}</span>
            </h1>

            {/* The banner rules this line off on both sides. */}
            <p className="mt-4 flex items-center gap-3 text-lead font-medium text-ink-soft">
              <span aria-hidden className="h-px w-7 bg-hairline-strong" />
              {HEADLINE_RULE}
              <span aria-hidden className="h-px w-7 bg-hairline-strong" />
            </p>

            {/* The two things a kitchen wants to know before anything else.
                They are facts, not actions, so nothing is drawn around them —
                the icon and the weight of the words are enough to set them
                apart from the sentence above and the marks below. */}
            <ul className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-base font-semibold text-ink">
              <li className="inline-flex items-center gap-2.5">
                <Truck className="size-[18px] shrink-0 text-accent" aria-hidden />
                {DELIVERY_MARK}
              </li>
              <li className="inline-flex items-center gap-2.5">
                <Tag className="size-[18px] shrink-0 text-accent" aria-hidden />
                {PRICE_MARK}
              </li>
            </ul>

            <ul className="mt-8 grid max-w-lg grid-cols-5">
              {HERO_MARKS.map((mark, index) => {
                const Icon = MARK_ICONS[mark.icon]

                return (
                  <li
                    key={mark.id}
                    className={
                      'flex min-w-0 flex-col items-center gap-2 px-1.5 text-center sm:px-3 ' +
                      (index > 0 ? 'border-l border-hairline' : '')
                    }
                  >
                    <Icon className="size-6 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />
                    <span className="text-micro leading-tight font-semibold tracking-[0.04em] text-ink-soft uppercase">
                      {mark.label}
                    </span>
                  </li>
                )
              })}
            </ul>

            {/* The range strip. It earns its own weight without anything being
                drawn around it or beside it: the words step up to full ink and
                medium weight, and only the points between them take the accent.
                A line that is set apart by its own colour and spacing does not
                need a rule or a band to hold it. */}
            <p className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-medium tracking-[0.01em] text-ink">
              {HERO_RANGE.map((item, index) => (
                <Fragment key={item}>
                  {index > 0 && (
                    <span aria-hidden className="text-accent">
                      ·
                    </span>
                  )}
                  <span>{item}</span>
                </Fragment>
              ))}
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <ButtonLink href="/register" size="lg">
                Open a trade account
              </ButtonLink>
              <ButtonLink href="/products" size="lg" variant="secondary">
                Browse the shop
              </ButtonLink>
            </div>

            <p className="mt-5 text-small text-ink-muted">
              {SUB_TAGLINE} — prices appear once we approve your trade account.{' '}
              <Link href="/login" className="font-medium text-accent underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>

          <div className="rise product-media overflow-hidden rounded-lg border border-hairline">
            <img
              src="/brand/hero-packaging.webp"
              srcSet="/brand/hero-packaging@small.webp 440w, /brand/hero-packaging.webp 700w"
              sizes="(max-width: 1024px) 100vw, 44vw"
              width={700}
              height={585}
              alt="Kraft cups, bags, boxes, bagasse containers and wooden cutlery printed with a customer's own brand, beside a Premium Quality Guaranteed seal."
              fetchPriority="high"
            />
          </div>
        </section>
      )}

      {/* ANAID's sector artwork. The offer is part of the picture, so each alt
          string repeats it rather than describing the photograph. */}
      {!approved && (
        <Section
          eyebrow="By trade"
          title="Packed for your trade"
          lede="Complete packing solutions, put together for the way each kitchen actually works."
        >
          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
            {SECTORS.map((sector) => (
              <li key={sector.id}>
                <Link href="/products" className="group block focus:outline-none">
                  {/* Fitted whole, not cropped: the offer is lettered into the
                      artwork and a cover crop would cut the headline off. */}
                  <div className="lift product-media aspect-square rounded-lg border border-hairline">
                    <img src={sector.image} alt={sector.alt} loading="lazy" />
                  </div>
                  <p className="mt-4 text-lead font-semibold transition-colors group-hover:text-accent">
                    {sector.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        eyebrow="Departments"
        title="Shop by category"
        action={{ href: '/products', label: 'Everything we stock' }}
      >
        <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id}>
              <Link href={`/products?category=${category.slug}`} className="group block focus:outline-none">
                <div className="lift product-media aspect-[5/4] rounded-lg border border-hairline">
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt="" loading="lazy" className="!object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--color-hairline)_10px,var(--color-hairline)_11px)]">
                      <span className="rounded-sm bg-surface px-2 py-1 text-micro font-medium text-ink-muted">
                        {category.name}
                      </span>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-base leading-snug font-semibold transition-colors group-hover:text-accent">
                  {category.name}
                </p>
                <p className="tnum mt-1 text-small text-ink-faint">{category.count} products</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {!approved && (
        <>
          {/* Own-brand printing is a real ANAID service, and the one thing on the
              old site that is worth a picture the width of the page. The
              picture is what sets the height of the band; the copy beside it is
              centred, so resizing that copy leaves the band's size where it is.

              Its type is deliberately identical to the band below — eyebrow at
              12, heading at 24, body at 16 — so the two read as a matched pair
              rather than as two sections that drifted apart. Change one and
              change the other. */}
          <section className="border-t border-hairline py-20 md:py-24">
            <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
              <div className="product-media aspect-[4/3] overflow-hidden rounded-lg border border-hairline">
                <img
                  src="/brand/custom-branding.webp"
                  alt="Kraft cups, bags, boxes and napkins printed with a customer's own logo, under the line “Your brand, our quality — customised disposable solutions that represent your brand”."
                  loading="lazy"
                />
              </div>

              <div>
                <p className="eyebrow">Own-brand printing</p>
                <h2 className="mt-2.5 text-title font-bold">Your brand, our quality</h2>
                <p className="mt-4 max-w-prose text-base text-ink-soft">
                  Customised disposable solutions that represent your brand — custom printing across
                  cups, bags, boxes and napkins, with low minimum order quantities and the same
                  food-safe stock we sell plain.
                </p>
                <div className="mt-7 flex flex-wrap gap-2.5">
                  <ButtonLink href="/contact">Talk to the sales team</ButtonLink>
                  <a href={BROCHURE} download className={buttonClass('secondary')}>
                    <Download className="size-4" />
                    Download brochure
                  </a>
                </div>
              </div>
            </div>
          </section>

          <Section eyebrow="Always from nature" title="The pure promise" lede={ONE_STOP} roomy>
            {/* The marks lead and the words follow. The words are set at the
                same size as the rest of the page reads at, so a pillar is not a
                footnote — only the weight tells its title from its sentence. */}
            <ul className="mt-12 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar) => (
                <li key={pillar.id}>
                  <img src={pillar.image} alt="" width={125} height={125} loading="lazy" className="size-[125px]" />
                  <h3 className="mt-5 text-base font-semibold">{pillar.title}</h3>
                  <p className="mt-2 text-base text-ink-soft">{pillar.body}</p>
                </li>
              ))}
            </ul>

            <p className="mt-12 text-base">
              <Link href="/about" className="font-medium text-accent underline underline-offset-4">
                More about ANAID
              </Link>
            </p>
          </Section>
        </>
      )}
    </div>
  )
}

/** The banner's five marks, as line icons rather than cut-out artwork. */
const MARK_ICONS = {
  award: Award,
  leaf: Leaf,
  layers: Layers,
  value: HandCoins,
  range: Boxes,
} as const

/**
 * One band of the page: a small capitalised label, a heading under it, and an
 * optional link on the same line. The label is what gives the page its rhythm
 * now that no section is boxed — you read down a column of them and know where
 * you are without a single border being drawn. A section whose title says
 * enough on its own can go without one.
 *
 * How much room a band takes and how large its type is set separately, because
 * they are separate questions: a band can want the air of a closing argument
 * while its words stay quiet, and one dial for both cannot do that.
 */
function Section({
  eyebrow,
  title,
  lede,
  action,
  roomy,
  display,
  children,
}: {
  eyebrow?: string
  title: string
  lede?: string
  action?: { href: '/products'; label: string; arrow?: boolean }
  /** More air above and below, without touching the type. */
  roomy?: boolean
  /** A display heading and a reading-size standfirst, without touching the air. */
  display?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'border-t border-hairline',
        roomy ? 'py-20 md:py-24' : 'py-16 md:py-20'
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2
            className={cn(
              'font-bold',
              eyebrow && 'mt-2.5',
              display ? 'text-display' : 'text-title'
            )}
          >
            {title}
          </h2>
        </div>

        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-1.5 text-small font-medium text-accent underline-offset-4 hover:underline"
          >
            {action.label}
            {action.arrow && <ArrowRight className="size-3.5" />}
          </Link>
        )}
      </div>

      {lede && (
        <p className={cn('mt-4 text-ink-soft', display ? 'max-w-2xl text-read' : 'max-w-xl')}>
          {lede}
        </p>
      )}

      {children}
    </section>
  )
}
