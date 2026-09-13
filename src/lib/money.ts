/**
 * Money.
 *
 * Every amount in this system is an integer number of PENCE, and every rate is
 * an integer number of BASIS POINTS (2000 = 20.00%). Nothing here returns a
 * float, and no price is ever multiplied as a decimal. This is what stops an
 * invoice total from landing a penny away from the sum of its lines.
 */

/** 2000 basis points = 20.00%. */
export const BASIS_POINTS_SCALE = 10_000

/** £32.50 -> 3250. Accepts "32.50", "32.5", "£32.50" or 32.5. */
export function parsePence(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100)
  }

  const cleaned = input.trim().replace(/[£,\s]/g, '')
  if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) {
    throw new Error(`Not a valid amount: ${input}`)
  }

  const negative = cleaned.startsWith('-')
  const [whole, fraction = ''] = cleaned.replace('-', '').split('.')
  const pence = Number(whole) * 100 + Number((fraction + '00').slice(0, 2))
  return negative ? -pence : pence
}

/** 3250 -> "£32.50". */
export function formatPence(pence: number): string {
  const negative = pence < 0
  const absolute = Math.abs(pence)
  const formatted = `£${Math.floor(absolute / 100).toLocaleString('en-GB')}.${String(absolute % 100).padStart(2, '0')}`
  return negative ? `-${formatted}` : formatted
}

/** 3250 -> "32.50", for form fields where the £ is already on the label. */
export function penceToInput(pence: number): string {
  const absolute = Math.abs(pence)
  return `${pence < 0 ? '-' : ''}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`
}

/** 2000 -> "20%", 1750 -> "17.5%". */
export function formatBasisPoints(basisPoints: number): string {
  const percent = basisPoints / 100
  return `${Number.isInteger(percent) ? percent : percent.toFixed(2).replace(/0$/, '')}%`
}

/**
 * Apply a discount expressed in basis points, rounding half up to the nearest
 * penny. 3600 at 1000bp (10%) -> 3240.
 */
export function applyDiscount(pence: number, discountBasisPoints: number): number {
  if (discountBasisPoints <= 0) return pence
  const discount = roundHalfUp(pence * discountBasisPoints, BASIS_POINTS_SCALE)
  return pence - discount
}

/** VAT on a net amount. 3240 at 2000bp -> 648. */
export function vatOn(netPence: number, vatRateBasisPoints: number): number {
  if (vatRateBasisPoints <= 0) return 0
  return roundHalfUp(netPence * vatRateBasisPoints, BASIS_POINTS_SCALE)
}

/**
 * Integer division rounding half away from zero — the convention HMRC expects
 * and the one a customer checking the arithmetic by hand will use.
 */
function roundHalfUp(numerator: number, denominator: number): number {
  const sign = numerator < 0 ? -1 : 1
  const absolute = Math.abs(numerator)
  return sign * Math.floor((absolute + denominator / 2) / denominator)
}

/** Sum helper that keeps the integer contract obvious at the call site. */
export function sumPence(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
