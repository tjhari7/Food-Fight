import { useEffect, useRef } from 'react'
import './Toast.css'

const DEFAULT_DURATION_MS = 2500

/**
 * Transient confirmation banner pinned to the top of the screen. Renders over
 * the group drawer's scrim (see Toast.css z-index), matching the pattern where
 * "Link copied." lands while the sheet is still open.
 */
export default function Toast({ message, onDismiss, duration = DEFAULT_DURATION_MS }) {
  // Held in a ref so the effect below can leave `onDismiss` out of its deps.
  // Callers pass an inline arrow, which is a fresh function every render — in
  // the deps it would restart the countdown on every unrelated re-render of
  // the host page, and the group's judge counter re-renders it every few
  // seconds.
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    if (!message) return undefined
    // Keyed on `message`, so a second copy restarts the clock rather than
    // inheriting what was left of the first one's.
    const timer = setTimeout(() => onDismissRef.current(), duration)
    return () => clearTimeout(timer)
  }, [message, duration])

  if (!message) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__message">{message}</span>
    </div>
  )
}
