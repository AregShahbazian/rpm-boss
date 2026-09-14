/**
 * One icon, named the way the icon browser names it.
 *
 * The name is a string — `mdi:play`, the `prefix:name` shown on
 * https://icon-sets.iconify.design — and the drawing behind it is compiled in
 * rather than fetched: `scripts/icon-bundle.ts` reads the names out of the
 * source at build time and resolves each one to path data, so this renders an
 * `<svg>` and nothing else. No icon library ships, nothing loads, and the web
 * build and the APK draw from the same bytes. The obvious alternative —
 * importing every icon as its own component — makes the call site name a symbol
 * instead of an icon, and turns "use a different arrow" into an import edit.
 *
 * A set has to be installed for its names to resolve: `mdi` and `lucide` are,
 * and any other is one `npm i -D @iconify-json/<prefix>` away. Sets are dev
 * dependencies because no set ships — only the handful of paths the app names.
 *
 * There is no colour prop. The paths are drawn in `currentColor`, so an icon is
 * the colour of the text around it and a parent's `text-*` moves both together.
 * There is no `className` either, for the reason `kit.tsx` gives.
 */
import clsx from 'clsx'
import ICONS from 'virtual:icons'

interface Props {
  /** `prefix:name`, copied from the icon browser: `mdi:play`, `lucide:settings`. */
  icon: string
  /** Square side, in px. The default sits with `text-base` without crowding it. */
  size?: number
  /** Turns, continuously. A busy indicator — not decoration. */
  spin?: boolean
  /**
   * What a screen reader should call it. An icon next to its own label needs
   * none and is better hidden, which is what leaving this out does.
   */
  label?: string
}

export function Icon({ icon, size = 20, spin, label }: Props) {
  const drawing = ICONS[icon]
  if (!drawing) {
    // Only three things get here: a typo, a set that is not installed, or a
    // name assembled at runtime, which the build-time scan cannot see. Nothing
    // renders either way, so say which one it was.
    if (import.meta.env.DEV) {
      console.warn(`Icon: "${icon}" is not in the bundle — check the name, or install @iconify-json/${icon.split(':')[0]}`)
    }
    return null
  }
  return (
    <svg
      viewBox={drawing.viewBox}
      width={size}
      height={size}
      // A flex row treats an svg as shrinkable and squashes it before the text
      // beside it; an icon that is not square is worse than a tight row.
      className={clsx('shrink-0', spin && 'animate-spin')}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      // The markup is the set's own, read from `node_modules` at build time and
      // baked into the bundle. Nothing user-supplied can reach it.
      dangerouslySetInnerHTML={{ __html: drawing.body }}
    />
  )
}
