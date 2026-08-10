import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { OnboardingProvider, useOnboarding } from '../onboarding/OnboardingContext.jsx'
import { getFlow } from '../onboarding/flows.js'
import IconButton from '../components/IconButton'
import Icon from '../components/Icon'
import { getPageScroller, scrollPageTo } from '../lib/pageScroll'
import '../onboarding/Onboarding.css'

function OnboardingRunner({ flow }) {
  const navigate = useNavigate()
  const { addStarterPack, reset } = useOnboarding()
  const [index, setIndex] = useState(0)
  const chromeRef = useRef(null)
  const stepRef = useRef(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [shelfHeight, setShelfHeight] = useState(0)

  // Reset and seed have to share one effect, in this order. Split across two,
  // the seed ran first and reset() wiped it right back out — which stayed
  // invisible in B only because its Main Event sits at step 2 and re-seeds an
  // empty roster itself. A reaches its roster screen first and showed nothing.
  //
  // A fresh run every time the variant changes, so switching between A and B
  // from Settings never inherits the other flow's roster; both variants then
  // seed the starter pack on mount rather than spending a screen on it.
  useEffect(() => {
    reset()
    setIndex(0)
    if (flow.seedStarterPack) addStarterPack()
  }, [flow.id, flow.seedStarterPack, reset, addStarterPack])

  const step = flow.steps[index]
  const isLast = index === flow.steps.length - 1

  // The back-to-top control only makes sense once the back chevron itself has
  // scrolled out of view — watching the viewport (root: null) rather than
  // whichever element actually scrolls (see getPageScroller in pageScroll.js)
  // still gives the right answer here: the intersection algorithm clips
  // through every overflow:hidden/auto ancestor on the way up regardless of
  // which one is named root, so this stays correct on both the phone (window
  // scrolls) and the desktop device frame (an inner element scrolls).
  useEffect(() => {
    const backBtn = chromeRef.current?.querySelector('.icon-btn')
    if (!backBtn) return
    const observer = new IntersectionObserver(([entry]) => setShowBackToTop(!entry.isIntersecting))
    observer.observe(backBtn)
    return () => observer.disconnect()
  }, [step.key])

  // Sits just above whichever actions block the step renders (the shelf, or
  // Champion's on-panel bar) — measured rather than hardcoded since button
  // copy and the shelf's caption row change its height per step.
  useEffect(() => {
    const actions = stepRef.current?.querySelector('.ob-step__actions')
    if (!actions) {
      setShelfHeight(0)
      return
    }
    const observer = new ResizeObserver(([entry]) => setShelfHeight(entry.contentRect.height))
    observer.observe(actions)
    return () => observer.disconnect()
  }, [step.key])

  function goNext() {
    if (isLast) {
      exit()
      return
    }
    setIndex((i) => i + 1)
  }

  function goBack() {
    if (index === 0) {
      exit()
      return
    }
    setIndex((i) => i - 1)
  }

  function exit() {
    navigate('/settings')
  }

  const { Component, skippable } = step
  // Variant B carries a hand-sized fill per frame; anything without one falls
  // back to an even share of the flow.
  const progress = step.progress ?? ((index + 1) / flow.steps.length) * 100

  return (
    <div className="onboarding">
      {/* Success is the flow's confirmation screen, one step past the
          paywall. The chrome bar (back chevron, progress, exit) has nothing
          left to do there — there's no step to return to that isn't the
          purchase screen, no progress left to track, and exit lands on the
          same place Continue does — so the whole bar is skipped rather than
          left empty, letting the content take the space it reserved. */}
      {!isLast && (
        <div
          ref={chromeRef}
          className={
            'onboarding__chrome' +
            (flow.showExit ? '' : ' onboarding__chrome--no-exit') +
            (step.flush ? ' onboarding__chrome--flush' : '')
          }
        >
          <IconButton
            name="chevron_left"
            label="Back"
            className="icon-btn--filled"
            onClick={goBack}
          />

          {progress > 0 && (
            <div
              className="onboarding__progress"
              role="progressbar"
              aria-valuenow={index + 1}
              aria-valuemin={1}
              aria-valuemax={flow.steps.length}
              aria-label={`Step ${index + 1} of ${flow.steps.length}`}
            >
              <div className="onboarding__progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}

          {flow.showExit && (
            <IconButton
              name="close"
              label="Exit onboarding"
              className="icon-btn--filled"
              onClick={exit}
            />
          )}
        </div>
      )}

      <div className="onboarding__step" ref={stepRef} key={step.key}>
        <Component
          onNext={goNext}
          onBack={goBack}
          onSkip={skippable ? goNext : null}
          onExit={exit}
          flow={flow}
        />
      </div>

      {step.key === 'prebuilt' && (
        <button
          type="button"
          className={'onboarding__to-top' + (showBackToTop ? ' onboarding__to-top--visible' : '')}
          style={{ bottom: `${shelfHeight + 80}px` }}
          onClick={() => scrollPageTo(0, getPageScroller(), { smooth: true })}
          aria-label="Back to top"
          tabIndex={showBackToTop ? 0 : -1}
        >
          <Icon name="expand_less" />
        </button>
      )}
    </div>
  )
}

export default function Onboarding() {
  const { variant } = useParams()
  const flow = getFlow(variant)

  if (!flow) return <Navigate to="/settings" replace />

  return (
    <OnboardingProvider>
      <OnboardingRunner flow={flow} />
    </OnboardingProvider>
  )
}
