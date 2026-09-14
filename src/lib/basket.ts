import { prisma } from './db'
import { getSettings } from './settings'
import { priceProducts, type PricingCustomer } from './pricing'
import { formatPence, vatOn } from './money'
import { availableStock } from './catalogue'
import type { PriceSource } from '../generated/prisma/client'

/**
 * The basket, and the arithmetic behind it.
 *
 * `buildOrderDraft` is the single place an order total is calculated. The
 * basket screen calls it to show a total; the checkout calls the very same
 * function again to decide what to charge. Nothing the browser sends is used —
 * only product ids and quantities, which are then re-priced from the database
 * (LEVEL-4 §15, "The recalculation").
 */

export type DraftLine = {
  productId: string
  sku: string
  name: string
  slug: string
  packSize: string | null
  sellUnit: string
  quantity: number
  minOrderQuantity: number
  unitPricePence: number
  standardPricePence: number
  source: PriceSource
  vatRateBasisPoints: number
  lineNetPence: number
  lineVatPence: number
  lineTotalPence: number
  availableStock: number | null
  /** Reasons this line cannot be ordered as it stands. */
  issues: string[]
  nextBand: { minQuantity: number; pricePence: number; savingPerUnitPence: number } | null
}

export type OrderDraft = {
  lines: DraftLine[]
  subtotalPence: number
  vatTotalPence: number
  deliveryChargePence: number
  totalPence: number
  freeDeliveryThresholdPence: number
  /** How much more is needed for free delivery; zero once it is reached. */
  remainingForFreeDeliveryPence: number
  minimumOrderValuePence: number
  /** Everything stopping this order from being placed. Empty means good to go. */
  blockers: string[]
}

export async function getOrCreateBasket(userId: string) {
  return prisma.basket.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
}

export async function basketItems(userId: string) {
  const basket = await prisma.basket.findUnique({
    where: { userId },
    include: { lines: { orderBy: { createdAt: 'asc' } } },
  })

  return basket?.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })) ?? []
}

/**
 * Price and check a set of lines. The customer must come from the session.
 */
export async function buildOrderDraft(
  customer: PricingCustomer,
  items: { productId: string; quantity: number }[]
): Promise<OrderDraft> {
  const settings = await getSettings()

  const freeDeliveryThresholdPence = settings['commerce.deliveryFreeThresholdPence']
  const minimumOrderValuePence = settings['commerce.minimumOrderValuePence']

  if (items.length === 0) {
    return {
      lines: [],
      subtotalPence: 0,
      vatTotalPence: 0,
      deliveryChargePence: 0,
      totalPence: 0,
      freeDeliveryThresholdPence,
      remainingForFreeDeliveryPence: freeDeliveryThresholdPence,
      minimumOrderValuePence,
      blockers: ['Your basket is empty.'],
    }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    select: {
      id: true,
      sku: true,
      name: true,
      slug: true,
      packSize: true,
      sellUnit: true,
      categoryId: true,
      active: true,
      minOrderQuantity: true,
      standardPricePence: true,
      vatRateBasisPoints: true,
      stockOnHand: true,
      stockReserved: true,
      trackStock: true,
    },
  })

  const productById = new Map(products.map((product) => [product.id, product]))
  const quantities = new Map(items.map((item) => [item.productId, item.quantity]))

  const priceable = products.filter((product) => product.active)
  const prices = await priceProducts(customer, priceable, quantities)

  const lines: DraftLine[] = []
  const blockers: string[] = []

  for (const item of items) {
    const product = productById.get(item.productId)

    // Discontinued between adding to the basket and checking out.
    if (!product || !product.active) {
      blockers.push('A product in your basket is no longer available. Remove it to continue.')
      continue
    }

    const price = prices.get(product.id)
    if (!price) continue

    const quantity = Math.max(1, Math.trunc(item.quantity))
    const lineNetPence = price.unitPricePence * quantity
    const lineVatPence = vatOn(lineNetPence, product.vatRateBasisPoints)
    const available = availableStock(product)
    const issues: string[] = []

    if (quantity < product.minOrderQuantity) {
      issues.push(`Minimum order is ${product.minOrderQuantity} ${product.sellUnit}s`)
    }

    if (available !== null && quantity > available) {
      issues.push(available === 0 ? 'Out of stock' : `Only ${available} in stock`)
    }

    lines.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      packSize: product.packSize,
      sellUnit: product.sellUnit,
      quantity,
      minOrderQuantity: product.minOrderQuantity,
      unitPricePence: price.unitPricePence,
      standardPricePence: price.standardPricePence,
      source: price.source,
      vatRateBasisPoints: product.vatRateBasisPoints,
      lineNetPence,
      lineVatPence,
      lineTotalPence: lineNetPence + lineVatPence,
      availableStock: available,
      issues,
      nextBand: price.nextBand,
    })
  }

  const subtotalPence = lines.reduce((total, line) => total + line.lineNetPence, 0)
  const vatTotalPence = lines.reduce((total, line) => total + line.lineVatPence, 0)

  // Gap #15: the threshold is judged on the subtotal BEFORE VAT by default, so
  // the figure matches the number the customer is looking at.
  const thresholdBasis = settings['commerce.deliveryThresholdIncludesVat']
    ? subtotalPence + vatTotalPence
    : subtotalPence

  const qualifiesForFreeDelivery = thresholdBasis >= freeDeliveryThresholdPence
  const deliveryChargePence = qualifiesForFreeDelivery ? 0 : settings['commerce.deliveryChargePence']

  if (subtotalPence < minimumOrderValuePence && lines.length > 0) {
    blockers.push(
      `Orders start at ${formatPence(minimumOrderValuePence)} before VAT. Add ${formatPence(
        minimumOrderValuePence - subtotalPence
      )} more to continue.`
    )
  }

  for (const line of lines) {
    for (const issue of line.issues) {
      blockers.push(`${line.name}: ${issue.toLowerCase()}`)
    }
  }

  return {
    lines,
    subtotalPence,
    vatTotalPence,
    deliveryChargePence,
    totalPence: subtotalPence + vatTotalPence + deliveryChargePence,
    freeDeliveryThresholdPence,
    remainingForFreeDeliveryPence: Math.max(0, freeDeliveryThresholdPence - thresholdBasis),
    minimumOrderValuePence,
    blockers,
  }
}

