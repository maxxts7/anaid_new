/**
 * ANAID's own words and pictures.
 *
 * Everything here was extracted from the live WordPress site at
 * anaidqualitydisposables.uk (homepage, About Us, Contact Us and the two hero
 * banners) so that the rebuild carries the real brand rather than placeholder
 * marketing text. Body copy is kept verbatim; the four pillar labels are set in
 * sentence case and en-GB to match the rest of the interface.
 *
 * Facts that a member of staff should be able to change without a deploy —
 * address, phone, email — live in Settings instead. This file holds the
 * editorial copy, which changes with the brand rather than with the business.
 */

/** The line the brand leads with, on both the old site and the brochure. */
export const TAGLINE = 'Quality Packaging, Unmatched Value'
export const SUB_TAGLINE = 'Premium food packaging delivered nationwide'

/**
 * The hero, as ANAID draws it.
 *
 * On the old site the whole banner is one flat image: headline, five marks and
 * the range strip are all baked into the artwork, which means none of it
 * reflows on a phone, none of it can be read aloud, and none of it can be
 * changed without a designer. Everything except the photograph is live text
 * here, and the marks are drawn from the icon set rather than cut out of a PNG.
 *
 * The headline is set in two tones on the banner — the first half dark, the
 * second in the brand's second colour. That device is kept; in this palette the
 * second tone is the accent.
 */
export const HEADLINE = { lead: 'Quality Packaging,', turn: 'Unmatched Value' } as const

/** The strapline the banner rules off between two dashes. */
export const HEADLINE_RULE = 'Premium Food Packaging'

/** The promise stamped across the banner in a solid block. */
export const DELIVERY_MARK = 'Delivered Nationwide UK.'

/**
 * The other half of the offer, and the one this platform is actually built
 * around — the reason a kitchen opens a trade account rather than buying retail.
 * The banner leaves it to a strip further down the old home page; it belongs
 * beside the delivery promise.
 */
export const PRICE_MARK = 'Bulk trade prices'

/** The five marks under the headline, in the banner's own order and wording. */
export const HERO_MARKS = [
  { id: 'quality', label: 'Premium quality', icon: 'award' },
  { id: 'eco', label: 'Eco friendly', icon: 'leaf' },
  { id: 'strong', label: 'Strong & reliable', icon: 'layers' },
  { id: 'value', label: 'Great value', icon: 'value' },
  { id: 'range', label: 'Wide range', icon: 'range' },
] as const

/** The range strip along the foot of the banner. */
export const HERO_RANGE = ['Cups', 'Containers', 'Bags', 'Cutlery & more'] as const

/**
 * The second banner from the old site's carousel, used here as the masthead
 * above the hero. Every word on it is part of the artwork, so the alt text
 * repeats the offer rather than describing the photograph — a screen reader
 * gets what a sighted customer gets.
 */
export const MASTHEAD = {
  image: '/brand/banner-catering-supplier.webp',
  alt: 'Your all-in-one catering supplier — bulk catering and hygiene essentials. Wide range, premium quality, bulk prices and fast nationwide delivery. Trusted by caterers, chosen for quality.',
} as const

/** Used on the About page and in the footer. Verbatim from the live site. */
export const WHO_WE_ARE =
  'ANAID Quality Disposables Limited proudly stands as a leading UK supplier of catering and janitorial disposables. Our diverse product range — sourced from trusted manufacturers and supported by in-house production — serves sectors including hospitality, retail, healthcare, and more.'

export const ONE_STOP =
  'Anaid is your one-stop solution — delivering choice, convenience, and consistency without compromise. With over 30 years of customer loyalty behind us, our reputation reflects our dedication to service, value, and excellence.'

/**
 * The four pillars. ANAID draws these as teal line-icons, and they are the one
 * piece of brand furniture that appears on every page of the old site.
 */
export const PILLARS = [
  {
    id: 'customised',
    title: 'Customised',
    body: 'Branded packaging designed to showcase your business and create a memorable customer experience.',
    image: '/brand/pillar-customised.webp',
  },
  {
    id: 'design',
    title: 'Design',
    body: 'Smart, stylish designs that combine functionality, presentation and your brand identity.',
    image: '/brand/pillar-design.webp',
  },
  {
    id: 'quality',
    title: 'Quality',
    body: 'Reliable, food-grade packaging crafted for performance, durability and professional presentation.',
    image: '/brand/pillar-quality.webp',
  },
  {
    id: 'eco',
    title: 'Eco-friendly',
    body: 'Sustainable packaging choices that help reduce environmental impact without compromising quality or performance.',
    image: '/brand/pillar-eco.webp',
  },
] as const

/**
 * The promises from the "All-In-One Catering Supplier" banner. On the old site
 * these are baked into the banner artwork; here they are live text, so they
 * reflow on a phone and can be read by a screen reader.
 */
export const PROMISES = [
  { title: 'Wide range', body: 'Everything you need, in one place.' },
  { title: 'Premium quality', body: 'Reliable products for every need.' },
  { title: 'Bulk prices', body: 'Competitive rates for every business.' },
  { title: 'Fast nationwide delivery', body: 'Across the UK, on time, every time.' },
] as const

/**
 * ANAID's sector artwork. The text is part of the image, so each alt string
 * repeats it — a screen reader gets the same offer a sighted customer does.
 */
export const SECTORS = [
  {
    id: 'kebab-pizza',
    title: 'Doner kebab & pizza shops',
    image: '/brand/sector-kebab-pizza.webp',
    alt: 'Premium packaging for doner kebab and pizza shops: pizza boxes, foil-lined boxes, kraft bags and cups.',
  },
  {
    id: 'fish-chips',
    title: 'Fish & chip shops',
    image: '/brand/sector-fish-chips.webp',
    alt: 'Premium eco-friendly products for fish and chip shops: chip trays, kraft bags, sauce pots and cartons.',
  },
  {
    id: 'ice-cream',
    title: 'Ice cream & cool drinks',
    image: '/brand/sector-ice-cream.webp',
    alt: 'Complete packing solutions for ice cream and cool drink shops: tubs, smoothie cups, spades and straws.',
  },
  {
    id: 'deals',
    title: 'Best deals & offers',
    image: '/brand/sector-deals.webp',
    alt: 'Best deals and offers: kraft cups, carriers, bags and wooden cutlery.',
  },
] as const

/** The brochure, lifted from the old site's "Download Brochure" button. */
export const BROCHURE = '/brand/anaid-brochure.pdf'

/** Opening hours, as given on the old Contact Us page. */
export const OPENING_HOURS = '09:00 – 18:00, Monday to Friday'
