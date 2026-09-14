import { cn } from '@/lib/cn'

/**
 * The lockup, set the way ANAID draws it at the foot of its own site: the mark,
 * then the name on two lines — "ANAID QUALITY" over "DISPOSABLES LIMITED", the
 * second line tracked out so it sits under the width of the first.
 *
 * It is live type rather than the PNG the old site ships, for two reasons. That
 * PNG is white on transparent, so it only works over the dark teal footer it
 * was cut for and disappears on this one. And type stays sharp at any size, on
 * any screen, and is read aloud correctly — a picture of a company name is
 * still a picture.
 *
 * The parent may be a `group`; the first line takes the accent on hover, so the
 * whole lockup behaves as one link without the mark having to change colour.
 */
export function Wordmark({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md'
  className?: string
}) {
  const small = size === 'sm'

  return (
    <span className={cn('flex items-center', small ? 'gap-2.5' : 'gap-3', className)}>
      <img
        src="/brand/logo-mark.png"
        alt=""
        width={42}
        height={28}
        className={cn('w-auto', small ? 'h-7' : 'h-10')}
      />

      <span className="flex flex-col">
        {/* `leading-none` goes last on purpose. A font-size utility on this
            scale carries a line-height with it, so tailwind-merge drops any
            `leading-*` listed before one — which silently left both lines on
            the body's 1.6 and pushed them apart. */}
        <span
          className={cn(
            'font-bold tracking-[-0.02em] text-ink transition-colors group-hover:text-accent',
            small ? 'text-read' : 'text-lead',
            'leading-none'
          )}
        >
          ANAID QUALITY
        </span>
        {/* The second line is sized, not tracked, to the width of the first.
            Letter-spacing was doing that job and had to run wide to manage it;
            setting the size instead keeps the letters close together and still
            lands both lines on the same measure. The sizes below are the ones
            that match — 10.8 under 19, and 9.85 under 17.3.

            The negative right margin is separate: tracking is applied after
            every letter including the last, so without it the tracked line
            overhangs the one above by one space. */}
        <span
          className={cn(
            'font-semibold text-ink-muted',
            small
              ? 'mt-[5px] -mr-[0.12em] text-[0.675rem] tracking-[0.12em]'
              : 'mt-1.5 -mr-[0.12em] text-[0.6156rem] tracking-[0.12em]',
            'leading-none'
          )}
        >
          DISPOSABLES LIMITED
        </span>
      </span>
    </span>
  )
}
