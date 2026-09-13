'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireOrderingCustomer } from '@/lib/auth/guards'
import { buildOrderDraft, creditCheck } from '@/lib/basket'
import { allocateOrderNumber } from '@/lib/numbering'
import { recordAudit } from '@/lib/audit'
import { notifyCustomer, notifyStaff } from '@/lib/notifications'
import { formatPence } from '@/lib/money'

/**
 * Placing an order (LEVEL-4 §15).
 *
 * The device has told us which products it wants and how many. That is all we
 * take from it. Everything about money — prices, VAT, delivery, the total — is
 * discarded and recomputed here from ANAID's own data, because a device can be
 * altered and a total sent by one cannot be trusted.
 *
 * The ten checks of §15 are covered as follows:
 *   1  authenticated              requireOrderingCustomer
 *   2  status APPROVED, read now  requireOrderingCustomer (session reads the row)
 *   3  products exist and active  buildOrderDraft
 *   4  available in that quantity buildOrderDraft, then re-checked under lock below
 *   5  minimum order quantities   buildOrderDraft
 *   6  correct price              buildOrderDraft via the pricing engine
 *   7  correct VAT                buildOrderDraft
 *   8  correct delivery charge    buildOrderDraft
 *   9  correct grand total        buildOrderDraft
 *  10  credit limit               creditCheck
 */

export type CheckoutState = {
  message?: string
  problems?: string[]
}

