# Iris transition — animation notes

Two related effects share one visual language: a solid **accent-colored circle**
(an "iris") that grows to cover the screen or shrinks to reveal it, centered on a
meaningful point. Reference/inspiration: https://motion.dev/examples/js-curtains-iris-click

Each effect is a **solid circular `<div>` scaled with `transform`**, animated via
the Web Animations API. The circle is sized to reach the farthest corner of its
box and positioned so its centre sits on the origin, then scaled `0 → 1` (grow to
cover) or `1 → 0` (shrink to reveal). An `overflow: hidden` wrapper clips the
oversized circle to the frame (desktop) / viewport (mobile).

### Why transform, not clip-path

Earlier versions animated `clip-path: circle(<r> at <x> <y>)` instead — first with
CSS `@keyframes` reading `var(--iris-*)`, then with literal values via the Web
Animations API. **Both mis-rendered on some GPUs**: the animated clip-path
collapsed to the element's *centre* instead of the click point, so the iris fired
from the middle of the screen no matter where you tapped. Static clip-paths and
`getComputedStyle` always read correct — only the running animation was wrong,
which made it very hard to diagnose. Reproduced on the user's Chrome / macOS with
`dpr: 2`; not reproducible in a software-rendered browser.

`transform: scale()` is the most reliably GPU-composited property and does not hit
this bug, so the effect was rebuilt around it. Guardrails kept in the code:
- **no** `will-change: clip-path` anywhere (only `will-change: transform` on the circle),
- `prefers-reduced-motion` handled in JS (`prefersReducedMotion()` zeroes the
  duration) since the Web Animations API doesn't honour it automatically,
- `#boot-iris` has `overflow: hidden` so the oversized reveal circle never spills
  past the frame onto the desktop.

---

## Shared constants & style

| Thing | Value | Where |
|---|---|---|
| Cover duration | `400ms` (`COVER_MS`) | `src/lib/iris.js` |
| Reveal duration | `300ms` (`REVEAL_MS`) | `src/lib/iris.js` |
| Easing | `cubic-bezier(0.65, 0, 0.35, 1)` (`EASE`) | `src/lib/iris.js` |
| z-index | `9999` | `IrisTransition.css` / `index.html` |
| Color (runtime) | `var(--color-accent)` | `IrisTransition.css` |
| Color (boot, pre-bundle) | `#DF2121` — hardcoded, must match `--color-accent` | `index.html` |
| Radius helper | `irisRadius(x, y, w, h)` = distance to the farthest corner of the box | `src/lib/iris.js` |
| Reduced motion | `prefersReducedMotion()` → duration `0` | `src/lib/iris.js` |

All timing/easing constants live in `src/lib/iris.js` and are passed straight into
the `element.animate()` calls, so there is no CSS/JS duration to keep in sync.

`irisRadius` returns exactly the distance from the origin to the farthest corner
of the box — big enough to cover everything, no bigger (an oversized radius keeps
growing after the box is covered and stalls the animation on flat color).

---

## Effect 1 — Homepage load iris ("boot reveal")

**What it does:** a solid red splash is painted *before the JS bundle loads*, then
irises away (shrinks to a point) to reveal the home page once data is ready.

**Files**
- `index.html` — `#boot-iris` element, its inline `<style>`, and the pathname guard script
- `src/components/BootReveal.jsx` — drives the reveal
- `src/lib/iris.js` — `irisRadius`, `REVEAL_MS`
- `src/components/IrisTransition.css` — the `iris-overlay--reveal` keyframes are reused

**Mechanics**
1. `index.html` paints `#boot-iris` (solid `#DF2121`) covering the frame before the
   bundle parses. The style is inline because `index.css` (and `--color-accent`)
   isn't available that early.
2. A tiny guard script removes `#boot-iris` on any non-`/` path, synchronously
   before first paint, so deep links never flash red.
3. `BootReveal` (mounted on Home) waits until data has loaded (`loading === false`)
   or a **2000ms** cap (`MAX_HOLD_MS`), whichever comes first, so a stalled fetch
   can't strand the user on red.
4. It then drives the existing `#boot-iris` node directly (rather than rendering
   its own), so there's never a frame where neither is on screen:
   - measures the node's **own** box,
   - origin = `width/2, height` → **bottom-center**, radius = `irisRadius(...)`,
   - swaps `#boot-iris`'s solid fill for a same-red circle `<div>` (both fully
     cover the box, so no flash) sized/positioned on that origin, then
     `circle.animate(scale(1) → scale(0))` collapses it to bottom-center over `REVEAL_MS`,
   - removes the node on the animation's `finish` event (with a `REVEAL_MS * 2`
     fallback so a stuck overlay can't block the app).
