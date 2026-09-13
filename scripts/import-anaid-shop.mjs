/**
 * Import the live ANAID catalogue from anaidqualitydisposables.uk.
 *
 * Reads WooCommerce's public Store API, parses the specification table each
 * product carries, downloads the photography, and writes prisma/seed-data.json
 * and prisma/seed-images.json. `npm run db:seed` then applies it.
 *
 *   node scripts/import-anaid-shop.mjs
 *   node scripts/import-anaid-shop.mjs --no-images    # data only
 *
 * ONE THING IS NOT REAL: prices. Every product on the live site carries one of
 * three placeholder values (£100, £200, £300), so they cannot be used. Trade
 * prices are derived here from the product family and the case quantity — see
 * RATES below — and are plausible demo figures, not ANAID's real prices. Replace
 * them in the admin, or by re-importing once the live site prices are right.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://anaidqualitydisposables.uk/wp-json/wc/store/v1'
const skipImages = process.argv.includes('--no-images')

/**
 * Trade price per individual item, in pence, by product family. The list price
 * is this multiplied by the number of items in a case. Figures are the sort of
 * money a UK disposables distributor charges; they are not ANAID's own.
 */
const RATES = [
  [/pizza box/i, 32],
  [/burger box|chicken box|snack box|meal box|infinity|clamshell|corrugated/i, 8],
  [/bagasse/i, 11],
  [/foil container|foil tray|aluminium/i, 9],
  [/foil|cling film/i, 220],
  [/toilet roll|centrefeed|blue ?roll|banqueting|till roll|kitchen roll|rolls?$/i, 85],
  [/bin bag|refuse sack/i, 9],
  [/carrier|paper bag|strung bag|greaseproof|sheet|bags? & sheets/i, 3],
  [/coffee cup|paper cup|smoothie|milkshake|juice cup|cup carrier/i, 6],
  [/lid/i, 3],
  [/straw/i, 1],
  [/sauce pot|sauce cup|portion pot|ramekin/i, 2],
  [/cutlery|fork|spoon|knife|spork|stirrer|spade/i, 2],
  [/napkin|serviette/i, 1],
  [/glove/i, 4],
  [/plate|bowl|tray/i, 5],
  [/ice.?cream|knickerbocker|screw ?ball|sundae/i, 7],
  [/container|tub|pot/i, 6],
]

const decode = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&#215;/g, '×')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

const slugify = (value) =>
  decode(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)

/** Deterministic pseudo-random, so re-importing does not reshuffle stock. */
function seededNumber(text, min, max) {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return min + (hash % (max - min + 1))
}

async function fetchAll(resource) {
  const collected = []

  for (let page = 1; page <= 10; page++) {
    const response = await fetch(`${API}/${resource}?per_page=100&page=${page}`, {
      headers: { 'User-Agent': 'anaid-catalogue-import/1.0' },
    })
    if (!response.ok) throw new Error(`${resource} page ${page}: HTTP ${response.status}`)

    const batch = await response.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    collected.push(...batch)
    if (batch.length < 100) break
  }

  return collected
}

/** The specification table WooCommerce keeps in the short description. */
function parseSpecs(product) {
  const html = product.short_description ?? ''
  const rows = [...html.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)]
  const specs = {}

  for (const [, key, value] of rows) {
    const cleanKey = decode(key)
    const cleanValue = decode(value)
    if (cleanKey && cleanValue && cleanValue !== '×') specs[cleanKey] = cleanValue
  }

  return specs
}

/**
 * How many items are in a case.
 *
 * The live data is inconsistent: some products list "1000", some list two
 * variants as "1000,500", and some omit the quantity but give a pack size such
 * as "10x100". Take the first quantity offered, fall back to multiplying out the
 * pack size, and refuse anything absurd — a mis-parse here becomes a £500,000
 * box of plates.
 */
function caseQuantity(quantityText, packSize) {
  const first = String(quantityText ?? '')
    .split(/[,/;]/)[0]
    .replace(/[^0-9]/g, '')

  const stated = parseInt(first, 10)
  if (Number.isFinite(stated) && stated >= 1 && stated <= 20_000) return stated

  // "10x100" or "1 × 12" -> multiply the parts out.
  const parts = String(packSize ?? '')
    .split(/[,/;]/)[0]
    .split(/[x×]/i)
    .map((part) => parseInt(part.replace(/[^0-9]/g, ''), 10))
    .filter((part) => Number.isFinite(part) && part > 0)

  if (parts.length > 0) {
    const product = parts.reduce((total, part) => total * part, 1)
    if (product >= 1 && product <= 20_000) return product
  }

  return 1
}

/**
 * Some names arrive shouting ("DOME LID FOR SMOOTHIE CUP"), others are already
 * sentence case. Only the shouted ones are touched, and the units and materials
 * a trade buyer reads as abbreviations keep their own casing.
 */
