# Store assets

Not used by the app. Kept for a Play listing that has not been made yet; the
Console side of publishing is deliberately outside phase 6.

Screenshots are device captures from a Zenfone 10, taken 2026-09-11 against the
phase 8 interface, with the status bar and the navigation bar cropped off. All
seven are 1080×2181, which clears the 1080 px threshold that makes the listing
eligible for Play's editorial promotion.

| File | Use |
|---|---|
| `screenshot1.png` | a long clip loaded, overview strip above the detail view, crop window set, before Calculate |
| `screenshot2.png` | the same clip after Calculate — 1634 rpm, the window zoomed with every combustion marked |
| `screenshot3.png` | the settings dialog's language picker |
| `screenshot4.png` | the result screen again in the light theme |
| `screenshot5.png` | a short clip with the optional expected range filled in, before Calculate |
| `screenshot6.png` | the same clip after Calculate — 1412 rpm |
| `screenshot7.png` | an in-app recording read at 1404 rpm |
| `../assets/icon/play-icon-512.png` | 512×512 icon, opaque, as Play requires |
| `../assets/icon/trace.svg` | the mark on its own, monochrome, `currentColor` |
| `play-feature-1024x500.png` | feature graphic — the mark beside the name |

The last three, the launcher icons, the splash screens and the favicon all come
out of `node assets/icon/build.mjs`, which draws the mark once and renders it
at every size. Change the geometry there, not the files it writes.

Listing copy (name, descriptions, category, tags) lives with the other apps'
at `~/ai/rpm-boss/store/listing-copy.md`.

Privacy policy: https://mby4m.github.io/legal/rpmboss/ (source in `~/git/legal/rpmboss/`).
