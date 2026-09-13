import Link from 'next/link'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink shadow-xs hover:bg-accent-hover hover:shadow-sm',
  secondary: 'border border-hairline-strong bg-surface text-ink shadow-xs hover:border-ink-faint hover:bg-sunken',
  quiet: 'text-ink-muted hover:bg-sunken hover:text-ink',
  danger: 'border border-refused/25 bg-refused-soft text-refused hover:bg-refused hover:text-white',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-small',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lead',
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
