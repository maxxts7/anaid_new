import { cn } from '@/lib/cn'

const control =
  'w-full rounded-md border border-hairline-strong bg-surface px-3 text-base text-ink shadow-xs placeholder:text-ink-faint hover:border-ink-faint focus:border-accent focus:ring-4 focus:ring-accent/12 focus:outline-none disabled:bg-sunken disabled:text-ink-muted'

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
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="text-small font-medium text-ink">{label}</span>
        {!required && <span className="text-micro text-ink-faint">Optional</span>}
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

export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select className={cn(control, 'h-11 appearance-none pr-8', className)} {...props}>
      {children}
    </select>
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
        'flex cursor-pointer gap-3 rounded-sm py-1.5 transition-colors hover:bg-sunken/60',
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
