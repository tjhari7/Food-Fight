// Scroll-position helpers that work in both layouts the app runs in.
//
// On a phone the window scrolls the page. On desktop/tablet the whole app is
// pinned inside .device-frame and the content scrolls inside an inner
// .device-frame__scroll container instead — the frame itself does not move, so
// its `position: fixed` chrome (the Add Meal FAB, the A–Z index) stays locked.
// Scroll-linked behaviour therefore has to read/write whichever element is the
// real scroller; these helpers pick it.

// The active scroll container: the frame's inner scroller when it is actually
// scrolling (desktop/tablet), otherwise the window.
export function getPageScroller() {
  const scroller = document.querySelector('.device-frame__scroll')
  if (scroller) {
    const overflowY = getComputedStyle(scroller).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') return scroller
  }
  return window
}

export function getScrollTop(scroller = getPageScroller()) {
  return scroller === window ? window.scrollY : scroller.scrollTop
}

export function scrollPageTo(top, scroller = getPageScroller(), { smooth = false, duration = 500 } = {}) {
  if (!smooth) {
    if (scroller === window) window.scrollTo(0, top)
    else scroller.scrollTop = top
    return
  }

  const start = getScrollTop(scroller)
  const distance = top - start
  if (distance === 0) return

  const startTime = performance.now()
  const easeOut = t => 1 - Math.pow(1 - t, 3)

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1)
    const value = start + distance * easeOut(t)
    if (scroller === window) window.scrollTo(0, value)
    else scroller.scrollTop = value
    if (t < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

// How far the scroller must move for `el` to reach the top of the visible area
// (the viewport top on window, the frame's top edge inside the scroller).
export function offsetWithinScroller(el, scroller = getPageScroller()) {
  const elTop = el.getBoundingClientRect().top
  if (scroller === window) return window.scrollY + elTop
  return scroller.scrollTop + (elTop - scroller.getBoundingClientRect().top)
}
