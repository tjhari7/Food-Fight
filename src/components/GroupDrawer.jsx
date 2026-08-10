import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { prefersReducedMotion } from '../lib/swipeBack'
import './GroupDrawer.css'

// Drag this far down and the release closes the sheet; anything short of it
// springs back. Deliberately generous — an accidental downward twitch while
// reaching for COPY LINK shouldn't dismiss the thing.
const CLOSE_THRESHOLD = 80

// Must match the group-drawer-out duration in GroupDrawer.css.
const EXIT_MS = 250

/**
 * Bottom sheet for starting and managing a group decision.
 *
 * Dismissal is tap-the-scrim, drag-the-sheet-down, or Escape. The drag is
 * intentionally plain: a 1:1 follow with a distance threshold, no velocity
 * tracking and no rubber-banding past the top. Those add real complexity for a
 * gesture that is not this feature's point.
 *
 * `active` gates the ACTIVE badge and the Cancel Group way out. In practice
 * the sheet only ever opens already active — the parent flips a group live
 * the instant the host taps the entry icon — but the prop stays separate
 * from `open` so a future path that opens the sheet without activating
 * (or a cancel that closes without a fresh mount) still renders correctly.
 *
 * `open` is the single source of truth. A dismissal calls onClose() straight
 * away — the parent flips `open` false immediately and this keeps itself
 * mounted through the exit animation on its own. The earlier shape (hold the
 * parent open, run the exit, call onClose when it ends) had two failure modes
 * that both surfaced as "the drawer just appears, it never slides up":
 * animationend is not delivered while the document isn't painting, so the
 * close could never complete; and tapping the group icon mid-exit was a no-op
 * on an `open` that was already true, so the sheet came back without ever
 * remounting — and an entrance animation only runs on a fresh mount.
 */
export default function GroupDrawer({
  open,
  active,
  onClose,
  onCopyLink,
  onShareLink,
  onCancelGroup,
}) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)
  const gestureRef = useRef(null)
  const sheetRef = useRef(null)
  // Distinguishes "closed because it was dismissed" from "closed because the
  // page just mounted" — only the former should play an exit.
  const hasOpened = useRef(false)

  // Drives the exit off the `open` prop rather than off a dismissal handler,
  // so every route out (scrim, drag, Escape, cancelling the group) animates
  // identically and re-opening is always a real false -> true transition.
  useEffect(() => {
    if (open) {
      hasOpened.current = true
      setClosing(false)
      setDragY(0)
      return
    }
    if (!hasOpened.current) return
    setClosing(!prefersReducedMotion())
  }, [open])

  // Land focus on the sheet so Escape reaches the handler below and assistive
  // tech announces the dialog rather than leaving the user back on the page.
  //
  // `preventScroll` is load-bearing, not a nicety: focus() otherwise scrolls
  // the target into view, and this target is a `position: fixed` box pinned to
  // the bottom of the screen. The browser answers by scrolling the page (or,
  // on desktop, .device-frame__scroll) toward it, which reads as the whole
  // page lurching the instant the drawer opens.
  useEffect(() => {
    if (open) sheetRef.current?.focus({ preventScroll: true })
  }, [open])

  // Hands straight back to the parent; the exit is started by the `open`
  // effect above once it flips false.
  function requestClose() {
    if (closing) return
    setDragging(false)
    onClose()
  }

  function handlePointerDown(e) {
    if (closing) return
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    // Never start a drag on a control — the sheet's buttons need their taps.
    if (e.target.closest('button')) return
    gestureRef.current = { pointerId: e.pointerId, startY: e.clientY }
  }

  function handlePointerMove(e) {
    const g = gestureRef.current
    if (!g || g.pointerId !== e.pointerId) return

    const delta = e.clientY - g.startY
    // Downward only. Upward travel is ignored rather than clamped-and-tracked,
    // so a drag that starts up and comes back down doesn't jump.
    if (delta <= 0) {
      if (dragging) setDragY(0)
      return
    }

    if (!dragging) {
      setDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setDragY(delta)
  }

  function handlePointerUp(e) {
    const g = gestureRef.current
    if (!g || g.pointerId !== e.pointerId) return
    gestureRef.current = null

    if (dragY > CLOSE_THRESHOLD) {
      // Keeps dragY so the exit animation starts from where the finger left
      // the sheet (see --drag-y in GroupDrawer.css) instead of snapping to
      // rest first and sliding down from there.
      requestClose()
      return
    }
    setDragging(false)
    setDragY(0)
  }

  function handlePointerCancel() {
    gestureRef.current = null
    setDragging(false)
    setDragY(0)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      requestClose()
    }
  }

  // Ends the exit. The parent already closed; this only tears down the local
  // animation state so the next open mounts clean.
  function finishClose() {
    setClosing(false)
    setDragY(0)
  }

  // Completing the exit on `animationend` alone is a trap: Chrome doesn't
  // deliver it while the document isn't painting (background tab, occluded
  // window), and a close that never completes leaves this mounted with
  // `closing` stuck true — the sheet sits off-screen, the parent still thinks
  // the drawer is open, and every later tap on the group icon is a no-op that
  // "instantly" reveals a sheet already at rest instead of animating it up.
  // The timer is the guarantee; animationend below is just the fast path.
  // Same failure MainEvent.jsx guards its reroll phase machine against.
  useEffect(() => {
    if (!closing) return undefined
    const timer = setTimeout(finishClose, EXIT_MS + 80)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing])

  function handleAnimationEnd(e) {
    if (e.animationName === 'group-drawer-out') finishClose()
  }

  // Outlives `open` by exactly the length of the exit animation.
  if (!open && !closing) return null

  const sheetClass = [
    'group-drawer__sheet',
    dragging ? 'group-drawer__sheet--dragging' : '',
    closing ? 'group-drawer__sheet--closing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`group-drawer${closing ? ' group-drawer--closing' : ''}`}>
      <div className="group-drawer__scrim" onClick={requestClose} />

      <div
        ref={sheetRef}
        className={sheetClass}
        style={{
          '--drag-y': `${dragY}px`,
          transform: dragging ? `translateY(${dragY}px)` : undefined,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-drawer-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="group-drawer__grabber" aria-hidden="true" />

        {active && (
          <p className="group-drawer__status">
            <Icon name="check_circle" className="group-drawer__status-icon" />
            Active
          </p>
        )}

        <h2 id="group-drawer-title" className="group-drawer__title">
          Group Decision
        </h2>

        <p className="group-drawer__body">Invite others to judge this fight.</p>

        <div className="group-drawer__actions">
          <button type="button" className="group-drawer__action" onClick={onCopyLink}>
            <Icon name="content_copy" className="group-drawer__action-icon" />
            <span>Copy Link</span>
          </button>
          <button type="button" className="group-drawer__action" onClick={onShareLink}>
            <Icon name="ios_share" className="group-drawer__action-icon" />
            <span>Share Link</span>
          </button>
        </div>

        {active && (
          <button type="button" className="group-drawer__cancel" onClick={onCancelGroup}>
            Cancel Group
          </button>
        )}
      </div>
    </div>
  )
}
