/**
 * The two things the app styles the same way in more than one place.
 *
 * Utilities go in `className` and real CSS goes in a `css` block, but neither
 * says "this is the same thing as that". A component does. Repeating the
 * button's nine utilities at ten call sites would read as ten coincidences and
 * would take ten edits to change; here it is one of each.
 *
 * Neither takes a `className`. A caller that wants to override `bg-*` is
 * telling us the component is missing a prop, and adding the prop keeps the
 * decision here rather than scattering it. That is also why the app needs no
 * `tailwind-merge`: two conflicting utilities are never emitted together,
 * because each branch below emits only one of them. Class order in the string
 * does not decide a conflict — order in the generated stylesheet does — so a
 * component that emitted both would be relying on luck.
 */
import clsx from 'clsx'

/**
 * How the button sits in its parent. Every value has a caller: `fill` is the
 * source row and Calculate, `icon` the two sheet triggers, `wide` the sample
 * list, `fit` the player's transport.
 */
type Shape = 'fill' | 'icon' | 'wide' | 'fit'

const SHAPE: Record<Shape, string> = {
  fill: 'flex-auto justify-center px-5',
  // A square target for an icon with no label. Still 48 px, still a hit target.
  icon: 'w-12 flex-none justify-center p-0',
  wide: 'w-full justify-between px-5',
  fit: 'flex-none justify-center px-5',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  shape?: Shape
  /** `record` is the live-recording state: the one button that is not the default colour. */
  tone?: 'default' | 'record'
}

export function Button({ shape = 'fill', tone = 'default', ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={clsx(
        // 48 px is the hit target, not a look: it is the smallest thing a thumb
        // finds reliably on a phone held next to a running engine.
        // `text-base` would also set a 1.5 line-height; the rules this replaces set
        // only the size, and the difference moves the glyphs by a fraction of a
        // pixel inside the centred box.
        'inline-flex min-h-12 items-center gap-2 rounded-[10px] border-0 text-base/[normal]',
        'disabled:cursor-default disabled:opacity-50',
        tone === 'record' ? 'bg-error text-white' : 'cursor-pointer bg-btn text-fg',
        SHAPE[shape],
      )}
    />
  )
}

/** A button that reads as a link: the dev-only affordances, and Dismiss. */
export function LinkButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-accent underline"
    />
  )
}
