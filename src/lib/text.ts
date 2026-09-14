/**
 * Presentation of text that came from somewhere else.
 *
 * ANAID's category names were typed into the old WordPress site over years by
 * different hands, so some shout — "ROLLS", "CUPS/CARRIER/STRAW" — and some
 * mumble: "paper round pots". That was invisible inside filled chips and is
 * very visible in a rail of plain words, where one odd name makes the whole row
 * look broken.
 *
 * This is a display fix and nothing more — the stored name is untouched, so a
 * member of staff editing the category still sees what they typed. Only a name
 * written entirely in one case is touched, which leaves anything deliberately
 * mixed ("Bags & Sheets", "PP Lids", a brand) exactly as it was written.
 */
export function tidyName(name: string): string {
  const letters = name.replace(/[^A-Za-z]/g, '')
  const shouted = letters === letters.toUpperCase()
  const mumbled = letters === letters.toLowerCase()
  if (letters.length < 4 || !(shouted || mumbled)) return name

  return name
    .toLowerCase()
    .replace(/(^|[\s/&(-])([a-z])/g, (_match, boundary: string, letter: string) => boundary + letter.toUpperCase())
}
