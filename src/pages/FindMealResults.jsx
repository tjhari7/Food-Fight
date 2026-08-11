import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { ResultMealCard } from '../components/MealCard'
import { shuffle } from '../lib/random'
import { MAIN_EVENT_HEADLINES, pickNextHeadline, pickGroupHeadline } from '../lib/mainEventHeadlines'
import { mealMatchesIngredients } from '../lib/ingredientMatch'
import { prefersReducedMotion, useSwipeBackHome } from '../lib/swipeBack'
import { useGroupJudges, formatJudges, buildInviteLink } from '../lib/groupDecision'
import BackHeader from '../components/BackHeader'
import Button from '../components/Button'
import IconButton from '../components/IconButton'
import GroupDrawer from '../components/GroupDrawer'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import leftSquiggle from '../assets/Left_Bolt.svg'
import rightSquiggle from '../assets/Right_Bolt.svg'
import fistImage from '../assets/Main_Event_Fist_Fight_01.webp'
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
  // Set only when arriving back from a Rematch tap on the winner view — the
  // signal that this mount should keep the loser and draw one new challenger
  // rather than replay (or fully reshuffle) the standing pair.
  const incomingWinnerId = location.state?.winnerId || null
  const incomingLoserId = location.state?.loserId || null
  const isRematch = Boolean(incomingLoserId)

  const [currentPickIds, setCurrentPickIds] = useState(isRematch ? null : incomingPicks)
  const [exclusionIds, setExclusionIds] = useState(() => {
    const base = new Set(incomingExclusion)
    // The winner is the meal a rematch is rejecting (often for lack of
    // ingredients) — keep it out of the challenger draw until the pool
    // rotates past it.
    if (incomingWinnerId) base.add(incomingWinnerId)
    return base
  })
  // A round arrived at with judges already watching (a rematch) opens on a group
  // headline, since the tap that would otherwise have drawn one happened on the
  // previous round.
  const [headline, setHeadline] = useState(() =>
    location.state?.groupActive ? pickGroupHeadline(null) : MAIN_EVENT_HEADLINES[0]
  )
  const [phase, setPhase] = useState('idle') // 'idle' | 'exit' | 'enter' | 'leave'
  const headlineQueueRef = useRef([])
  const { leaving, startBack, rootProps, leavingClass } = useSwipeBackHome()

  // Group decision. Entirely client-side — see lib/groupDecision.js. `active`
  // is what locks the round: once judges are in, the standing matchup is the
  // thing being voted on, so it can't be rerolled or crowned by hand.
  //
  // Restored on arrival rather than started fresh: the judges are all holding
  // the same invite link, so a rematch is the same room watching a new round,
  // not a new group. The tally rides along with the flag and is frozen at mount
  // so the state-replace below (which drops the swipe flags) can't reset it.
  const [groupActive, setGroupActive] = useState(() => Boolean(location.state?.groupActive))
  const [resumeJudgeCount] = useState(() => location.state?.judgeCount || 0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  // The host's own pick while a group is running. Exclusive and re-selectable
  // — tapping the other contender moves the choice rather than adding to it,
  // so the host can go back and forth before calling the fight.
  const [selectedId, setSelectedId] = useState(null)
  const judgeCount = useGroupJudges(groupActive, resumeJudgeCount)

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
    if (currentPickIds !== null || filteredPool.length === 0) return

    if (isRematch) {
      const loserMeal = filteredPool.find((m) => m.id === incomingLoserId)
      if (loserMeal) {
        let pool = filteredPool.filter((m) => m.id !== incomingLoserId && !exclusionIds.has(m.id))
        // Exhausted the rotation — let it wrap rather than getting stuck.
        if (pool.length === 0) pool = filteredPool.filter((m) => m.id !== incomingLoserId)
        const challenger = shuffle(pool)[0]
        if (challenger) {
          // Challenger up top, loser held in the second slot — so the meal
          // that's still in play visibly sits below the VS, not above it.
          setCurrentPickIds([challenger.id, loserMeal.id])
          // Judges are still watching a resumed group round, so a rematch draws
          // another group headline rather than falling back to the solo set —
          // the mount-time draw above only covers the very first render, not
          // every round this effect turns over afterward.
          if (groupActive) {
            setHeadline(pickGroupHeadline(headline.id))
          } else {
            const { headline: nextHeadline, queue } = pickNextHeadline(headline.id, headlineQueueRef.current)
            headlineQueueRef.current = queue
            setHeadline(nextHeadline)
          }
          return
        }
      }
      // Loser got filtered out (or no candidates at all) — fall back to a
      // fresh shuffle below rather than leaving the round unresolved.
    }

    const picked = shuffle(filteredPool).slice(0, targetCount)
    setCurrentPickIds(picked.map((m) => m.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, filteredPool, currentPickIds, targetCount, isRematch, incomingLoserId, exclusionIds, groupActive])

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
    // The button is swapped out for Fight Decision while a group is running,
    // so this is unreachable then — belt and braces against a stray keyboard
    // activation landing on a stale handler mid-transition.
    if (phase !== 'idle' || leaving || groupActive) return
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

  // A group decision needs two contenders to decide between. A one-meal pool
  // (or a pool still loading) has no fight to judge, so the entry point isn't
  // offered at all rather than opening a drawer that can't lead anywhere.
  const canFight = !loading && currentPicks.length === 2

  // The one route to the winner view. Both ways of settling a fight — a
  // hand-crowned tap and a group's Fight Decision — land here, and the judges
  // flag is the only thing that tells them apart downstream.
  function goToWinner(meal) {
    const loser = currentPicks.find((m) => m.id !== meal.id)
    navigate(`/meals/${meal.id}`, {
      state: {
        fromMainEvent: true,
        // While a group is running, Fight Decision is the only thing that can
        // crown (a card tap just moves the host's pick), so this marks exactly
        // the judges' wins — which get a fixed headline instead of a random one.
        judgesDecision: groupActive,
        returnTo: {
          pathname: '/find/results',
          state: {
            filters,
            picks: currentPickIds,
            exclusionIds: Array.from(exclusionIds),
            winnerId: meal.id,
            loserId: loser ? loser.id : null,
            // A rematch resumes the same fight, so the group returns with it:
            // the flag alone would restart the tally at one judge.
            groupActive,
            judgeCount,
          },
        },
      },
    })
  }

  // Outside a group a tap crowns the meal outright. Inside one the round
  // belongs to the judges, so the same tap only records the host's pick.
  function handleCardClick(meal) {
    if (groupActive) {
      setSelectedId(meal.id)
      return
    }
    goToWinner(meal)
  }

  // Calling the fight. The judges are decoration: the outcome is a coin flip
  // between the two standing picks, with no tally behind it.
  function handleFightDecision() {
    if (currentPicks.length === 0 || leaving) return
    goToWinner(currentPicks[Math.floor(Math.random() * currentPicks.length)])
  }

  // Tapping the group icon is the activation itself — no separate invite
  // step. The drawer always opens already ACTIVE; Copy Link and Share Link
  // are just ways to hand out a link to a group that already exists.
  function handleOpenGroupDrawer() {
    if (!groupActive) {
      setGroupActive(true)
      // The round stops being a solo pick the moment judges are in, so the
      // headline changes with it. Only on the activating tap — reopening the
      // drawer to copy the link mustn't reshuffle the header underneath it.
      setHeadline(pickGroupHeadline(null))
    }
    setDrawerOpen(true)
  }

  async function handleCopyLink() {
    const link = buildInviteLink()
    try {
      await navigator.clipboard.writeText(link)
      setToastMessage('Link copied.')
    } catch {
      // Clipboard access is refused on insecure origins and in some embedded
      // webviews. Nothing else to fall back to here.
      setToastMessage("Couldn't copy link.")
    }
  }

  async function handleShareLink() {
    const link = buildInviteLink()
    if (!navigator.share) {
      handleCopyLink()
      return
    }
    try {
      await navigator.share({
        title: 'Food Fight',
        text: 'Judge this fight — which one should we make?',
        url: link,
      })
      setToastMessage('Link shared.')
    } catch {
      // Covers the user dismissing the share sheet (AbortError) — not an
      // error, just no link went out.
    }
  }

  function handleCancelGroup() {
    setGroupActive(false)
    setConfirmingCancel(false)
    setDrawerOpen(false)
    // Cards go back to being the way to crown a winner, so a stale red check
    // must not survive into the ungrouped round.
    setSelectedId(null)
    // The judges just left, so hand the header back to the solo set rather than
    // leaving it crediting a room that isn't there. Picks up the solo rotation
    // where it stood when the group started.
    const { headline: nextHeadline, queue } = pickNextHeadline(headline.id, headlineQueueRef.current)
    headlineQueueRef.current = queue
    setHeadline(nextHeadline)
  }

  return (
    <div className={`page results-page${enteringClass}${leavingClass}`} {...rootProps}>
      <div className="page-header">
        <BackHeader onBack={handleBack} />

        {/* Judge count, centred between the two round buttons. Hidden while
            the drawer is open — the sheet is already saying everything the
            pill says, and it would sit behind the scrim regardless. */}
        {groupActive && !drawerOpen && (
          <span className="results__judges" aria-live="polite">
            {formatJudges(judgeCount)}
          </span>
        )}

        {canFight && (
          <IconButton
            name="group_add"
            label={groupActive ? 'Group decision — manage' : 'Start a group decision'}
            size={20}
            className={`icon-btn--filled${groupActive ? ' icon-btn--icon-filled' : ''}`}
            onClick={handleOpenGroupDrawer}
          />
        )}
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
                    selectable={groupActive}
                    selected={groupActive && selectedId === meal.id}
                  />
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {/* One button, two jobs. With a group running the round is settled by
            calling the fight, not by drawing a new one — so New Round is
            replaced rather than disabled alongside it. The refresh glyph goes
            with it: it means "another one", which is the opposite of what this
            button now does. */}
        {!loading && filteredPool.length > 0 && (
          groupActive ? (
            <>
              <p className="results__fight-note">
                Wait until everyone has voted, then call the fight. All judges will be notified of the winner.
              </p>
              <Button
                variant="secondary"
                className="btn--full results__reroll"
                onClick={handleFightDecision}
              >
                <span className="results__reroll-label">Fight Decision</span>
              </Button>
            </>
          ) : (
            <Button variant="secondary" className="btn--full results__reroll" onClick={handleReroll}>
              <img src={refreshIcon} alt="" className="results__reroll-icon" /> <span className="results__reroll-label">New Round</span>
            </Button>
          )
        )}
      </div>

      {/* Outside .results-page__body on purpose: that element keeps a
          transform from its entrance animation (results-enter, fill `both`),
          and any non-none transform makes it the containing block for
          `position: fixed` descendants — which would strand the drawer and
          the toast inside a 320px column instead of pinning them to the
          screen (or, on desktop, the device frame). */}
      <GroupDrawer
        open={drawerOpen}
        active={groupActive}
        onClose={() => setDrawerOpen(false)}
        onCopyLink={handleCopyLink}
        onShareLink={handleShareLink}
        onCancelGroup={() => setConfirmingCancel(true)}
      />

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this group decision?"
        message="Every judge loses this fight and you'll have to start over."
        confirmLabel="Cancel"
        cancelLabel="Nevermind"
        onConfirm={handleCancelGroup}
        onCancel={() => setConfirmingCancel(false)}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  )
}
