import Link from 'next/link'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
type Size = 'sm' | 'md' | 'lg'

/**
 * Buttons.
 *
 * Pills, not rounded rectangles — the one fully round thing in a layout built
 * from rules and right angles, which is what makes a button read as a button
 * without needing a fill to announce itself. A secondary is exactly that: an
 * outline on white. Only the primary is filled, and it is filled with a shallow
 * gradient across the three accent steps rather than one flat block of colour,
 * lit from underneath by a glow of the same blue. It is the only thing in the
 * interface allowed to look lit, which is how it stays the obvious thing to
 * press on a page with no other colour on it.
 */
const base =
  'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-[background-color,background-image,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45'

const variants: Record<Variant, string> = {
  primary: 'btn-accent border border-transparent font-semibold text-accent-ink',
  secondary: 'border border-hairline bg-surface text-ink hover:border-ink-muted hover:bg-sunken-soft',
  quiet: 'border border-transparent text-ink-muted hover:text-ink',
  danger: 'border border-refused/25 bg-refused-soft text-refused hover:bg-refused hover:text-white',
}

/** Heights and type taken from the reference's application pages, not its
 *  landing page, which runs everything a size larger. */
const sizes: Record<Size, string> = {
  sm: 'h-9 gap-1.5 px-4 text-[0.84375rem]',
  md: 'h-10 gap-[7px] px-[17px] text-[0.875rem]',
  lg: 'h-[50px] gap-2 px-[21px] text-[1.09375rem]',
}

/**
 * The button styling on its own, for the handful of places that need a plain
 * `<a>` rather than a `Link`: `mailto:`, `tel:` and the brochure download, none
 * of which are routes `typedRoutes` will accept.
 */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonProps = React.ComponentProps<'button'> & { variant?: Variant; size?: Size }

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }

export function ButtonLink({ variant = 'primary', size = 'md', className, ...props }: ButtonLinkProps) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />
}
