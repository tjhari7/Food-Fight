import { useState } from 'react'
import { useParams, useNavigate, useLocation, useViewTransitionState } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { deleteMeal } from '../api/meals'
import { getDisplayNumber } from '../lib/displayNumber'
import { MEAL_MORPH_NAME, shouldMorph } from '../lib/morph'
import { getNextWinnerHeadline } from '../lib/winnerHeadlines'
import { useSwipeBackTo } from '../lib/swipeBack'
import { calcCalories } from '../lib/calories'
import BackHeader from '../components/BackHeader'
import IconButton from '../components/IconButton'
import ConfirmDialog from '../components/ConfirmDialog'
import Card from '../components/Card'
import curveShape from '../assets/Curve_Shape.svg'
import impactWinner from '../assets/Impact_Winner_Meal.svg'
import './MealDetail.css'

export default function MealDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { meals, categories, loading, reload } = useData()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const returnTo = location.state?.returnTo
  const fromMainEvent = Boolean(location.state?.fromMainEvent)
  const [winnerHeadline] = useState(() => (fromMainEvent ? getNextWinnerHeadline() : null))

  // Only the meal list has a card to morph with. Arrivals from the main event
  // run their own entrance (winner-enter in MealDetail.css), and no transition
  // is started for them, so this stays false and leaves that animation alone.
  const morphing = useViewTransitionState(`/meals/${id}`)

  // The winner sits to the main event's right on the page strip, so it exits
  // right and hands back to the main event sliding in from the left — the same
  // gesture as the main event's own back to Home. Detail views opened from the
  // meal list morph back into their card instead and never start this.
  const { startBack, rootProps, leavingClass } = useSwipeBackTo(
    returnTo?.pathname || '/',
    'right',
    returnTo?.state
  )

  const meal = meals.find((m) => m.id === id)
  const category = categories.find((c) => c.id === meal?.category_id)

  function goBack() {
    if (winnerHeadline) {
      // Winner view: the X closes out the round and refreshes the app home.
      window.location.assign('/')
      return
    }
    if (fromMainEvent && returnTo) {
      startBack()
      return
    }
    if (!returnTo) {
      navigate('/')
      return
    }
    navigate(returnTo.pathname, {
      state: returnTo.state,
      viewTransition: returnTo.pathname === '/meals' && shouldMorph(),
    })
  }

  function handleEdit() {
    // Preserve fromMainEvent so Cancel/Save return to the winner view (with its
    // headline), not a plain detail page.
    navigate(`/meals/${id}/edit`, {
      state: { returnTo: { pathname: `/meals/${id}`, state: { fromMainEvent, returnTo } } },
    })
  }

  async function handleConfirmDelete() {
    await deleteMeal(id)
    await reload()
    setConfirmingDelete(false)
    if (returnTo) navigate(returnTo.pathname, { state: returnTo.state, replace: true })
    else navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <div className="page">
        <p className="eyebrow">Loading…</p>
      </div>
    )
  }

  if (!meal) {
    return (
      <div className={`page${leavingClass}`} {...rootProps}>
        <div className="page-header">
          <BackHeader onBack={goBack} />
        </div>
        <p>Meal not found.</p>
      </div>
    )
  }

  const displayNumber = getDisplayNumber(meals, meal.id)
  const hasMacros = meal.protein_g != null || meal.carbs_g != null || meal.fats_g != null
  const calories = hasMacros
    ? calcCalories(meal.protein_g, meal.carbs_g, meal.fats_g)
    : null

  return (
    <div
      className={`page${winnerHeadline ? ' detail-page--winner' : ''}${leavingClass}`}
      {...rootProps}
    >
      <div className="page-header">
        <BackHeader onBack={goBack} icon={winnerHeadline ? 'close' : 'chevron_left'} label={winnerHeadline ? 'Close' : 'Back'} />
        <div className="detail__header-actions">
          <IconButton
            name="edit"
            label="Edit meal"
            size={20}
            className="icon-btn--filled"
            onClick={handleEdit}
          />
          {!winnerHeadline && (
            <IconButton
              name="delete"
              label="Delete meal"
              size={20}
              className="icon-btn--filled icon-btn--danger"
              onClick={() => setConfirmingDelete(true)}
            />
          )}
        </div>
      </div>

      {winnerHeadline && (
        <>
          <img
            src={impactWinner}
            alt=""
            aria-hidden="true"
            className="detail__winner-impact"
          />
          <h1 className={`detail__winner-title ${winnerHeadline.className}`}>
            {winnerHeadline.lines
              ? winnerHeadline.lines.map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))
              : winnerHeadline.text}
          </h1>
        </>
      )}

      <Card
        className={`detail__card ${winnerHeadline ? 'detail__card--winner' : ''}`.trim()}
        style={morphing ? { viewTransitionName: MEAL_MORPH_NAME } : undefined}
      >
        {winnerHeadline && (
          <img src={curveShape} alt="" aria-hidden="true" className="detail__winner-curve" />
        )}
        <p className="eyebrow">{category?.name || 'Unassigned'}</p>
        <h1 className="detail__title">{meal.title}</h1>

        <div className="detail__times">
          {meal.prep_time != null && (
            <span>
              <span className="eyebrow">Prep</span> {meal.prep_time} min
            </span>
          )}
          {meal.cook_time != null && (
            <span>
              <span className="eyebrow">Cook</span> {meal.cook_time} min
            </span>
          )}
        </div>

        {hasMacros && (
          <section className="detail__section">
            <h2 className="detail__section-title">Nutritional Facts</h2>
            <div className="detail__macros">
              {calories != null && (
                <div>
                  <p className="eyebrow">Calories</p>
                  <p>{calories}</p>
                </div>
              )}
              {meal.protein_g != null && (
                <div>
                  <p className="eyebrow">Protein</p>
                  <p>{meal.protein_g}g</p>
                </div>
              )}
              {meal.carbs_g != null && (
                <div>
                  <p className="eyebrow">Carbs</p>
                  <p>{meal.carbs_g}g</p>
                </div>
              )}
              {meal.fats_g != null && (
                <div>
                  <p className="eyebrow">Fats</p>
                  <p>{meal.fats_g}g</p>
                </div>
              )}
            </div>
          </section>
        )}

        {meal.ingredients?.length > 0 && (
          <section className="detail__section">
            <h2 className="detail__section-title">Ingredients</h2>
            <ul className="detail__ingredients">
              {meal.ingredients.map((ing, i) => (
                <li key={i}>
                  <span>{ing.name}</span>
                  {ing.amount && <span className="detail__ingredient-amount">{ing.amount}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="detail__number">{displayNumber}</p>
      </Card>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this meal?"
        message={`"${meal.title}" will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  )
}
