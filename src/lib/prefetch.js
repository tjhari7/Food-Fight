import impactAllMeals from '../assets/Impact_All_Meals.svg'
import fistImage from '../assets/Main_Event_Fist_Fight_01.webp'
import leftBolt from '../assets/Left_Bolt.svg'
import rightBolt from '../assets/Right_Bolt.svg'
import impactWinner from '../assets/Impact_All_Meals_2.svg'

// Speculative asset loading, shared by the main app's one-shot warm and
// onboarding's step-ahead prefetch.
//
// Only assets Vite *emits* are worth passing through here. Anything under its
// 4KB inline limit (Curve_Shape, Icon_Refresh_Round, Icon_Plus_Add, the Apple
// and Google marks, Bubble_Tail) is already base64'd into the bundle and has
// arrived before any of this runs — prefetching those is a no-op that only
// costs a decode. See the lists in warmMainAppAssets below and the `assets`
// field on each step in onboarding/flows.js.

// Every URL we have already started. Prefetching is cheap but not free, and
// both callers can name the same file (the bolts and the fist are on Main Event
// and on onboarding's main-event step; Impact_All_Meals_2 is on the winner page
// and on champion), so without this the overlap would be fetched twice.
const started = new Set()

/**
 * Whether speculative loading is appropriate at all right now.
 *
 * Prefetching is a bet: bandwidth spent on something the user may never open.
 * On a metered or very slow connection that bet is a bad one and the user has
 * usually already said so, so take them at their word. navigator.connection is
 * Chromium-only; where it is missing we can't tell, and the assets are small
 * enough (131KB for the whole main app) that proceeding is the better default.
 */
export function shouldPrefetch() {
  if (typeof navigator === 'undefined') return false
  const c = navigator.connection
  if (!c) return true
  if (c.saveData) return false
  return c.effectiveType !== 'slow-2g' && c.effectiveType !== '2g'
}

/**
 * Run `fn` when the browser is genuinely idle.
 *
 * The whole point is to never compete with the screen the user is looking at.
 * requestIdleCallback yields until the current work is done; the setTimeout
 * fallback (Safari shipped rIC only in 17.4) is a coarse approximation but
 * still puts us behind the current paint.
 */
export function whenIdle(fn, timeout = 2000) {
  if (typeof window === 'undefined') return
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(fn, { timeout })
  } else {
    setTimeout(fn, 200)
  }
}

/**
 * Download and decode `urls`, ignoring any that are already in flight.
 *
 * decode() rather than just setting src, because the two failure modes feel
 * different: a downloaded-but-undecoded image still costs a main-thread decode
 * at the moment it is painted, which is exactly the hitch this is meant to
 * remove. Decoding here moves that cost into idle time.
 *
 * Failures are swallowed on purpose. A prefetch that 404s or is aborted must
 * never surface — the real <img> will fail the same way and report it in the
 * place the user can actually see.
 */
export function prefetchAssets(urls) {
  if (!shouldPrefetch()) return
  for (const url of urls) {
    if (!url || started.has(url)) continue
    started.add(url)
    const img = new Image()
    img.src = url
    // decode() rejects if the element is removed or the fetch fails; neither is
    // worth reporting, and an unhandled rejection here would be noise.
    if (typeof img.decode === 'function') img.decode().catch(() => {})
  }
}

// Only assets the main app fetches over the network, by the screen that needs
// them. 131KB total — small enough that staging it per-route would be more
// bookkeeping than it saves, so it goes in one pass.
//
//   /meals        Impact_All_Meals.svg          7.8KB
//   /find/results Main_Event_Fist_Fight_01.webp  53KB
//                 Left_Bolt.svg                 7.2KB
//                 Right_Bolt.svg                7.4KB
//   /meals/:id    Impact_All_Meals_2.svg         56KB
//
// Home's hero is deliberately absent: it is preloaded from index.html, so by
// the time this runs it is already cached and re-requesting it would be waste.
const MAIN_APP_ASSETS = [impactAllMeals, fistImage, leftBolt, rightBolt, impactWinner]

let warmed = false

/**
 * Warm every network asset the main app will ever need, once per session.
 *
 * Called from App, which outlives any single page, so this runs once on the
 * first screen rather than per navigation. Waits for `load` before even asking
 * for idle time: during load the browser is still fetching the bundle, the
 * fonts and the hero, and joining that queue would make the screen the user is
 * actually looking at slower in order to speed up one they may never open.
 */
export function warmMainAppAssets() {
  if (warmed || typeof window === 'undefined') return
  warmed = true

  const go = () => whenIdle(() => prefetchAssets(MAIN_APP_ASSETS))

  if (document.readyState === 'complete') go()
  else window.addEventListener('load', go, { once: true })
}
