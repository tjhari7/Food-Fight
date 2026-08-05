import { Fragment, useEffect, useRef, useState } from 'react'
import { ResultMealCard } from '../../components/MealCard'
import Button from '../../components/Button'
import { shuffle } from '../../lib/random'
import { MAIN_EVENT_HEADLINES, pickNextHeadline } from '../../lib/mainEventHeadlines'
import { prefersReducedMotion } from '../../lib/swipeBack'
import { useOnboarding } from '../OnboardingContext.jsx'
import leftSquiggle from '../../assets/Left_Bolt.svg'
import rightSquiggle from '../../assets/Right_Bolt.svg'
import fistImage from '../../assets/Main_Event_Fist_Fight_01.png'
import refreshIcon from '../../assets/Icon_Refresh_Round.svg'
import curveShape from '../../assets/Curve_Shape.svg'
import '../../pages/FindMealResults.css'

// The real Main Event, running on the roster the user just built (variant A) or
// on the silently-seeded starter pack (variant B).
//
// New Round is NOT a separate step in either flow. It and crowning a winner are
// two affordances on this one screen — trying to order them as screens was the
// original mistake. Reroll is a rejection gesture, so it can't be taught before
// the user has felt the urge to reject; instead both are live, New Round carries
// a first-run hint, and the Champion screen offers a rematch for anyone who
// crowned immediately.
export default function MainEvent({ onNext, flow }) {
  const { meals, setWinner, addStarterPack, lastFight, setLastFight } = useOnboarding()
  const [pickIds, setPickIds] = useState(null)
  const [seenIds, setSeenIds] = useState(() => new Set())
  const [headline, setHeadline] = useState(MAIN_EVENT_HEADLINES[0])
  const [phase, setPhase] = useState('idle') // 'idle' | 'exit' | 'enter'
  const headlineQueueRef = useRef([])

  const targetCount = Math.min(2, meals.length)

  // The skip-everything fallback. Skipping a roster step means "not now", not
  // "never give me meals" — so the starter pack lands here if, and only if, the
  // roster would otherwise be empty. Skipping the pack but speaking five meals
  // still leaves you with five.
  useEffect(() => {
    if (meals.length === 0) addStarterPack()
  }, [meals.length, addStarterPack])

  useEffect(() => {
    if (pickIds !== null || meals.length === 0) return

    // Remounting after a Rematch tap: keep the loser, redraw one challenger,
    // and sit the winner out — same reasoning as the real Main Event page.
    if (lastFight) {
      const loser = meals.find((m) => m.id === lastFight.loserId)
      if (loser) {
        let pool = meals.filter((m) => m.id !== lastFight.loserId && m.id !== lastFight.winnerId)
        if (pool.length === 0) pool = meals.filter((m) => m.id !== lastFight.loserId)
        const challenger = shuffle(pool)[0]
        if (challenger) {
          // Challenger up top, loser held in the second slot — so the meal
          // that's still in play visibly sits below the VS, not above it.
          setPickIds([challenger.id, loser.id])
          return
        }
      }
      // Loser no longer in the roster (e.g. deleted) — fall through below.
    }

    // Variant B's first fight is scripted rather than random: Tacos vs Burgers
    // is the matchup the flow was demoed with, so new users see that exact
    // fight before the roster opens up to shuffled pairs on reroll.
    if (flow?.id === 'b' && targetCount === 2 && !lastFight) {
      const tacos = meals.find((m) => m.title.toLowerCase() === 'tacos')
      const burgers = meals.find((m) => m.title.toLowerCase() === 'burgers')
      if (tacos && burgers) {
        setPickIds([tacos.id, burgers.id])
        return
      }
    }

    setPickIds(shuffle(meals).slice(0, targetCount).map((m) => m.id))
  }, [meals, pickIds, targetCount, flow, lastFight])

  const picks = (pickIds || []).map((id) => meals.find((m) => m.id === id)).filter(Boolean)

  function swapRound() {
    const seen = new Set([...seenIds, ...(pickIds || [])])
    let available = meals.filter((m) => !seen.has(m.id))
    let nextSeen = seen

    // Exhausted the roster — start the rotation over rather than running dry.
    if (available.length < targetCount) {
      nextSeen = new Set()
      available = meals
    }

    setPickIds(shuffle(available).slice(0, targetCount).map((m) => m.id))
    setSeenIds(nextSeen)

    const { headline: next, queue } = pickNextHeadline(headline.id, headlineQueueRef.current)
    headlineQueueRef.current = queue
    setHeadline(next)
  }

  function handleReroll() {
    if (phase !== 'idle') return
    // Reduced motion disables the animations the phase machine listens for, so
    // swap straight away instead of waiting for an animationend that never fires.
    if (prefersReducedMotion()) {
      swapRound()
      return
    }
    setPhase('exit')
  }

  function advancePhase() {
    if (phase === 'exit') {
      swapRound()
      setPhase('enter')
    } else if (phase === 'enter') {
      setPhase('idle')
    }
  }

  function handleSwipeEnd(e) {
    if (!e.animationName.startsWith('results-swipe')) return
    advancePhase()
  }

  // Chrome doesn't deliver animationend while the document is hidden, so a user
  // who switches tabs mid-reroll comes back to a screen frozen half-swiped with
  // no way forward. The event still drives the swap when it arrives; this only
  // catches the case where it never does. Cleanup clears the timer as soon as
  // the phase moves, so the two paths can't both fire.
  useEffect(() => {
    if (phase === 'idle') return undefined
    const timer = setTimeout(advancePhase, phase === 'exit' ? 400 : 700)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function crown(meal) {
    if (phase !== 'idle') return
    const loser = picks.find((m) => m.id !== meal.id)
    setLastFight(loser ? { winnerId: meal.id, loserId: loser.id } : null)
    setWinner(meal)
    onNext()
  }

  const swipeClass = phase === 'idle' ? '' : `results__swipe--${phase}`

  return (
    <div className="ob-step ob-step--flush">
      <div className="ob-fight__body">
        <div className="results__stage">
          <img src={fistImage} alt="" className="results__hero-image" />
          <h1 className={`results__title ${swipeClass}`.trim()} onAnimationEnd={handleSwipeEnd}>
            {headline.lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>

          <div className="results__grid">
            {picks.map((meal, index) => (
              <Fragment key={meal.id}>
                {index === 1 && (
                  <div className="results__vs">
                    <img src={leftSquiggle} alt="" className="results__vs-squiggle" />
                    <span>VS</span>
                    <img src={rightSquiggle} alt="" className="results__vs-squiggle" />
                  </div>
                )}
                <ResultMealCard
                  meal={meal}
                  categoryName={meal.category || 'Unassigned'}
                  onClick={() => crown(meal)}
                  className={swipeClass}
                />
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Both affordances live on the shelf: the caption names the choice, and
          the button underneath is the way out of it. */}
      <div className="ob-step__actions ob-step__actions--shelf">
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <p className="ob-step__caption">
          Choose your champion.
          <br />
          Not feeling either? Try a new round.
        </p>
        <Button variant="secondary" className="btn--full results__reroll" onClick={handleReroll}>
          <img src={refreshIcon} alt="" className="results__reroll-icon" />{' '}
          <span className="results__reroll-label">New Round</span>
        </Button>
      </div>
    </div>
  )
}
