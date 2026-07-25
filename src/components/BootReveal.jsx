import { useEffect } from 'react'
import { useData } from '../context/DataContext.jsx'
import { EASE, REVEAL_MS, irisRadius, prefersReducedMotion } from '../lib/iris.js'

// Never hold past this, so a stalled fetch can't strand the user on red.
const MAX_HOLD_MS = 2000

// First load only: navigating away and back must not replay it.
let revealed = false

/**
 * Animates away the red overlay that index.html paints before the bundle
 * parses, once the app's data is in. Drives the boot overlay's DOM node
 * directly rather than rendering its own, so there is no frame where neither
 * is on screen.
 *
 * Homepage-only: index.html drops the overlay on other entry points, so the
 * lookup below finds nothing and this no-ops.
 */
export default function BootReveal() {
  const { loading } = useData()

  useEffect(() => {
    if (revealed) return
    const node = document.getElementById('boot-iris')
    if (!node) return

    const reveal = () => {
      revealed = true
      // Collapse to bottom-centre of the overlay's own box — the phone frame on
      // desktop, the viewport on mobile (index.html sizes #boot-iris to match).
      const rect = node.getBoundingClientRect()
      const x = rect.width / 2
      const y = rect.height
      const r = irisRadius(x, y, rect.width, rect.height)

      // Scale a solid circle away, matching the tap iris (IrisTransition.jsx) —
      // NOT an animated clip-path, which mis-centres on some GPUs. #boot-iris keeps
      // clipping (overflow:hidden) so the oversized circle never spills past the
      // frame; swap its solid fill for the circle (both fully cover the box, so no
      // flash), then scale the circle down to the bottom-centre point.
      const circle = document.createElement('div')
      circle.style.cssText =
        `position:absolute; left:${x - r}px; top:${y - r}px; width:${2 * r}px;` +
        // Keep #DF2121 in sync with --color-accent (see index.html).
        ` height:${2 * r}px; border-radius:50%; background:#DF2121; transform-origin:center;`
      node.style.background = 'transparent'
      node.appendChild(circle)

      const remove = () => node.remove()
      const anim = circle.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(0)' }],
        { duration: prefersReducedMotion() ? 0 : REVEAL_MS, easing: EASE, fill: 'forwards' }
      )
      anim.addEventListener('finish', remove, { once: true })
      // A stuck overlay blocks the whole app, so don't rely on the finish event alone.
      setTimeout(remove, REVEAL_MS * 2)
    }

    if (!loading) {
      reveal()
      return
    }

    // Still waiting on data. performance.now() is measured from navigation
    // start, so the cap is anchored to page load rather than to React mounting.
    const timer = setTimeout(reveal, Math.max(0, MAX_HOLD_MS - performance.now()))
    return () => clearTimeout(timer)
  }, [loading])

  return null
}
