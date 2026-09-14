/** Replaced at build time by `vite.config.ts`. See `src/samples/index.ts`. */
declare const __SAMPLES__: boolean

/**
 * The icons named anywhere under `src`, compiled in by `scripts/icon-bundle.ts`
 * and keyed by the `prefix:name` that named them. See `src/ui/Icon.tsx`.
 */
declare module 'virtual:icons' {
  const icons: Record<string, { body: string; viewBox: string }>
  export default icons
}
