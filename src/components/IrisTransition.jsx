import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { COVER_MS, EASE, REVEAL_MS, irisRadius, prefersReducedMotion } from '../lib/iris.js'
import './IrisTransition.css'

const IrisContext = createContext(null)

export function IrisProvider({ children }) {
  const navigate = useNavigate()
  // The click origin in CLIENT (viewport) coordinates; resolved against the
  // overlay's own box in the layout effect below.
  const [state, setState] = useState({ phase: 'idle', clientX: null, clientY: null })
  const circleRef = useRef(null)
  const timers = useRef([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => clearTimers, [])

  const irisNavigate = useCallback(
    (to, options = {}, origin) => {
      clearTimers()

      // Grow a circle from the click point to cover the screen (iris closing).
      setState({ phase: 'cover', clientX: origin?.x ?? null, clientY: origin?.y ?? null })

      // Navigation is driven by a timer, NOT the animation's completion, so a
      // route swap can never be blocked by a stalled/interrupted animation.
      // Once covered, swap the route and shrink the circle away (iris opening).
      timers.current.push(
        setTimeout(() => {
          navigate(to, options)
          setState((s) => ({ ...s, phase: 'reveal' }))
        }, COVER_MS)
      )

      // After the reveal finishes, unmount the overlay.
      timers.current.push(
        setTimeout(() => setState((s) => ({ ...s, phase: 'idle' })), COVER_MS + REVEAL_MS)
      )
    },
    [navigate]
  )

  // The effect is a solid circular <div> scaled with `transform`, NOT an animated
  // `clip-path`. Animating clip-path collapses the circle to the element's centre
  // on some GPUs (regardless of literal vs var() values); `transform: scale()` is
  // the most reliably composited property and renders correctly everywhere. The
  // circle is sized to reach the farthest corner and positioned so its centre sits
  // on the click point, then scaled 0→1 (cover) / 1→0 (reveal); the overflow:hidden
  // wrapper clips it to the frame on desktop / the viewport on mobile. Runs before
  // paint so the first frame is already correct.
  useLayoutEffect(() => {
    const circle = circleRef.current
    if (!circle) return
    const rect = circle.parentElement.getBoundingClientRect()
    const dur = (ms) => (prefersReducedMotion() ? 0 : ms)

    if (state.phase === 'cover') {
      // Missing origin (e.g. keyboard activation) falls back to the box centre.
      const x = state.clientX == null ? rect.width / 2 : state.clientX - rect.left
      const y = state.clientY == null ? rect.height / 2 : state.clientY - rect.top
      const r = irisRadius(x, y, rect.width, rect.height)
      circle.style.width = `${2 * r}px`
      circle.style.height = `${2 * r}px`
      circle.style.left = `${x - r}px`
      circle.style.top = `${y - r}px`
      circle.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
        duration: dur(COVER_MS),
        easing: EASE,
        fill: 'forwards',
      })
    } else if (state.phase === 'reveal') {
      // Size/position from the cover pass persist on the node; just reverse it.
      circle.animate([{ transform: 'scale(1)' }, { transform: 'scale(0)' }], {
        duration: dur(REVEAL_MS),
        easing: EASE,
        fill: 'forwards',
      })
    }
  }, [state.phase, state.clientX, state.clientY])

  return (
    <IrisContext.Provider value={irisNavigate}>
      {children}
      {state.phase !== 'idle' && (
        <div className="iris-overlay" aria-hidden="true">
          <div ref={circleRef} className="iris-overlay__circle" />
        </div>
      )}
    </IrisContext.Provider>
  )
}

export function useIris() {
  return useContext(IrisContext)
}
