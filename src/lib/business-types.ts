import type { BusinessType } from '../generated/prisma/client'

/** The fixed list from LEVEL-4 §7, in the words a customer would use. */
export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  RESTAURANT: 'Restaurant',
  TAKEAWAY: 'Takeaway',
  CAFE: 'Café',
  FAST_FOOD: 'Fast food',
  BAKERY: 'Bakery',
  CATERING: 'Catering company',
  HOTEL: 'Hotel',
  PUB: 'Public house',
  FOOD_TRUCK: 'Food truck',
  SUPERMARKET: 'Supermarket',
  CONVENIENCE_STORE: 'Convenience store',
  OTHER: 'Other',
}

export const BUSINESS_TYPES = Object.keys(BUSINESS_TYPE_LABELS) as [BusinessType, ...BusinessType[]]
