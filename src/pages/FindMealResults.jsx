import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { ResultMealCard } from '../components/MealCard'
import { shuffle } from '../lib/random'
import { MAIN_EVENT_HEADLINES, pickNextHeadline } from '../lib/mainEventHeadlines'
import { mealMatchesIngredients } from '../lib/ingredientMatch'
import { prefersReducedMotion, useSwipeBackHome } from '../lib/swipeBack'
import BackHeader from '../components/BackHeader'
import Button from '../components/Button'
import leftSquiggle from '../assets/Left_Bolt.svg'
import rightSquiggle from '../assets/Right_Bolt.svg'
import fistImage from '../assets/Main_Event_Fist_Fight_01.png'
import refreshIcon from '../assets/Icon_Refresh_Round.svg'
import './FindMealResults.css'

function matchesFilters(meal, filters) {
  if (filters.categoryIds?.length && !filters.categoryIds.includes(meal.category_id)) return false
  if (!mealMatchesIngredients(meal, filters.ingredientTerms)) return false
  return true
}

export default function FindMealResults() {
  const { meals, categories, loading } = useData()
  const navigate = useNavigate()
  const location = useLocation()

  const filters = location.state?.filters || {}
  const incomingPicks = location.state?.picks || null
  const incomingExclusion = location.state?.exclusionIds || []

  const [currentPickIds, setCurrentPickIds] = useState(incomingPicks)
  const [exclusionIds, setExclusionIds] = useState(new Set(incomingExclusion))
  const [headline, setHeadline] = useState(MAIN_EVENT_HEADLINES[0])
  const [phase, setPhase] = useState('idle') // 'idle' | 'exit' | 'enter' | 'leave'
  const headlineQueueRef = useRef([])
  const { leaving, startBack, rootProps, leavingClass } = useSwipeBackHome()

  // Frozen at mount: clearing the flag below must not retract the class
  // mid-animation. Only the winner sits to this page's right, so a back swipe
  // always slides this page in from the left.
  const [swipingBackIn] = useState(() => Boolean(location.state?.swipeBack))
  const arrivalStateRef = useRef(location.state)

  // Enter and leave both animate `.page > *`, so whichever rule sits later in
  // index.css would silently swallow the other — keep exactly one on the
  // element. The slide-in also outranks .results-page__body's results-enter, so
  // a return from the winner pans across rather than replaying the fade-up.
  const enteringClass = swipingBackIn && !leaving ? ' swipe-entering-from-left' : ''

  // Drop the back-nav flag once consumed — keeping the round it carried home —
  // so a reload doesn't replay the slide-in.
  useEffect(() => {
    if (!swipingBackIn) return
    const { swipeBack: _flag, enterFrom: _side, ...round } = arrivalStateRef.current || {}
    navigate('.', { replace: true, state: round })
  }, [swipingBackIn, navigate])

  const categoryNameById = useMemo(() => {
    const map = {}
    for (const c of categories) map[c.id] = c.name
    return map
  }, [categories])

  const filteredPool = useMemo(() => {
    const hasIngredientMatch = filters.ingredientTerms?.length
      ? meals.some((m) => mealMatchesIngredients(m, filters.ingredientTerms))
      : true
    const effectiveFilters = hasIngredientMatch ? filters : { ...filters, ingredientTerms: [] }
    return meals.filter((m) => matchesFilters(m, effectiveFilters))
  }, [meals, filters])

  const targetCount = Math.min(2, filteredPool.length)

  useEffect(() => {
    if (loading) return
    if (currentPickIds === null && filteredPool.length > 0) {
      const picked = shuffle(filteredPool).slice(0, targetCount)
      setCurrentPickIds(picked.map((m) => m.id))
    }
  }, [loading, filteredPool, currentPickIds, targetCount])

  const currentPicks = useMemo(() => {
    if (!currentPickIds) return []
    return currentPickIds.map((id) => meals.find((m) => m.id === id)).filter(Boolean)
  }, [currentPickIds, meals])

  function swapRound() {
    const newExclusion = new Set([...exclusionIds, ...(currentPickIds || [])])
    let available = filteredPool.filter((m) => !newExclusion.has(m.id))
    let finalExclusion = newExclusion

    if (available.length < targetCount) {
      finalExclusion = new Set()
      available = filteredPool
    }

    const picked = shuffle(available).slice(0, targetCount)
    setCurrentPickIds(picked.map((m) => m.id))
    setExclusionIds(finalExclusion)

    const { headline: nextHeadline, queue } = pickNextHeadline(headline.id, headlineQueueRef.current)
    headlineQueueRef.current = queue
    setHeadline(nextHeadline)
  }

  function handleReroll() {
    if (phase !== 'idle' || leaving) return
    // Reduced motion: swap instantly — the animationend that drives the
    // phase machine never fires when animations are disabled.
    if (prefersReducedMotion()) {
      swapRound()
      return
    }
    setPhase('exit')
  }

  function handleBack() {
    // Don't cut in on a New Round swipe that is already mid-flight.
    if (phase !== 'idle') return
    startBack()
  }

  // Drives the swipe: content slides out left, then new content slides in from
  // the right. Bound to a single element so the swap fires exactly once.
  function handleSwipeEnd(e) {
    if (!e.animationName.startsWith('results-swipe')) return
    if (phase === 'exit') {
      swapRound()
      setPhase('enter')
    } else if (phase === 'enter') {
      setPhase('idle')
    }
  }

  const swipeClass = phase === 'idle' ? '' : `results__swipe--${phase}`

  function handleCardClick(meal) {
    navigate(`/meals/${meal.id}`, {
      state: {
        fromMainEvent: true,
        returnTo: {
          pathname: '/find/results',
          state: {
            filters,
            picks: currentPickIds,
            exclusionIds: Array.from(exclusionIds),
          },
        },
      },
    })
  }

  return (
    <div className={`page results-page${enteringClass}${leavingClass}`} {...rootProps}>
      <div className="page-header">
        <BackHeader onBack={handleBack} />
      </div>

      <div className="results-page__body">
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

          {loading && <p className="eyebrow">Loading…</p>}

          {!loading && filteredPool.length === 0 && (
            <div className="results__empty">
              <p>No meals match those filters.</p>
              <Button variant="secondary" onClick={() => navigate('/')}>
                Adjust Filters
              </Button>
            </div>
          )}

          {!loading && filteredPool.length > 0 && (
            <div className="results__grid">
              {currentPicks.map((meal, index) => (
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
                    categoryName={categoryNameById[meal.category_id] || 'Unassigned'}
                    onClick={() => handleCardClick(meal)}
                    className={swipeClass}
                  />
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {!loading && filteredPool.length > 0 && (
          <Button variant="secondary" className="btn--full results__reroll" onClick={handleReroll}>
            <img src={refreshIcon} alt="" className="results__reroll-icon" /> <span className="results__reroll-label">New Round</span>
          </Button>
        )}
      </div>
    </div>
  )
}
