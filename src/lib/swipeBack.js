import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Keep in sync with the page-swipe-leave* keyframes in index.css.
export const LEAVE_MS = 200

// Pages sit either side of Home. Main Event is on a horizontal strip to Home's
// right; All Meals is on a vertical strip below Home. A swipe pans the strip, so
// the outgoing page flies off toward the side it lives on and the incoming one
// slides in from the space it vacates. This is the class/keyframe pair for each
// direction of travel.
const LEAVE = {
  right: { className: 'swipe-leaving', animationName: 'page-swipe-leave' },
  left: { className: 'swipe-leaving-left', animationName: 'page-swipe-leave-left' },
  up: { className: 'swipe-leaving-up', animationName: 'page-swipe-leave-up' },
  down: { className: 'swipe-leaving-down', animationName: 'page-swipe-leave-down' },
}

// `enterFrom` is the side the destination slides in from — always opposite the
// side the outgoing page exits toward, so the pan reads as one continuous
// movement. The destination reads it off its location state.
const BACK_STATE = {
  right: { swipeBack: true, enterFrom: 'left' },
  left: { swipeBack: true, enterFrom: 'right' },
  down: { swipeBack: true, enterFrom: 'up' },
}
const FORWARD_STATE = { swipeForward: true }

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

function usePageSwipe(to, direction, state) {
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)
  const timerRef = useRef(null)
  const doneRef = useRef(false)
  const { className, animationName } = LEAVE[direction]

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const finish = useCallback(() => {
    // Every animated child fires animationend, and the fallback timer may race
    // them, so only the first caller through here navigates.
    if (doneRef.current) return
    doneRef.current = true
    clearTimeout(timerRef.current)
    navigate(to, { state })
  }, [navigate, to, state])

  const start = useCallback(() => {
    if (leaving) return
    if (prefersReducedMotion()) {
      navigate(to)
      return
    }
    setLeaving(true)
    // A hidden tab freezes the animation timeline, so animationend may never
    // arrive and would strand the page mid-swipe. Same reasoning as the boot
    // overlay's fallback: don't rely on animationend alone.
    timerRef.current = setTimeout(finish, LEAVE_MS + 100)
  }, [leaving, navigate, to, finish])

  const handleAnimationEnd = useCallback(
    (e) => {
      if (e.animationName !== animationName) return
      finish()
    },
    [animationName, finish]
  )

  return {
    leaving,
    start,
    rootProps: { onAnimationEnd: handleAnimationEnd },
    leavingClass: leaving ? ` ${className}` : '',
  }
}

/**
 * Back-button swipe to any page: the content slides off toward `direction`, then
 * the destination slides in from the opposite side. Spread `rootProps` onto the
 * `.page` root — the animation is applied to its children by index.css, and
 * their animationend bubbles up. `state` is the destination's own location state
 * (the winner's Main Event round, say), carried through with the swipe flags
 * merged in so the page it returns to comes back as it was left.
 */
export function useSwipeBackTo(to, direction = 'right', state) {
  // Memoised so the navigate() callback below doesn't churn every render.
  const backState = useMemo(() => ({ ...state, ...BACK_STATE[direction] }), [state, direction])
  const { start, ...swipe } = usePageSwipe(to, direction, backState)
  return { ...swipe, startBack: start }
}

/**
 * The same swipe, back to Home. Pass 'left' for pages that live to Home's left
 * (All Meals) and so exit that way.
 */
export function useSwipeBackHome(direction = 'right') {
  return useSwipeBackTo('/', direction)
}

/**
 * Home -> All Meals, the reverse of that page's back swipe: Home slides off the
 * top and All Meals slides up from the bottom. Same rootProps contract. The
 * destination opts into the slide-in by reading `swipeForward` off its location
 * state and applying `.swipe-entering-from-below` to its `.page` root.
 */
export function useSwipeForward(to) {
  const { start, ...swipe } = usePageSwipe(to, 'up', FORWARD_STATE)
  return { ...swipe, startForward: start }
}
