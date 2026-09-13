'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth/guards'
import { recordAudit } from '@/lib/audit'
import { notifyCustomer } from '@/lib/notifications'
import { nextStatus } from '@/lib/orders'
import type { OrderStatus } from '@/generated/prisma/client'

/**
 * Moving an order along (LEVEL-4 §16).
 *
 * Orders advance one step at a time, and every step is recorded with who took
 * it. The step that matters is DISPATCHED: that is where reserved stock becomes
 * stock that has actually left the building (gap #2).
 */

const CUSTOMER_FACING: Partial<Record<OrderStatus, { title: string; body: string }>> = {
  CONFIRMED: {
    title: 'Your order is confirmed',
    body: 'We have checked your order and it is going into production. We will let you know when it is on its way.',
  },
  DISPATCHED: {
    title: 'Your order has left us',
    body: 'Your order has been dispatched and is on its way to you.',
  },
  OUT_FOR_DELIVERY: {
    title: 'Your order is out for delivery',
    body: 'Your order is on the van and should reach you today.',
  },
  DELIVERED: {
    title: 'Your order has been delivered',
    body: 'Your order has been delivered. If anything is wrong with it, tell us as soon as you can.',
  },
}

export type OrderActionState = { message?: string; ok?: boolean }

export async function advanceOrder(
  _previous: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const { staff } = await requireStaff('orders.advance')

  const orderNumber = String(formData.get('orderNumber') ?? '')
  const requested = String(formData.get('toStatus') ?? '') as OrderStatus

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { lines: true, customer: { select: { businessName: true } } },
  })

  if (!order) return { message: 'That order no longer exists.' }
  if (order.status === 'CANCELLED') return { message: 'This order was cancelled.' }

  const expected = nextStatus(order.status)

  if (!expected || requested !== expected) {
    return { message: `An order at ${order.status} can only move to ${expected ?? 'nowhere — it is finished'}.` }
  }

  await prisma.$transaction(async (tx) => {
    // Dispatch is the moment reserved stock actually leaves.
    if (requested === 'DISPATCHED') {
      for (const line of order.lines) {
        await tx.$executeRaw`
          UPDATE "Product"
          SET "stockOnHand" = "stockOnHand" - ${line.quantity},
              "stockReserved" = GREATEST(0, "stockReserved" - ${line.quantity})
          WHERE "id" = ${line.productId} AND "trackStock" = true
        `

        const product = await tx.product.findUniqueOrThrow({
          where: { id: line.productId },
          select: { stockOnHand: true, stockReserved: true, trackStock: true },
        })

        if (product.trackStock) {
          await tx.stockMovement.create({
            data: {
              productId: line.productId,
              reason: 'DISPATCHED',
              quantity: -line.quantity,
              orderId: order.id,
              staffId: staff.id,
              resultingOnHand: product.stockOnHand,
              resultingReserved: product.stockReserved,
              note: `Dispatched on ${order.orderNumber}`,
            },
          })
        }
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: requested,
        confirmedAt: requested === 'CONFIRMED' ? new Date() : undefined,
        dispatchedAt: requested === 'DISPATCHED' ? new Date() : undefined,
        deliveredAt: requested === 'DELIVERED' ? new Date() : undefined,
        actualDeliveryDate: requested === 'DELIVERED' ? new Date() : undefined,
      },
    })

    await tx.orderStatusChange.create({
      data: { orderId: order.id, fromStatus: order.status, toStatus: requested, staffId: staff.id },
    })
  })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'order.status_changed',
    entityType: 'Order',
    entityId: order.orderNumber,
    before: { status: order.status },
    after: { status: requested },
  })

  const message = CUSTOMER_FACING[requested]
  if (message) {
    await notifyCustomer({
      customerId: order.customerId,
      type: `order.${requested.toLowerCase()}`,
      title: `${message.title} — ${order.orderNumber}`,
      body: message.body,
      link: `/orders/${order.orderNumber}`,
    })
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderNumber}`)

  return { ok: true, message: `Moved to ${requested.toLowerCase().replace(/_/g, ' ')}.` }
}

export async function cancelOrderAsStaff(
  _previous: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const { staff } = await requireStaff('orders.cancel')

  const orderNumber = String(formData.get('orderNumber') ?? '')
  const reason = String(formData.get('reason') ?? '').trim()

  if (!reason) return { message: 'Give a reason — it goes on the order and into the audit log.' }

  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { lines: true } })

  if (!order) return { message: 'That order no longer exists.' }
  if (order.status === 'CANCELLED') return { message: 'This order is already cancelled.' }

  const alreadyDispatched = ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)

  await prisma.$transaction(async (tx) => {
    // Stock only goes back if it never left.
    if (!alreadyDispatched) {
      for (const line of order.lines) {
        await tx.$executeRaw`
          UPDATE "Product"
          SET "stockReserved" = GREATEST(0, "stockReserved" - ${line.quantity})
          WHERE "id" = ${line.productId} AND "trackStock" = true
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
            staffId: staff.id,
            resultingOnHand: product.stockOnHand,
            resultingReserved: product.stockReserved,
            note: `Released from cancelled ${order.orderNumber}`,
          },
        })
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason },
    })

    await tx.orderStatusChange.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: 'CANCELLED',
        staffId: staff.id,
        note: reason,
      },
    })
  })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'order.cancelled',
    entityType: 'Order',
    entityId: order.orderNumber,
    before: { status: order.status },
    after: { status: 'CANCELLED', reason, stockReturned: !alreadyDispatched },
  })

  await notifyCustomer({
    customerId: order.customerId,
    type: 'order.cancelled',
    title: `Order ${order.orderNumber} has been cancelled`,
    body: `Your order has been cancelled. ${reason}`,
    link: `/orders/${order.orderNumber}`,
  })

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderNumber}`)

  return { ok: true, message: 'Order cancelled.' }
}

export async function saveInternalNote(
  _previous: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const { staff } = await requireStaff('orders.view')

  const orderNumber = String(formData.get('orderNumber') ?? '')
  const internalNotes = String(formData.get('internalNotes') ?? '').trim()

  await prisma.order.update({ where: { orderNumber }, data: { internalNotes: internalNotes || null } })

  await recordAudit({
    actorType: 'STAFF',
    actorId: staff.id,
    actorLabel: staff.name,
    action: 'order.note_changed',
    entityType: 'Order',
    entityId: orderNumber,
    after: { internalNotes },
  })

  revalidatePath(`/admin/orders/${orderNumber}`)

  return { ok: true, message: 'Note saved.' }
}
