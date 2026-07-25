import { prefersReducedMotion } from './swipeBack'

// Shared by the tapped list card and the detail card: matching names are how the
// browser knows the two are the same thing and tweens the box between them. Only
// ever set on one element at a time — a view-transition-name has to be unique
// across the document when the snapshots are taken, or the transition is dropped.
// The animation itself lives in index.css.
export const MEAL_MORPH_NAME = 'meal-card'

// Browsers without startViewTransition fall back to a plain navigation on their
// own (React Router feature-detects it), so this only has to cover motion
// preference. Matches the check in useSwipeBackHome.
export function shouldMorph() {
  return !prefersReducedMotion()
}
