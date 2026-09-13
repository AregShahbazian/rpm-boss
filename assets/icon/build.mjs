/**
 * Every icon in the project, drawn once and rendered out.
 *
 *   node assets/icon/build.mjs           write them all
 *   node assets/icon/build.mjs --preview only the preview sheet, into /tmp
 *
 * The drawing is the geometry below: a dial with its ticks, a needle, and the
 * sound underneath it, drawn white on the app's own background. Everything
 * else — the adaptive icon, the legacy launcher PNGs, the splash screens, the
 * favicon, the Play icon and the feature graphic — is this same geometry at a
 * different size, so there is one place to change the mark.
 *
 * Rasterising is done by the Chrome that is already on this machine, because
 * it is the renderer the SVG will be judged in anyway. No new dependency.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const TMP = '/tmp/rpm-boss-icons'
const BG = '#121212'
const FG = '#ffffff'

/* ---------------------------------------------------------------- geometry */

const C = 50 // centre of the 100-unit canvas
const R = 33 // the dial
const RING_W = 3.4
const INNER = R - RING_W / 2 - 1.6 // where a tick starts and a bar stops

const rad = (deg) => ((deg - 90) * Math.PI) / 180
const at = (deg, r) => [C + r * Math.cos(rad(deg)), C + r * Math.sin(rad(deg))]
const n = (v) => Number(v.toFixed(2))
const pt = (p) => `${n(p[0])} ${n(p[1])}`

/** The ring, as two arcs: a vector drawable has no <circle>. */
const ring = (r) => `M ${n(C - r)} ${C} A ${r} ${r} 0 1 1 ${n(C + r)} ${C} A ${r} ${r} 0 1 1 ${n(C - r)} ${C} Z`

/**
 * Ticks every 15°, longer every 45°, stopping either side of the bottom so
 * they do not grow out of the sound. Two paths: the widths differ.
 */
function ticks(long) {
  const out = []
  for (let a = 0; a < 360; a += 15) {
    if (a >= 150 && a <= 210) continue // the bars live here
    if ((a % 45 === 0) !== long) continue
    out.push(`M ${pt(at(a, INNER))} L ${pt(at(a, INNER - (long ? 6.4 : 3.6)))}`)
  }
  return out.join(' ')
}

/** The needle: a long taper from the pivot to just inside the ring. */
function needle(deg = 55) {
  const tip = at(deg, INNER - 1)
  const base = 5.2 // where it leaves the pivot
  const half = 2.4
  return `M ${pt(tip)} L ${pt(at(deg + 90, half).map((v, i) => v + (at(deg, base)[i] - C)))} L ${pt(
    at(deg - 90, half).map((v, i) => v + (at(deg, base)[i] - C)),
  )} Z`
}

/**
 * The sound: bars standing on the inside of the dial, so the row of feet is
 * itself a curve. The envelope is a hump a little right of centre with a fixed
 * jitter on it — a spectrum, not a decoration, and the same one every run.
 */
function bars() {
  const step = 3.8
  const half = 27.6
  const jitter = [
    0.62, 0.31, 0.88, 0.45, 0.72, 0.22, 0.95, 0.51, 0.78, 0.35, 0.66, 0.28, 0.92, 0.4, 0.7, 0.25, 0.85, 0.48, 0.6,
  ]
  const out = []
  let i = 0
  for (let dx = -half; dx <= half + 0.01; dx += step, i++) {
    const foot = C + Math.sqrt(Math.max(0, INNER * INNER - dx * dx))
    const envelope = 3 + 31 * Math.exp(-(((dx - 2) / 11.5) ** 2))
    const h = envelope * (0.42 + 0.58 * jitter[i % jitter.length])
    const top = Math.max(C + 8.5, foot - h) // clear of the pivot
    if (foot - top < 1.2) continue
    out.push(`M ${n(C + dx)} ${n(foot)} L ${n(C + dx)} ${n(top)}`)
  }
  return out.join(' ')
}

/** Every stroke in the mark, in drawing order. `fill` ones are filled. */
const SHAPES = [
  { d: ring(R), w: RING_W, cap: 'round' },
  { d: ticks(true), w: 2.8, cap: 'butt' },
  { d: ticks(false), w: 2.2, cap: 'butt' },
  { d: bars(), w: 2.1, cap: 'butt' },
  { d: needle(), fill: true },
  { d: ring(6.1), w: 2.6, cap: 'round' },
]

/* ------------------------------------------------------------------- files */

/** The mark alone, in `color`, on a 100-unit canvas. */
const mark = (color) =>
  SHAPES.map((s) =>
    s.fill
      ? `<path d="${s.d}" fill="${color}"/>`
      : `<path d="${s.d}" fill="none" stroke="${color}" stroke-width="${s.w}" stroke-linecap="${s.cap}" stroke-linejoin="round"/>`,
  ).join('\n  ')

/**
 * The mark on its own ground, scaled to `size`. `radius` rounds the corners —
 * a launcher icon on API 25 and below gets no mask of its own, so it brings
 * its own shape; the Play icon and the splash want none.
 */
function plate(size, { radius = 0, art = 0.78, bg = BG, color = FG } = {}) {
  const inset = (size * (1 - art)) / 2
  const scale = (size * art) / 100
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${bg}"/>
  <g transform="translate(${n(inset)} ${n(inset)}) scale(${n(scale)})">
  ${mark(color)}
  </g>
</svg>`
}

/** Chrome renders one SVG to one PNG at exactly the size asked for. */
function png(svg, out, width, height = width) {
  mkdirSync(TMP, { recursive: true })
  const src = join(TMP, 'frame.html')
  writeFileSync(
    src,
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>${svg}`,
  )
  mkdirSync(dirname(out), { recursive: true })
  execFileSync(
    'google-chrome',
    [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--default-background-color=00000000',
      `--window-size=${width},${height}`,
      `--screenshot=${out}`,
      `file://${src}`,
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] },
  )
}

