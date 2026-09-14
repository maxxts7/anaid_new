'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireOrderingCustomer } from '@/lib/auth/guards'
import { basketSummary, getOrCreateBasket } from '@/lib/basket'

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

  // The basket screen is stale now, but the page the customer is standing on is
  // not: it hands the new basket back below and the browser applies it. A blunt
  // revalidate of the whole layout would re-price every product in the shop to
  // deliver one changed total, which is seconds of work for nothing.
  revalidatePath('/basket')

  return {
    ok: true as const,
    message: 'Added to basket',
    summary: await basketSummary(session.customer, session.user.id),
  }
}

/**
 * Set a product's quantity outright, addressed by product rather than by line.
 *
 * The shop's steppers know what they are looking at but not what line it became
 * in the basket, and looking one up to change it would be a round trip before
 * the round trip. Zero removes the line; anything below the product's minimum
 * is lifted to it, so the rule cannot be stepped under.
 */
export async function setBasketQuantity(productId: string, quantity: number) {
  const session = await requireOrderingCustomer()

  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
    select: { id: true, minOrderQuantity: true },
  })

  if (!product) {
    return { ok: false as const, message: 'That product is no longer available.' }
  }

  const basket = await getOrCreateBasket(session.user.id)
  const wanted = Math.trunc(quantity) || 0

  if (wanted <= 0) {
    await prisma.basketLine.deleteMany({ where: { basketId: basket.id, productId: product.id } })
  } else {
    const next = Math.max(wanted, product.minOrderQuantity)
    await prisma.basketLine.upsert({
      where: { basketId_productId: { basketId: basket.id, productId: product.id } },
      update: { quantity: next },
      create: { basketId: basket.id, productId: product.id, quantity: next },
    })
  }

  revalidatePath('/basket')

  return {
    ok: true as const,
    message: 'Basket updated',
    summary: await basketSummary(session.customer, session.user.id),
  }
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
