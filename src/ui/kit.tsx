/**
 * The two things the app styles the same way in more than one place.
 *
 * Utilities go in `className` and real CSS goes in a `css` block, but neither
 * says "this is the same thing as that". A component does. Repeating the
 * button's nine utilities at ten call sites would read as ten coincidences and
 * would take ten edits to change; here it is one of each.
 *
 * Neither takes a `className`, and the type says so rather than the habit: a
 * spread prop would be silently dropped, which is worse than an error. A caller
 * that wants to override `bg-*` is
 * telling us the component is missing a prop, and adding the prop keeps the
 * decision here rather than scattering it. That is also why the app needs no
 * `tailwind-merge`: two conflicting utilities are never emitted together,
 * because each branch below emits only one of them. Class order in the string
 * does not decide a conflict — order in the generated stylesheet does — so a
 * component that emitted both would be relying on luck.
 */
import {css} from '@emotion/react'
import clsx from 'clsx'

/**
 * How the button sits in its parent. Every value has a caller: `fill` is the
 * source row and Calculate, `icon` the two sheet triggers, `wide` the sample
 * list, `fit` the player's transport, `stop` the one that ends live mode.
 */
type Shape = 'fill' | 'icon' | 'wide' | 'fit' | 'stop'

const SHAPE: Record<Shape, string> = {
  fill: 'flex-auto justify-center px-5',
  // A square target for an icon with no label. Still 48 px, still a hit target.
  icon: 'w-12 flex-none justify-center p-0',
  wide: 'w-full justify-between px-5',
  fit: 'flex-none justify-center px-5',
  /*
   * Twice an icon button and never more: 96 px against a 48 px height, which
   * is the odd one out in a row of squares without becoming a slab.
   *
   * Landscape needs the same width but a line of its own, or the control
   * column grows by the width of this button the moment live mode starts and
   * the stage shrinks under it. A flex basis of the whole row is what forces
   * the break; the max-width then clamps what the basis asked for, because a
   * flex item's base size is bounded by its own max-width.
   */
  stop: 'w-24 flex-none justify-center p-0 split:[flex:0_0_100%] split:max-w-24',
}

/** `className` is omitted on purpose: see the note above. The compiler enforces it. */
type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  shape?: Shape
  /** `record` is the live-recording state: the one button that is not the default colour. */
  tone?: 'default' | 'record'
}

export function Button({shape = 'fill', tone = 'default', ...rest}: ButtonProps) {
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
        'inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-[10px] border-0 text-base/[normal]',
        // The press feedback, in place of the platform's own square highlight
        // (see `index.css`). It follows the radius because it is the button.
        'active:opacity-70 disabled:cursor-default disabled:opacity-50 disabled:active:opacity-50',
        // The cursor belongs to every button, not to one tone. It used to sit
        // in the branch below, which left the two red ones — stop recording,
        // stop listening — as the only things on the screen that did not say
        // they could be pressed.
        tone === 'record' ? 'bg-error text-white' : 'bg-btn text-fg',
        SHAPE[shape],
      )}
    />
  )
}

/** A button that reads as a link: the dev-only affordances, and Dismiss. */
export function LinkButton(props: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'>) {
  return (
    <button
      type="button"
      {...props}
      className="cursor-pointer border-0 bg-transparent p-0 text-accent underline"
      css={css`
        /* The shorthand, not just the family. A <button> otherwise keeps the
           browser's own 13.3px, and preflight is deliberately not imported to
           reset it. */
        font: inherit;
      `}
    />
  )
}

/**
 * A modal sheet. Two of them: the settings and the sample list.
 *
 * Shared for the same reason `Button` is — the styling said "these are the
 * same thing" and nothing enforced it — but the close-on-backdrop handler was
 * duplicated too, character for character, which is the sort of thing that
 * stays in step right up until it does not.
 *
 * The caller keeps the ref and calls `showModal()` and `close()` on it, as
 * both did before.
 */
export function Sheet({
  ref,
  title,
  children,
}: {
  ref: React.RefObject<HTMLDialogElement | null>
  title: string
  children: React.ReactNode
}) {
  /**
   * A press on the backdrop closes it.
   *
   * A backdrop press is reported against the dialog element itself, but so is
   * a press on the dialog's own padding, so the target alone would close the
   * sheet when someone taps the margin beside a control. The point has to be
   * outside the box as well. Both conditions also keep a keyboard-driven
   * click, which arrives at 0,0 from a control inside, from closing it.
   */
  const closeOnBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    const el = ref.current
    if (!el || e.target !== el) return
    const r = el.getBoundingClientRect()
    const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    if (outside) el.close()
  }

  return (
    <dialog
      ref={ref}
      onClick={closeOnBackdrop}
      className="rounded-xl border border-solid border-btn bg-bg p-5 text-fg"
      css={css`
        inline-size: min(320px, calc(100vw - 32px));
        /* A landscape phone is 390 px tall and the sample list is seven rows
           and a button. Scroll the sheet rather than letting it run off the
           screen. */
        max-block-size: calc(100dvh - 32px);
        overflow: auto;

        /* No utility reaches the backdrop pseudo-element. */

        &::backdrop {
          background: rgb(0 0 0 / 0.5);
        }
      `}
    >
      <h2 className="m-0 mb-4 text-[1.1rem]">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </dialog>
  )
}

/**
 * A labelled `<select>`.
 *
 * A native one, deliberately: on a phone it opens the platform's own list,
 * scrollable, searchable on Android, and already drawn in the user's language.
 * A custom dropdown would be a worse version of all three.
 *
 * Two layouts, because the settings dialog wants both. The language sits above
 * its select — its label is long in some languages and the list is the point of
 * the row. The tachometer's two sit beside theirs, which is what a row of
 * small either/or choices should look like.
 */
export function Picker<T extends string>({
  label,
  value,
  options,
  onChange,
  layout = 'column',
}: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (next: T) => void
  layout?: 'column' | 'row'
}) {
  return (
    <label
      className={clsx(
        'flex gap-1.5 text-[0.9rem]',
        layout === 'row' ? 'items-center justify-between gap-3' : 'flex-col',
      )}
      css={css`
        select {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--color-btn);
          background: var(--color-btn);
          color: inherit;
          font: inherit;
        }
      `}
    >
      <span className="text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * The one-line status paragraph, used by the status line and by the answer.
 *
 * `min-h` reserves the line whether or not there is anything on it, so nothing
 * below it moves as the text comes and goes. In the split layout the line is
 * truncated: a landscape phone cannot spare the second line a long file name
 * takes, and the name is the least of what the line says. Errors are exempt —
 * they are longer, they matter more, and Dismiss sits at the end of them.
 */
export function StatusText({
  tone = 'default',
  children,
  ...rest
}: Omit<React.HTMLAttributes<HTMLParagraphElement>, 'className'> & {
  tone?: 'default' | 'muted' | 'error'
}) {
  return (
    <p
      {...rest}
      className={clsx(
        'm-0 min-h-[1.5em]',
        tone === 'error' ? 'text-error' : 'split:truncate',
        tone === 'muted' && 'text-muted',
      )}
    >
      {children}
    </p>
  )
}