/** The adaptive icon's foreground layer, from the same paths. */
function vectorDrawable() {
  const body = SHAPES.map((s) =>
    s.fill
      ? `        <path\n            android:pathData="${s.d}"\n            android:fillColor="${FG}"/>`
      : `        <path\n            android:pathData="${s.d}"\n            android:strokeColor="${FG}"\n            android:strokeWidth="${s.w}"\n            android:strokeLineCap="${s.cap}"\n            android:strokeLineJoin="round"/>`,
  ).join('\n')
  return `<?xml version="1.0" encoding="utf-8"?>
<!--
  Adaptive icon foreground. Generated by assets/icon/build.mjs from the same
  geometry as every other icon in the project; edit that, not this.

  The art is the 100x100 drawing scaled to 0.62 and centred on the 108dp
  canvas, which keeps it inside the 66dp circle Android guarantees under every
  mask — a round mask on one launcher, a squircle on the next.
-->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group
        android:pivotX="50"
        android:pivotY="50"
        android:scaleX="0.62"
        android:scaleY="0.62"
        android:translateX="4"
        android:translateY="4">
${body}
    </group>
</vector>
`
}

/* -------------------------------------------------------------------- run */

const previewOnly = process.argv.includes('--preview')
const w = (rel, text) => {
  const out = join(ROOT, rel)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, text)
  console.log('wrote', rel)
}

// A sheet to look at before committing to it: the launcher icon, the round
// mask, the Play icon and the mark on its own.
png(
  `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="240" viewBox="0 0 880 240">
    <rect width="880" height="240" fill="#2b2b2b"/>
    <g transform="translate(20 20)">${plate(200, { radius: 44 })}</g>
    <g transform="translate(240 20)"><clipPath id="c"><circle cx="100" cy="100" r="100"/></clipPath>
      <g clip-path="url(#c)">${plate(200)}</g></g>
    <g transform="translate(460 20)">${plate(200)}</g>
    <g transform="translate(680 20)">${plate(200, { bg: '#ffffff', color: '#121212' })}</g>
  </svg>`,
  `${TMP}/preview.png`,
  880,
  240,
)
console.log('preview:', `${TMP}/preview.png`)
if (previewOnly) process.exit(0)

// 1. the drawing itself, the one file to edit by hand if the mark changes
w(
  'assets/icon/trace.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <title>RPM Boss</title>
  <!-- Generated by assets/icon/build.mjs. The mark in currentColor, no ground. -->
  ${mark('currentColor')}
</svg>
`,
)

// 2. Android: the adaptive icon, and the legacy PNGs for API 24-25
w('android/app/src/main/res/drawable/ic_launcher_foreground.xml', vectorDrawable())
w(
  'android/app/src/main/res/values/ic_launcher_background.xml',
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${BG}</color>
</resources>
`,
)
for (const [dpi, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
  png(plate(size, { radius: size * 0.22 }), join(ROOT, `android/app/src/main/res/mipmap-${dpi}/ic_launcher.png`), size)
  png(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs><clipPath id="r"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></clipPath></defs>
      <g clip-path="url(#r)">${plate(size)}</g>
    </svg>`,
    join(ROOT, `android/app/src/main/res/mipmap-${dpi}/ic_launcher_round.png`),
    size,
  )
  console.log('wrote', `mipmap-${dpi}/ic_launcher[_round].png`)
}

// 3. the splash: the mark on the app's background, at every size Capacitor
//    laid down. The art is a fraction of the short edge, centred.
const SPLASH = {
  'drawable': [480, 320],
  'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600],
  'drawable-port-xxxhdpi': [1280, 1920],
  'drawable-land-mdpi': [480, 320],
  'drawable-land-hdpi': [800, 480],
  'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960],
  'drawable-land-xxxhdpi': [1920, 1280],
}
for (const [dir, [width, height]] of Object.entries(SPLASH)) {
  const side = Math.min(width, height) * 0.34
  png(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="${BG}"/>
      <g transform="translate(${n((width - side) / 2)} ${n((height - side) / 2)}) scale(${n(side / 100)})">
      ${mark(FG)}
      </g>
    </svg>`,
    join(ROOT, `android/app/src/main/res/${dir}/splash.png`),
    width,
    height,
  )
}
console.log('wrote', Object.keys(SPLASH).length, 'splash screens')

// 4. the web: one favicon, on its own ground so it reads on a light tab strip
w('public/favicon.svg', `${plate(64, { radius: 12 })}\n`)

// 5. the Play listing: the 512 icon, and the 1024x500 graphic beside its name
png(plate(512, { art: 0.68 }), join(ROOT, 'assets/icon/play-icon-512.png'), 512)
console.log('wrote', 'assets/icon/play-icon-512.png')
png(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
    <rect width="1024" height="500" fill="${BG}"/>
    <g transform="translate(120 130) scale(2.4)">${mark(FG)}</g>
    <text x="450" y="230" fill="#f0f0f0" font-family="system-ui, sans-serif" font-size="96" font-weight="700">RPM Boss</text>
    <text x="452" y="300" fill="#a0a0a0" font-family="system-ui, sans-serif" font-size="40">Engine RPM from sound.</text>
  </svg>`,
  join(ROOT, 'store/play-feature-1024x500.png'),
  1024,
  500,
)
console.log('wrote', 'store/play-feature-1024x500.png')

rmSync(TMP, { recursive: true, force: true })
