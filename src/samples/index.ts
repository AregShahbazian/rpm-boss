/**
 * The engine recordings that ship with the app, so a visitor can hear what it
 * does without first going to find motorcycle audio of their own.
 *
 * Off unless asked for. `npm run dev` turns them on; a release build leaves
 * both the picker and the 1.6 MB of audio out unless `VITE_SAMPLES=1` is set,
 * which is what `scripts/apk.sh --samples` does. The copying is in
 * `vite.config.ts`; this file is only the list.
 *
 * The clips are the same seven the test fixtures were measured from, so `rpm`
 * below is the reference count, not something the app worked out. It is shown
 * beside each one: a stranger has no way to know whether an answer is right,
 * and a demo that cannot be checked is not much of a demo.
 */
export const SAMPLES_ENABLED = __SAMPLES__

export interface Sample {
  /** 1..7. The file is `sample-<n>.m4a` and the label is `Sample <n>`. */
  n: number
  /** What the reference count in `audio/combustion-counts.md` says it turns at. */
  rpm: number
}

export const SAMPLES: readonly Sample[] = [
  { n: 1, rpm: 1598 },
  { n: 2, rpm: 1589 },
  { n: 3, rpm: 1783 },
  { n: 4, rpm: 1427 },
  { n: 5, rpm: 1409 },
  { n: 6, rpm: 1603 },
  { n: 7, rpm: 1430 },
]

export function sampleFile(n: number): string {
  return `sample-${n}.m4a`
}

/**
 * Relative to the page, because the build is served from a subdirectory on the
 * web and from `file://` inside the Android shell.
 */
export function sampleUrl(n: number): string {
  return `${import.meta.env.BASE_URL}samples/${sampleFile(n)}`
}
