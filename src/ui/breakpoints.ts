/**
 * The two screen shapes the app has a name for.
 *
 * Tailwind's `split:` and `tall:` variants are declared in `index.css`, which
 * a `css` block cannot use — so the layout in `InputScreen` writes the same
 * queries out in full. These constants are what it writes, and
 * `test/breakpoints.test.ts` reads the stylesheet and fails if the two ever
 * drift apart. One value, checked in two places rather than remembered.
 */
export const SPLIT = '(min-width: 600px) and (orientation: landscape)'
export const TALL = '(min-width: 700px) and (orientation: portrait)'