/** One line of the running basket, as the margin panel and the header show it. */
export type BasketLineSummary = {
  productId: string
  name: string
  slug: string
  quantity: number
  unitPricePence: number
  lineNetPence: number
  issues: string[]
}

export type BasketSummary = {
  lines: BasketLineSummary[]
  subtotalPence: number
  remainingForFreeDeliveryPence: number
  freeDeliveryThresholdPence: number
}

/**
 * The basket as the shop needs it: enough to show a running total, and no more.
 *
 * This exists so that adding a line can hand the new basket straight back to
 * the browser. The alternative — revalidating the page and letting the server
 * re-render it — meant re-reading and re-pricing all hundred and thirty-six
 * products to discover that one number had changed.
 */
export async function basketSummary(
  customer: PricingCustomer,
  userId: string
): Promise<BasketSummary> {
  const draft = await buildOrderDraft(customer, await basketItems(userId))

  return {
    lines: draft.lines.map((line) => ({
      productId: line.productId,
      name: line.name,
      slug: line.slug,
      quantity: line.quantity,
      unitPricePence: line.unitPricePence,
      lineNetPence: line.lineNetPence,
      issues: line.issues,
    })),
    subtotalPence: draft.subtotalPence,
    remainingForFreeDeliveryPence: draft.remainingForFreeDeliveryPence,
    freeDeliveryThresholdPence: draft.freeDeliveryThresholdPence,
  }
}

/**
 * What this customer currently owes: unpaid invoices plus orders not yet
 * invoiced (gap #8). Invoices arrive in a later phase; until then every live
 * order counts, which is the prudent half of the rule and the one that stops a
 * customer quietly passing their limit.
 */
export async function outstandingBalancePence(customerId: string): Promise<number> {
  const result = await prisma.order.aggregate({
    where: { customerId, status: { not: 'CANCELLED' } },
    _sum: { totalPence: true },
  })

  return result._sum.totalPence ?? 0
}

export type CreditCheck = {
  required: boolean
  limitPence: number
  outstandingPence: number
  availablePence: number
  wouldExceed: boolean
}

export async function creditCheck(
  customer: { id: string; creditLimitPence: number },
  orderTotalPence: number
): Promise<CreditCheck> {
  const outstandingPence = await outstandingBalancePence(customer.id)
  const availablePence = customer.creditLimitPence - outstandingPence

  return {
    required: customer.creditLimitPence > 0,
    limitPence: customer.creditLimitPence,
    outstandingPence,
    availablePence,
    wouldExceed: customer.creditLimitPence > 0 && orderTotalPence > availablePence,
  }
}
