'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireCustomer } from '@/lib/auth/guards'
import { recordAudit } from '@/lib/audit'
import { notifyStaff } from '@/lib/notifications'

/**
 * Customer cancellation (gap #11).
 *
 * A customer may cancel their own order up to the moment ANAID confirms it.
 * After that they telephone, and a member of staff amends or cancels it, so
 * that nobody cancels an order the warehouse has already started picking.
 *
 * Cancelling releases the stock reservation — the goods go back to being
 * available to everyone else immediately.
 */
export async function cancelOrder(orderNumber: string, reason: string) {
  const session = await requireCustomer()

  const order = await prisma.order.findFirst({
    where: { orderNumber, customerId: session.customer.id },
    include: { lines: true },
  })

  if (!order) return { ok: false as const, message: 'We could not find that order.' }

  if (order.status !== 'RECEIVED') {
    return {
      ok: false as const,
      message:
        'This order has already been confirmed and is being prepared. Call us and we will sort it out.',
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const line of order.lines) {
      await tx.$executeRaw`
        UPDATE "Product"
        SET "stockReserved" = GREATEST(0, "stockReserved" - ${line.quantity})
        WHERE "id" = ${line.productId}
      `

      const product = await tx.product.findUniqueOrThrow({
        where: { id: line.productId },
        select: { stockOnHand: true, stockReserved: true },
      })

      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          reason: 'RELEASED_FROM_ORDER',
          quantity: -line.quantity,
          orderId: order.id,
          resultingOnHand: product.stockOnHand,
          resultingReserved: product.stockReserved,
          note: `Released from cancelled ${order.orderNumber}`,
        },
      })
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelled by customer',
      },
    })

    await tx.orderStatusChange.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: 'CANCELLED',
        byCustomerUserId: session.user.id,
        note: reason || 'Cancelled by customer',
      },
    })
  })

  await recordAudit({
    actorType: 'CUSTOMER',
    actorId: session.user.id,
    actorLabel: `${session.user.name} (${session.customer.businessName})`,
    action: 'order.cancelled',
    entityType: 'Order',
    entityId: order.orderNumber,
    before: { status: order.status },
    after: { status: 'CANCELLED', reason },
  })

  await notifyStaff({
    type: 'order.cancelled',
    title: `Order ${order.orderNumber} cancelled`,
    body: `${session.customer.businessName} cancelled their order. Stock has been released.`,
    link: `/admin/orders/${order.orderNumber}`,
  })

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderNumber}`)

  return { ok: true as const }
}