5. **First load only** — a module-level `revealed` flag means navigating back to
   Home never replays it.

**Origin:** bottom-center of the overlay's own box.

**Geometry sync requirement (desktop, ≥601px):** `#boot-iris`'s geometry in
`index.html` MUST match `.device-frame` in `index.css`, or the red is offset from
the phone frame and the reveal collapses off bottom-center. Current matched values:

| Property | Value |
|---|---|
| `top` | `16px` (== `#root`'s 16px padding) |
| `width` | `375px` |
| `height` | `min(812px, calc(100dvh - 32px))` |
| `border-radius` | `24px` |
| horizontal | centered (`left:50%; transform: translateX(-50%)`) |

Below 601px the frame is inert, so `#boot-iris` is `inset: 0` (full viewport).

---

## Effect 2 — Button tap iris (route transition)

**What it does:** tapping a CTA grows a circle from the tap point to cover the
screen, swaps the route underneath while covered, then shrinks the circle away to
reveal the new page.

**Files**
- `src/components/IrisTransition.jsx` — `IrisProvider` + `useIris()` hook + the overlay
- `src/components/IrisTransition.css` — overlay + `iris-cover` / `iris-reveal` keyframes
- `src/lib/iris.js` — `COVER_MS`, `REVEAL_MS`, `irisRadius`
- Consumers, e.g. `src/pages/Home.jsx` → `handleFindMeal`

**API**
```js
const irisNavigate = useIris()
irisNavigate(to, options, origin)   // origin = { x: clientX, y: clientY } (viewport coords)
```
Consumers pass the pointer's `clientX/clientY`. For keyboard activation (which
reports `0,0`) `handleFindMeal` falls back to the button's center. If no origin is
given at all, the overlay falls back to its own center.

**Phases:** `idle → cover → reveal → idle`
1. **cover** — overlay mounts (a full-box `overflow:hidden` wrapper + a circle
   child). A `useLayoutEffect` (runs before paint) measures the **wrapper's**
   `getBoundingClientRect`, computes the origin (`x = clientX - box.left`,
   `y = clientY - box.top`) and `r = irisRadius(...)`, sizes the circle to `2r` and
   positions it centred on the origin, then `circle.animate(scale(0) → scale(1))`
   grows it over `COVER_MS` (400ms).
2. At `COVER_MS` — `navigate(to, options)` swaps the route and phase → **reveal**.
   The circle keeps its size/position; `circle.animate(scale(1) → scale(0))` shrinks
   it over `REVEAL_MS` (300ms).
3. At `COVER_MS + REVEAL_MS` (700ms total) — phase → **idle**, overlay unmounts.

**Navigation is timer-driven, not animation-driven** — the route swap is on a
`setTimeout`, so a stalled or interrupted animation can never block routing.

**Origin:** the tap point. Coordinates are resolved against the overlay's **own**
measured box (not an assumed one), so the circle lands on the tap whether the
fixed overlay resolves to the phone frame (desktop) or the viewport (mobile).

---

## The desktop "phone frame" wrinkle (important context)

On desktop (≥601px) the whole app is pinned inside a 375×812 `.device-frame`.
That element uses `transform: translateZ(0)` to become the **containing block** for
`position: fixed` descendants, so fixed chrome — the iris overlay, the All Meals
FAB, the A–Z index — resolves to the frame instead of escaping to the window edges.

This is the crux of the bug we chased: the iris circle's `clip-path` coordinates
are relative to whatever box the fixed overlay actually resolves to. The original
code *assumed* that box was the frame and computed frame-relative coordinates; if
the overlay instead fills the viewport, those coordinates land the circle in the
middle, off to the left. The current code measures the overlay's own box to sidestep
the assumption.

**If the tap iris still originates wrong, suspect:**
- the overlay resolving to a different box than expected (containing block behaving
  differently across browsers), or
- a `transform` on an ancestor (e.g. page/swipe-transition transforms) changing the
  coordinate space the clip-path renders in.

A console snippet that logs `tap`, `overlayBox`, `vars`, `computedClipPath`,
`viewport`, and the `.device-frame` box + transform on the next tap is the fastest
way to see which of these is happening.