export async function placeOrder(_previous: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const session = await requireOrderingCustomer()
  const { customer, user } = session

  const deliveryAddressId = String(formData.get('deliveryAddressId') ?? '')
  const billingAddressId = String(formData.get('billingAddressId') ?? '')
  const contactPhone = String(formData.get('contactPhone') ?? '').trim()
  const poReference = String(formData.get('poReference') ?? '').trim()
  const deliveryInstructions = String(formData.get('deliveryInstructions') ?? '').trim()
  const customerNotes = String(formData.get('customerNotes') ?? '').trim()
  const preferredDeliveryDateRaw = String(formData.get('preferredDeliveryDate') ?? '').trim()

  if (!contactPhone) {
    return { message: 'Enter a contact number for the delivery driver.' }
  }

  const [deliveryAddress, billingAddress] = await Promise.all([
    prisma.address.findFirst({ where: { id: deliveryAddressId, customerId: customer.id } }),
    prisma.address.findFirst({ where: { id: billingAddressId, customerId: customer.id } }),
  ])

  // An address id that is not this customer's own resolves to nothing.
  if (!deliveryAddress || !billingAddress) {
    return { message: 'Choose a delivery address and a billing address.' }
  }

  // Quantities come from the basket in the database, never from the form.
  const basketLines = await prisma.basketLine.findMany({
    where: { basket: { userId: user.id } },
    select: { productId: true, quantity: true },
  })

  const draft = await buildOrderDraft(
    customer,
    basketLines.map((line) => ({ productId: line.productId, quantity: line.quantity }))
  )

  if (draft.blockers.length > 0) {
    return { message: 'This order cannot be placed yet.', problems: draft.blockers }
  }

  const credit = await creditCheck(customer, draft.totalPence)

  if (credit.wouldExceed) {
    return {
      message: `This order would exceed your credit limit. Your available credit is ${formatPence(
        Math.max(0, credit.availablePence)
      )}. Please contact ANAID Quality Disposables Limited.`,
    }
  }

  const preferredDeliveryDate = preferredDeliveryDateRaw ? new Date(preferredDeliveryDateRaw) : null

  let orderNumber: string

  try {
    orderNumber = await prisma.$transaction(async (tx) => {
      // Check 4, again, atomically. Between the basket screen and this moment
      // another customer may have taken the last carton, so the reservation is
      // only made where the stock is genuinely there.
      for (const line of draft.lines) {
        const reserved = await tx.$executeRaw`
          UPDATE "Product"
          SET "stockReserved" = "stockReserved" + ${line.quantity}
          WHERE "id" = ${line.productId}
            AND "active" = true
            AND ("trackStock" = false OR "stockOnHand" - "stockReserved" >= ${line.quantity})
        `

        if (reserved !== 1) {
          throw new StockRaceError(line.name)
        }
      }

      const number = await allocateOrderNumber(tx)

      const order = await tx.order.create({
        data: {
          orderNumber: number,
          customerId: customer.id,
          placedById: user.id,
          status: 'RECEIVED',

          // Copied onto the order, not referenced, so history stays true if the
          // customer later moves premises.
          deliveryName: customer.businessName,
          deliveryLine1: deliveryAddress.line1,
          deliveryLine2: deliveryAddress.line2,
          deliveryCity: deliveryAddress.city,
          deliveryCounty: deliveryAddress.county,
          deliveryPostcode: deliveryAddress.postcode,
          deliveryCountry: deliveryAddress.country,
          deliveryInstructions: deliveryInstructions || deliveryAddress.deliveryInstructions,

          billingName: customer.businessName,
          billingLine1: billingAddress.line1,
          billingLine2: billingAddress.line2,
          billingCity: billingAddress.city,
          billingCounty: billingAddress.county,
          billingPostcode: billingAddress.postcode,
          billingCountry: billingAddress.country,

          contactPhone,
          poReference: poReference || null,
          preferredDeliveryDate,
          customerNotes: customerNotes || null,

          subtotalPence: draft.subtotalPence,
          vatTotalPence: draft.vatTotalPence,
          deliveryChargePence: draft.deliveryChargePence,
          totalPence: draft.totalPence,
          paymentMethod: 'ACCOUNT',

          lines: {
            create: draft.lines.map((line) => ({
              productId: line.productId,
              sku: line.sku,
              name: line.name,
              packSummary: line.packSize,
              quantity: line.quantity,
              unitPricePence: line.unitPricePence,
              priceSource: line.source,
              standardPricePence: line.standardPricePence,
              vatRateBasisPoints: line.vatRateBasisPoints,
              lineNetPence: line.lineNetPence,
              lineVatPence: line.lineVatPence,
              lineTotalPence: line.lineTotalPence,
            })),
          },

          statusChanges: {
            create: { toStatus: 'RECEIVED', byCustomerUserId: user.id, note: 'Order placed' },
          },
        },
      })

      for (const line of draft.lines) {
        const product = await tx.product.findUniqueOrThrow({
          where: { id: line.productId },
          select: { stockOnHand: true, stockReserved: true },
        })

        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            reason: 'RESERVED_FOR_ORDER',
            quantity: line.quantity,
            orderId: order.id,
            resultingOnHand: product.stockOnHand,
            resultingReserved: product.stockReserved,
            note: `Reserved for ${number}`,
          },
        })
      }

      await tx.basketLine.deleteMany({ where: { basket: { userId: user.id } } })

      return number
    })
  } catch (error) {
    if (error instanceof StockRaceError) {
      return {
        message: `${error.productName} sold out while you were checking out. Adjust your basket and try again.`,
      }
    }
    throw error
  }

  await recordAudit({
    actorType: 'CUSTOMER',
    actorId: user.id,
    actorLabel: `${user.name} (${customer.businessName})`,
    action: 'order.placed',
    entityType: 'Order',
    entityId: orderNumber,
    after: {
      orderNumber,
      totalPence: draft.totalPence,
      lines: draft.lines.length,
    },
  })

  await notifyStaff({
    type: 'order.placed',
    title: `New order ${orderNumber}`,
    body: `${customer.businessName} placed an order for ${formatPence(draft.totalPence)}.`,
    link: `/admin/orders/${orderNumber}`,
  })

  await notifyCustomer({
    customerId: customer.id,
    type: 'order.received',
    title: `We have your order ${orderNumber}`,
    body: `Thank you. Your order for ${formatPence(draft.totalPence)} has been received and will be confirmed shortly.`,
    link: `/orders/${orderNumber}`,
  })

  revalidatePath('/orders')
  revalidatePath('/', 'layout')

  redirect(`/orders/${orderNumber}?placed=1`)
}

class StockRaceError extends Error {
  constructor(public productName: string) {
    super(`${productName} is no longer available in that quantity`)
    this.name = 'StockRaceError'
  }
}
