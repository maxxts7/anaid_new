import { cn } from '@/lib/cn'

/**
 * One control. Ten-pixel corners, not the button's pill and not the card's
 * sixteen — a field is its own kind of object and says so with its own radius.
 */
const control =
  'w-full rounded-[10px] border border-hairline bg-surface px-3.5 text-base text-ink placeholder:text-ink-faint hover:border-hairline-strong focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none disabled:bg-sunken-soft disabled:text-ink-muted'

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-[7px] flex items-baseline gap-2">
        <span className="text-[0.84375rem] font-medium text-ink">{label}</span>
        {!required && <span className="text-[0.84375rem] font-normal text-ink-faint">Optional</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-micro text-ink-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-micro text-refused">{error}</span>}
    </label>
  )
}

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(control, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-24 py-2.5', className)} {...props} />
}

/**
 * A select, with its own chevron.
 *
 * `appearance-none` is here so the control matches every other field rather
 * than wearing whatever each platform draws — but on its own it takes the
 * native arrow away and puts nothing back, which leaves a dropdown looking
 * exactly like a text input. On a phone that is the difference between a
 * customer picking a delivery address and a customer wondering why they cannot
 * type in the box. The mark below is the replacement, and the extra right
 * padding is the room it sits in.
 */
export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <span className="relative block">
      <select className={cn(control, 'h-11 appearance-none pr-10', className)} {...props}>
        {children}
      </select>
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-faint"
      >
        <path
          d="M4 6.5 8 10.5 12 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: React.ComponentProps<'input'> & { label: string; description?: string }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-sm py-1.5 transition-colors hover:bg-sunken-soft',
        className
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded-[3px] border-hairline-strong accent-accent"
        {...props}
      />
      <span>
        <span className="block text-small text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-micro text-ink-muted">{description}</span>}
      </span>
    </label>
  )
}
