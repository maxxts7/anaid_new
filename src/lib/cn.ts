import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * The type scale in globals.css is named rather than numbered — `text-lead`,
 * `text-small`, `text-hero` — and tailwind-merge does not ship knowing those.
 * Left to itself it reads them as text *colours*, so a later size silently
 * deletes an earlier colour: `cn('text-accent-ink', 'text-lead')` returned just
 * `text-lead`, which is how every large and small primary button lost its white
 * text. Declaring the scale here puts each name back in the size group.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['micro', 'mini', 'small', 'base', 'lead', 'read', 'lede', 'title', 'display', 'hero'] },
      ],
    },
  },
})

/** Merge class names, letting later Tailwind utilities win over earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
