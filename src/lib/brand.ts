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
