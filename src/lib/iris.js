// Duration of each half of the transition, in ms, and the shared easing.
export const COVER_MS = 400
export const REVEAL_MS = 300
export const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'

// True when the user has asked the OS to minimise motion. The iris is driven by
// the Web Animations API (see IrisTransition / BootReveal), which — unlike CSS —
// does not honour prefers-reduced-motion automatically, so callers zero the
// duration themselves.
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Reach exactly the farthest corner of the box. A larger radius keeps growing
// after the box is covered, stalling the transition on flat colour for most of
// its run. x/y are relative to the box's top-left; w/h are the box size. Callers
// measure the overlay's own box (IrisTransition) or the boot node (BootReveal)
// so the circle is centred correctly whatever that box resolves to.
export function irisRadius(x, y, w, h) {
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y))
}
