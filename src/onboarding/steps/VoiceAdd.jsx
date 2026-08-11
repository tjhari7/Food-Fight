import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Button from '../../components/Button'
import Icon from '../../components/Icon'
import { useOnboarding } from '../OnboardingContext.jsx'
import frontPizza from '../../assets/Front_Pizza_transparent.webp'
import bubbleTail from '../../assets/Bubble_Tail.svg'
import curveShape from '../../assets/Curve_Shape.svg'

const SpeechRecognitionClass =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

// Speech gives back no reliable punctuation, so splitting a transcript into
// meals by comma or "and" is a guess that gets "spaghetti and meatballs" wrong.
// Instead the interaction does the segmentation: recognition runs continuous,
// and every result the engine marks final — i.e. every pause it detects — becomes
// exactly one meal. Compound names survive because they're never split at all.
function cleanTitle(raw) {
  const text = raw.trim().replace(/[.,;!?]+$/, '').trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Figma B-5/B-5.2 measure the mic group against the top of the shelf's arc,
// not against the shelf itself: the status line's bottom sits at 636 and the
// curve starts at 660. Both frames put it in the identical place, which is the
// point — the group must not shift when recording starts.
const MIC_GROUP_CURVE_GAP = 24

// The status line is out of the group's flow (see .ob-voice__status), so the
// group's own box is just the 64px mic. This is what hangs below it: the 8px
// gap plus one 24px line. Reserving it here is what makes MIC_GROUP_CURVE_GAP
// a gap above the *text* rather than above the button, while leaving the
// button's position independent of how long the text actually runs.
const STATUS_RESERVE = 32

export default function VoiceAdd({ onNext, onSkip }) {
  const { meals, addVoiceMeals, removeMeal } = useOnboarding()
  const spokenMeals = meals.filter((m) => m.source === 'voice')

  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)
  const [micGroupBottom, setMicGroupBottom] = useState(0)

  const actionsRef = useRef(null)
  const curveRef = useRef(null)
  const recognitionRef = useRef(null)
  // Chrome ends a continuous session on its own after a stretch of silence.
  // This flag distinguishes that from the user pressing stop, so the former can
  // be restarted transparently and the latter can't restart-loop.
  const shouldListenRef = useRef(false)
  // Read inside recognition callbacks, which close over the render they were
  // created in — a ref keeps the dedupe check looking at current titles.
  const titlesRef = useRef([])
  titlesRef.current = spokenMeals.map((m) => m.title.toLowerCase())

  useEffect(() => {
    return () => {
      shouldListenRef.current = false
      recognitionRef.current?.stop()
    }
  }, [])

  // The mic group is positioned out of the flow so it never drifts — mascot
  // vs. chips above it, and status text changing length, would otherwise
  // reflow whatever it's centered against. Measured rather than hardcoded
  // since the shelf's own height isn't fixed (button label length, whether a
  // caption row is present) — same technique the back-to-top button uses.
  //
  // What's measured is the distance from the shelf's bottom edge up to the top
  // of the arc, not the shelf's height. The shelf's bottom is the step's
  // bottom, which is the edge the group's own `bottom` resolves against, so
  // that distance drops straight into the offset — and reading the curve's
  // real position means the 40px transparent band the arc is drawn inside (see
  // .ob-step__actions--shelf-low) never has to be subtracted by hand here.
  // The pair stays valid even while the shelf is stuck to the viewport: the
  // curve is positioned against the shelf, so both rects slide together and
  // their difference doesn't change.
  //
  // Both rects are re-read on every resize rather than taking the observer
  // entry's contentRect: that box excludes the shelf's border and padding, so
  // using it dropped the group 64px on the first callback — under the curve
  // instead of above it.
  //
  // A layout effect, measuring synchronously before paint, so the group's first
  // painted frame is already in the right place rather than jumping into it.
  //
  // That first measurement can still be taken against fallback metrics, though:
  // the CTA's label is Gliker, and in a fallback face it wraps to two lines and
  // reports a shelf ~42px taller than the real one. The observer normally
  // catches the reflow when the webfont swaps in, but it can't be the only
  // thing that does — ResizeObserver is driven by the rendering steps, which a
  // backgrounded tab doesn't run, so a step mounted out of view would keep the
  // pre-swap number for as long as it stayed there. Waiting on fonts.ready
  // re-measures regardless.
  useLayoutEffect(() => {
    const actions = actionsRef.current
    const curve = curveRef.current
    if (!actions || !curve) return
    let live = true
    const measure = () => {
      if (!live) return
      const toCurveTop = actions.getBoundingClientRect().bottom - curve.getBoundingClientRect().top
      setMicGroupBottom(toCurveTop + MIC_GROUP_CURVE_GAP + STATUS_RESERVE)
    }
    measure()
    document.fonts?.ready.then(measure)
    const observer = new ResizeObserver(measure)
    observer.observe(actions)
    return () => {
      live = false
      observer.disconnect()
    }
  }, [])

  function start() {
    if (!SpeechRecognitionClass) return

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (!result.isFinal) {
          setInterim(result[0].transcript)
          continue
        }
        setInterim('')
        const title = cleanTitle(result[0].transcript)
        if (title && !titlesRef.current.includes(title.toLowerCase())) {
          titlesRef.current = [...titlesRef.current, title.toLowerCase()]
          addVoiceMeals([title])
        }
      }
    }

    recognition.onerror = (e) => {
      shouldListenRef.current = false
      setListening(false)
      setInterim('')
      if (e.error === 'not-allowed') {
        setError('Microphone access was blocked. Enable it in your browser settings, or skip.')
      } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
        setError("Couldn't hear that. Try again, or skip.")
      }
    }

    // Restart rather than end when the engine times out mid-session, so a user
    // thinking about their next meal doesn't silently lose the mic.
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start()
          return
        } catch {
          // Restart can throw if the engine hasn't fully released; fall through
          // and let the user press the button again.
        }
      }
      setListening(false)
      setInterim('')
    }

    recognitionRef.current = recognition
    shouldListenRef.current = true
    setError(null)
    setListening(true)
    recognition.start()
  }

  function stop() {
    shouldListenRef.current = false
    recognitionRef.current?.stop()
    setListening(false)
    setInterim('')
  }

  return (
    <div className="ob-step ob-step--inset-24 ob-step--sticky-shelf ob-step--voice">
      <div className="ob-step__head">
        <h1 className="ob-step__title">
          Add Favorite Meals
          <br />
          With Your Voice
        </h1>
        <p className="ob-step__body">
          Tap record, say your meals one at a time. Pause between each to add the next meal.
        </p>
      </div>

      {/* One button per chip, matching .home__chip and .all-meals__count-chip:
          tapping anywhere removes the meal. aria-label rather than the visible
          title alone, so the action — not just the noun — is announced. */}
      {spokenMeals.length > 0 && (
        <div className="ob-voice__chips">
          {spokenMeals.map((meal) => (
            <button
              key={meal.id}
              type="button"
              className="ob-voice__chip"
              aria-label={`Remove ${meal.title}`}
              onClick={() => removeMeal(meal.id)}
            >
              <span className="ob-voice__chip-label">{meal.title}</span>
              <Icon name="close" className="ob-voice__chip-close" />
            </button>
          ))}
        </div>
      )}

      {!SpeechRecognitionClass && (
        <p className="ob-voice__unsupported">
          This browser doesn't support voice input. Chrome does — or skip this step and add
          meals by hand later.
        </p>
      )}

      {SpeechRecognitionClass && (
        <div className="ob-voice__stage">
          {/* The mascot holds the empty state; once meals start landing the
              chips are the more useful thing to give the space to. */}
          {spokenMeals.length === 0 && (
            <div className="ob-voice__mascot">
              <p className="ob-voice__bubble">You better add pizza!</p>
              <img src={bubbleTail} alt="" aria-hidden="true" className="ob-voice__bubble-tail" />
              <img src={frontPizza} alt="" className="ob-voice__pizza" />
            </div>
          )}

          <div className="ob-voice__mic-group" style={{ bottom: `${micGroupBottom}px` }}>
            <button
              type="button"
              className={'ob-voice__mic' + (listening ? ' ob-voice__mic--active' : '')}
              onClick={listening ? stop : start}
              aria-pressed={listening}
              aria-label={listening ? 'Stop listening' : 'Start listening'}
            >
              <Icon name={listening ? 'pause' : 'mic'} />
            </button>

            {/* Doubles as the live mic readout, since "what to do next" and
                "what the mic is hearing" are the same line. Sits with the
                button rather than in the shelf's curve band, so it stays
                readable against page cream instead of getting swallowed by
                the dome — but outside the group's flow, so a long interim
                transcript can't shove the button it belongs to. */}
            <p className="ob-voice__status">
              {error ? (
                error
              ) : interim ? (
                <span className="ob-voice__interim">{interim}…</span>
              ) : listening ? (
                'Recording, say a meal.'
              ) : spokenMeals.length ? (
                'Tap record to add more meals.'
              ) : (
                'Tap record'
              )}
            </p>
          </div>
        </div>
      )}

      <div
        ref={actionsRef}
        className="ob-step__actions ob-step__actions--shelf ob-step__actions--shelf-low"
      >
        <img ref={curveRef} src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />

        <Button
          variant="primary"
          className="btn--full ob-step__cta"
          onClick={() => {
            stop()
            onNext()
          }}
          disabled={spokenMeals.length === 0}
        >
          <span>
            {spokenMeals.length ? `Add ${spokenMeals.length} Meal${spokenMeals.length === 1 ? '' : 's'}` : 'Add Meals'}
          </span>
        </Button>
        {onSkip && (
          <Button
            variant="text"
            className="ob-step__skip"
            onClick={() => {
              stop()
              onSkip()
            }}
          >
            Skip for now
          </Button>
        )}
      </div>
    </div>
  )
}
