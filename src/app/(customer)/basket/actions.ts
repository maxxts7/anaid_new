'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireOrderingCustomer } from '@/lib/auth/guards'
import { getOrCreateBasket } from '@/lib/basket'

/**
 * Basket actions.
 *
 * Every one of these begins with requireOrderingCustomer, so an unapproved
 * account cannot put anything in a basket even by calling the action directly.
 * Line ids are always checked against the signed-in user's own basket — a line
 * id from somebody else's basket resolves to nothing.
 */

export async function addToBasket(productId: string, quantity: number) {
  const session = await requireOrderingCustomer()

  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
    select: { id: true, minOrderQuantity: true },
  })

  if (!product) {
    return { ok: false as const, message: 'That product is no longer available.' }
  }

  const wanted = Math.max(Math.trunc(quantity) || 0, product.minOrderQuantity)
  const basket = await getOrCreateBasket(session.user.id)

  await prisma.basketLine.upsert({
    where: { basketId_productId: { basketId: basket.id, productId: product.id } },
    update: { quantity: { increment: wanted } },
    create: { basketId: basket.id, productId: product.id, quantity: wanted },
  })

  revalidatePath('/basket')
  revalidatePath('/', 'layout')

  return { ok: true as const, message: 'Added to basket' }
}

export async function setBasketLineQuantity(lineId: string, quantity: number) {
  const session = await requireOrderingCustomer()

  const line = await prisma.basketLine.findFirst({
    where: { id: lineId, basket: { userId: session.user.id } },
    include: { product: { select: { minOrderQuantity: true } } },
  })

  if (!line) return { ok: false as const, message: 'That basket line has gone.' }

  const next = Math.trunc(quantity)

  if (next <= 0) {
    await prisma.basketLine.delete({ where: { id: line.id } })
  } else {
    await prisma.basketLine.update({
      where: { id: line.id },
      data: { quantity: Math.max(next, line.product.minOrderQuantity) },
    })
  }

  revalidatePath('/basket')
  revalidatePath('/', 'layout')

  return { ok: true as const }
}

export async function removeBasketLine(lineId: string) {
  const session = await requireOrderingCustomer()

  await prisma.basketLine.deleteMany({
    where: { id: lineId, basket: { userId: session.user.id } },
  })

  revalidatePath('/basket')
  revalidatePath('/', 'layout')

  return { ok: true as const }
}

export async function emptyBasket() {
  const session = await requireOrderingCustomer()

  await prisma.basketLine.deleteMany({ where: { basket: { userId: session.user.id } } })

  revalidatePath('/basket')
  revalidatePath('/', 'layout')

  return { ok: true as const }
}
