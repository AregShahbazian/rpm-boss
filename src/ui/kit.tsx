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
import {useId, useState} from 'react'

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
   * Two icon buttons and the gap between them: 48 + 8 + 48. It spans exactly
   * what the first two buttons of the row span, from the left edge of one to
   * the right edge of the other, which is why it is not simply twice a button.
   * Where it sits is `StopButton`'s business, not this one's.
   */
  stop: 'w-26 flex-none justify-center p-0',
}

/** `className` is omitted on purpose: see the note above. The compiler enforces it. */
type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  shape?: Shape
  /** The two buttons that are not the default colour: `record` stops a take, `go` starts live mode. */
  tone?: 'default' | 'record' | 'go'
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
        tone === 'record' ? 'bg-error text-white' : tone === 'go' ? 'bg-go text-white' : 'bg-btn text-fg',
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
      className={clsx(
        'border-0 bg-transparent p-0 text-accent underline',
        // A link with nothing to do has to say so: the reset in the tachometer
        // settings is dead while those settings are the defaults.
        props.disabled ? 'cursor-default text-muted no-underline' : 'cursor-pointer',
      )}
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
 * One caller left, the language, and one layout with it: the label sits above
 * the select, because in some languages it is long and the list is the point of
 * the row anyway. Every other choice in the settings is short enough to spell
 * out in full, and those are `Segmented`. The `layout` prop went with them.
 */
export function Picker<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (next: T) => void
}) {
  return (
    <label
      className="flex flex-col gap-1.5 text-[0.9rem]"
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

/**
 * A row of mutually exclusive choices, drawn as one pill split into segments.
 *
 * The theme used to be three stacked radio buttons, which gave a two-word
 * choice three rows of a 320 px dialog and still looked like a form. A
 * segmented control says the same thing in one row: every option is visible at
 * once, which is the whole argument for it over the `<select>` next to it, and
 * the filled segment is the answer.
 *
 * That argument holds for a short, closed, memorable set — the theme's three,
 * the engine's two — and stops holding at the language's seventeen, which is
 * why the one above it is still a `<select>`.
 *
 * `role="radiogroup"` rather than a `<fieldset>`: the group's name is the
 * `<span>` beside it, on the same line, and a `<legend>` cannot be put there
 * without fighting its own layout. Buttons, not radios, because there is
 * nothing left of the native control to keep once it is drawn as a pill.
 *
 * `disabled` draws the whole group greyed with its answer still filled in,
 * which is the point of showing it at all: the cylinder count is one, the app
 * cannot yet do anything else, and a row that says so is more honest than no
 * row. A control that is shown and refuses to move has to look refused, so the
 * dimming is on the group rather than on the segments, or the unselected two
 * would fade into the background and leave it looking merely answered.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (next: T) => void
  /** Shown, answered, and not yet changeable. */
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-3 text-[0.9rem]">
      <span id={id} className="flex-none text-muted">{label}</span>
      <div
        role="radiogroup"
        aria-labelledby={id}
        aria-disabled={disabled || undefined}
        className={clsx(
          'flex min-w-0 flex-auto rounded-full border border-solid border-btn p-0.5',
          disabled && 'opacity-50',
        )}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={clsx(
              // 44 px inside a 48 px track: the same target the buttons keep,
              // because a thumb does not know it is in a settings dialog.
              'min-w-0 flex-1 truncate rounded-full border-0 px-1 text-[0.85rem]/[normal]',
              'min-h-11',
              disabled ? 'cursor-default' : 'cursor-pointer active:opacity-70',
              value === o.value ? 'bg-accent text-bg' : 'bg-transparent text-muted',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * A number the rider types, held to its bounds.
 *
 * The draft is a string while it is being edited, because every useful way
 * through a number field passes through one that is not a number: clearing it
 * to retype, or the "1" on the way to "10000". Committing on each keystroke
 * would clamp "1" to the minimum and fight the person typing. So the value
 * leaves here only when the field is left or Enter is pressed, and is clamped
 * then — silently, with the field corrected to what was taken, so nobody is
 * left looking at a number the app did not accept.
 *
 * `min` and `max` are on the input too. That is for the stepper arrows and the
 * phone keypad; it is not enforcement, since a typed value ignores both.
 */
export function NumberField({
  label,
  value,
  min,
  max,
  step = 500,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (next: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  const [seen, setSeen] = useState(value)

  // The bounds move — the redline's ceiling is the dial's top — so a value
  // corrected underneath us has to show through into the field. Adjusted
  // during render rather than in an effect, the same shape `useAnalysis`
  // uses: one commit, and no frame showing the stale figure.
  if (seen !== value) {
    setSeen(value)
    setDraft(String(value))
  }

  const commit = () => {
    const parsed = Number(draft)
    const next = Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : value
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  return (
    <label className="flex items-center justify-between gap-3 text-[0.9rem]">
      <span className="text-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="min-h-11 w-24 rounded-md border border-solid border-btn bg-btn px-2 text-fg"
        css={css`
          font: inherit;
        `}
      />
    </label>
  )
}