const KEEP_CASE = new Map(
  [
    'PLA', 'PP', 'PET', 'EPS', 'HDPE', 'LDPE', 'PVC', 'UK', 'BBQ', 'PE', 'RPET', 'CPLA',
  ].map((word) => [word.toLowerCase(), word])
)

function tidyName(name) {
  const letters = name.replace(/[^A-Za-z]/g, '')
  if (letters.length === 0) return name

  const upperRatio = (name.match(/[A-Z]/g) ?? []).length / letters.length

  // Leave sentence case alone; fix shouting and fix all-lower-case.
  if (upperRatio > 0.05 && upperRatio < 0.5) return name

  return name
    .toLowerCase()
    .split(' ')
    .map((word) => {
      const kept = KEEP_CASE.get(word)
      if (kept) return kept
      // 7oz, 500ml, 12x9 and friends keep their unit lower case.
      if (/^[0-9]/.test(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}


function pick(specs, ...keys) {
  for (const key of keys) {
    const found = Object.keys(specs).find((k) => k.toLowerCase() === key.toLowerCase())
    if (found && specs[found]) return specs[found]
  }
  return null
}

function unitPricePence(name, categoryNames) {
  const haystack = `${name} ${categoryNames.join(' ')}`
  for (const [pattern, pence] of RATES) {
    if (pattern.test(haystack)) return pence
  }
  return 5
}

/** £ rounded to the nearest 5p, floored at £2.50 and capped at £500 a case. */
function roundPrice(pence) {
  return Math.min(50_000, Math.max(250, Math.round(pence / 5) * 5))
}

/**
 * `crop` for category banners, which are decorative. Product shots are NOT
 * cropped: many are marketing tiles carrying ANAID's own wording, and a centre
 * crop cuts the words in half. They are fitted whole onto a white ground and
 * the UI centres them.
 */
async function downloadImage(url, destination, mode = 'fit') {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'anaid-catalogue-import/1.0' },
    signal: AbortSignal.timeout(40_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const image = sharp(Buffer.from(await response.arrayBuffer())).rotate()

  if (mode === 'crop') {
    await image.resize(1000, 800, { fit: 'cover', position: 'centre' }).webp({ quality: 82 }).toFile(destination)
    return
  }

  const fitted = image.resize(1100, 900, { fit: 'inside', withoutEnlargement: true }).flatten({
    background: '#ffffff',
  })

  await fitted.clone().webp({ quality: 86 }).toFile(destination)

  // A tile-sized variant, so a phone on a kitchen wifi downloads 15KB per
  // product rather than 90KB. The card serves it through srcset.
  await fitted
    .clone()
    .resize(440, 360, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(destination.replace(/\.webp$/, '@small.webp'))
}

// ---------------------------------------------------------------------------

console.log('Reading the live catalogue…')
const [rawProducts, rawCategories] = await Promise.all([
  fetchAll('products'),
  fetchAll('products/categories'),
])
console.log(`  ${rawProducts.length} products, ${rawCategories.length} categories`)

const categoryById = new Map(rawCategories.map((category) => [category.id, category]))

const categories = rawCategories
  .map((category) => {
    const parent = category.parent ? categoryById.get(category.parent) : null
    return {
      name: decode(category.name),
      slug: category.slug,
      description: category.description ? decode(category.description) : null,
      parentSlug: parent ? parent.slug : null,
      sortOrder: parent ? 10 : 0,
      active: true,
      imageUrl: category.image?.src ?? null,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

const usedSkus = new Set()
const products = []
const images = {}

for (const raw of rawProducts) {
  const specs = parseSpecs(raw)
  const name = tidyName(decode(raw.name))
  const categoryNames = (raw.categories ?? []).map((category) => decode(category.name))
  const primaryCategory = raw.categories?.[0]

  // Their own SKU where they have one, otherwise one derived from the name.
  const rawSku = (raw.sku || pick(specs, 'Product SKU', 'Product Name') || '').toUpperCase()
  let sku =
    rawSku.replace(/[^A-Z0-9-]+/g, '').slice(0, 24) ||
    slugify(name).toUpperCase().replace(/-/g, '').slice(0, 18)

  if (!sku) sku = `ANAID${products.length + 1}`
  let candidate = sku
  let suffix = 2
  while (usedSkus.has(candidate)) candidate = `${sku}-${suffix++}`
  sku = candidate
  usedSkus.add(sku)

  const packSize = pick(specs, 'Pack Size', 'Pack size', 'Item per pack (pcs)', 'Item Per Pack')
  const quantityText = pick(specs, 'Quantity', 'Quanty', 'Quanity')
  const unitsPerCarton = caseQuantity(quantityText, packSize)

  const colour = pick(specs, 'Product Colour')
  const material = pick(specs, 'Product Material')

  const standardPricePence = roundPrice(unitPricePence(name, categoryNames) * unitsPerCarton)

  // "Black PP. 20x50 per case, 1000 units." Abbreviations keep their own case,
  // and the case is described once.
  const descriptionParts = [
    colour && material ? `${colour} ${material}.` : material ? `${material}.` : null,
    packSize && unitsPerCarton > 1
      ? `${packSize} per case, ${unitsPerCarton} units.`
      : packSize
        ? `${packSize} per case.`
        : unitsPerCarton > 1
          ? `${unitsPerCarton} per case.`
          : null,
  ].filter(Boolean)

  const imageSrc = raw.images?.[0]?.src ?? null

  products.push({
    sku,
    name,
    slug: raw.slug || slugify(name),
    description: descriptionParts.join(' ') || null,
    categorySlug: primaryCategory?.slug ?? 'other',
    barcode: null,
    brand: null,
    size: pick(specs, 'Product Size'),
    material,
    colour,
    packSize,
    unitsPerCarton,
    cartonQuantity: 1,
    minOrderQuantity: 1,
    standardPricePence,
    vatRateBasisPoints: 2000,
    stockOnHand: seededNumber(sku, 40, 600),
    lowStockThreshold: 25,
    trackStock: true,
    featured: false,
    active: true,
    weightGrams: null,
    dimensions: null,
    sourceUrl: raw.permalink ?? null,
    imageSrc,
  })
}

// Products with photography lead the catalogue.
const withImages = products.filter((product) => product.imageSrc)
for (const product of withImages.slice(0, 4)) product.featured = true

console.log(`  ${withImages.length} products have photography`)

if (!skipImages) {
  const productDir = join(root, 'public', 'products')
  const categoryDir = join(root, 'public', 'categories')
  mkdirSync(productDir, { recursive: true })
  mkdirSync(categoryDir, { recursive: true })

  console.log('\nDownloading product photography…')
  for (const product of withImages) {
    const file = `${product.sku}.webp`
    const destination = join(productDir, file)

    try {
      if (!existsSync(destination)) await downloadImage(product.imageSrc, destination)
      images[product.sku] = { file: `/products/${file}`, alt: product.name }
      process.stdout.write('.')
    } catch (error) {
      console.log(`\n  warn ${product.sku}: ${error.message}`)
    }
  }

  console.log('\nDownloading category photography…')
  for (const category of categories) {
    if (!category.imageUrl) continue
    const destination = join(categoryDir, `${category.slug}.webp`)

    try {
      if (!existsSync(destination)) await downloadImage(category.imageUrl, destination, 'crop')
      category.image = `/categories/${category.slug}.webp`
      process.stdout.write('.')
    } catch (error) {
      console.log(`\n  warn ${category.slug}: ${error.message}`)
    }
  }
  console.log()
}

// Bulk bands on the busiest lines, so the pricing ladder has something to show.
const quantityBreaks = []
for (const product of withImages.slice(0, 12)) {
  quantityBreaks.push(
    { sku: product.sku, minQuantity: 5, pricePence: roundPrice(product.standardPricePence * 0.94) },
    { sku: product.sku, minQuantity: 10, pricePence: roundPrice(product.standardPricePence * 0.88) }
  )
}

const pricingLevels = [
  { code: 'STD', name: 'Standard', discountBasisPoints: 0, isDefault: true, sortOrder: 1, active: true },
  { code: 'WS1', name: 'Wholesale Level 1', discountBasisPoints: 500, isDefault: false, sortOrder: 2, active: true },
  { code: 'WS2', name: 'Wholesale Level 2', discountBasisPoints: 1000, isDefault: false, sortOrder: 3, active: true },
  { code: 'WS3', name: 'Wholesale Level 3', discountBasisPoints: 1500, isDefault: false, sortOrder: 4, active: true },
  { code: 'VIP', name: 'VIP', discountBasisPoints: 2000, isDefault: false, sortOrder: 5, active: true },
]

writeFileSync(
  join(root, 'prisma', 'seed-data.json'),
  JSON.stringify(
    {
      source: 'https://anaidqualitydisposables.uk — imported via the WooCommerce Store API',
      importedAt: new Date().toISOString(),
      pricesAreEstimates: true,
      categories: categories.map(({ imageUrl, ...rest }) => rest),
      products: products.map(({ imageSrc, ...rest }) => rest),
      pricingLevels,
      quantityBreaks,
    },
    null,
    2
  )
)

writeFileSync(join(root, 'prisma', 'seed-images.json'), JSON.stringify(images, null, 2))

console.log(
  `\nWrote ${products.length} products and ${categories.length} categories.` +
    `\n${Object.keys(images).length} product images saved.` +
    `\nPrices are DERIVED estimates — the live site has placeholder pricing.`
)
