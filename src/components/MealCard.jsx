import { useRef, useState } from 'react'
import { useViewTransitionState } from 'react-router-dom'
import Card from './Card'
import Icon from './Icon'
import IconButton from './IconButton'
import { MEAL_MORPH_NAME } from '../lib/morph'
import { calcCalories } from '../lib/calories'
import './MealCard.css'

function formatTime(cook) {
  if (cook == null) return ''
  return `${cook}m cook`
}

function formatMacros(protein, carbs, fats) {
  if (protein == null && carbs == null && fats == null) return null
  const calories = calcCalories(protein, carbs, fats)
  const parts = [`${calories}cal`]
  if (protein != null) parts.push(`${protein}p`)
  if (carbs != null) parts.push(`${carbs}c`)
  if (fats != null) parts.push(`${fats}f`)
  return parts.join(' ')
}

function MealCardStats({ meal }) {
  const time = formatTime(meal.cook_time)
  const macros = formatMacros(meal.protein_g, meal.carbs_g, meal.fats_g)

  if (!time && !macros) return null

  return (
    <div className="meal-card__stats">
      <span className="meal-card__time">{time}</span>
      {macros && <span className="meal-card__macros">{macros}</span>}
    </div>
  )
}

// `selectable` is the group-decision state: a tap picks this contender instead
// of navigating to it, so the card keeps its normal default and hover states
// and only swaps the chevron — which promises "this opens" — for a check that
// reads as "this is chosen". `aria-pressed` is set only when selectable, since
// a plain result card is a link-like button with no pressed state to report.
export function ResultMealCard({
  meal,
  categoryName,
  onClick,
  className = '',
  selectable = false,
  selected = false,
}) {
  return (
    <Card
      className={`meal-card meal-card--result${selected ? ' meal-card--selected' : ''} ${className}`.trim()}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={selectable ? selected : undefined}
    >
      <Icon
        name={selected ? 'check_circle' : 'chevron_right'}
        className={`meal-card__chevron${selected ? ' meal-card__chevron--selected' : ''}`}
      />
      <p className="eyebrow">{categoryName}</p>
      <h3 className="meal-card__title">{meal.title}</h3>
      <MealCardStats meal={meal} />
    </Card>
  )
}

// How far the card travels to uncover the delete button: the button's own 54px
// plus a 12px gap between it and the card's trailing edge.
const SWIPE_REVEAL = 66
// Drag past this and the card settles open rather than springing back — the
// same distance in reverse closes an already-open card.
const SWIPE_TRIGGER = 24
// Slack before the gesture commits to an axis, so a slightly-off-vertical
// scroll isn't read as a swipe.
const SWIPE_INTENT = 8

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function ListMealCard({
  id,
  meal,
  categoryName,
  onClick,
  onEdit,
  onDelete,
  open = false,
  onOpenChange,
}) {
  // True only while a view transition to or from this meal's detail page is in
  // flight, which is what keeps the name unique across the list. It reports both
  // directions, so the same tag drives the open and the close.
  const morphing = useViewTransitionState(`/meals/${meal.id}`)

  const swipeable = Boolean(onDelete)
  // Live finger position while dragging; null whenever the card is settled, so
  // `open` alone decides where it rests.
  const [drag, setDrag] = useState(null)
  const gesture = useRef(null)
  // Set the moment a drag turns horizontal, and read by the click handler that
  // fires immediately afterwards — a swipe must never navigate to the meal.
  const swipedRef = useRef(false)

  const offset = drag ?? (open ? -SWIPE_REVEAL : 0)
  const dragging = drag != null

  function handlePointerDown(e) {
    if (!swipeable) return
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    // Cleared here rather than only when a click consumes it: a gesture that
    // ends without one (pointer released off the card, say) would otherwise
    // leave the flag set and swallow the next genuine tap.
    swipedRef.current = false
    gesture.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      base: open ? -SWIPE_REVEAL : 0,
      offset: open ? -SWIPE_REVEAL : 0,
      horizontal: false,
    }
  }

  function handlePointerMove(e) {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return

    const dx = e.clientX - g.x
    const dy = e.clientY - g.y

    if (!g.horizontal) {
      if (Math.abs(dx) < SWIPE_INTENT && Math.abs(dy) < SWIPE_INTENT) return
      // Vertical wins: this is a scroll, not a swipe. Drop the gesture so the
      // page keeps the pointer. (On touch, `touch-action: pan-y` usually hands
      // the scroll off before we ever get here and cancels us instead.)
      if (Math.abs(dy) >= Math.abs(dx)) {
        gesture.current = null
        return
      }
      g.horizontal = true
      swipedRef.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }

    g.offset = clamp(g.base + dx, -SWIPE_REVEAL, 0)
    setDrag(g.offset)
  }

  function handlePointerUp() {
    const g = gesture.current
    gesture.current = null
    setDrag(null)
    if (!g?.horizontal) return
    // Open if pulled far enough left; once open, the same distance travelled
    // back to the right closes it again.
    const travelled = -g.offset
    onOpenChange?.(open ? travelled > SWIPE_TRIGGER : travelled >= SWIPE_TRIGGER)
  }

  // Scrolling (and any other interruption the browser signals) abandons the
  // gesture: the card animates back to where it was and the button fades out.
  function handlePointerCancel() {
    gesture.current = null
    setDrag(null)
    onOpenChange?.(false)
  }

  function handleClick() {
    if (swipedRef.current) return
    // An open card's first tap just puts it away.
    if (open) {
      onOpenChange?.(false)
      return
    }
    onClick()
  }

  const card = (
    <Card
      id={swipeable ? undefined : id}
      className={'meal-card meal-card--list' + (dragging ? ' meal-card--dragging' : '')}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      style={{
        ...(morphing ? { viewTransitionName: MEAL_MORPH_NAME } : null),
        ...(swipeable ? { transform: `translateX(${offset}px)` } : null),
      }}
      onPointerDown={swipeable ? handlePointerDown : undefined}
      onPointerMove={swipeable ? handlePointerMove : undefined}
      onPointerUp={swipeable ? handlePointerUp : undefined}
      onPointerCancel={swipeable ? handlePointerCancel : undefined}
    >
      <div className="meal-card__list-actions">
        <IconButton
          name="edit"
          label="Edit meal"
          size={20}
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        />
      </div>
      <p className="eyebrow">{categoryName}</p>
      <h3 className="meal-card__title">{meal.title}</h3>
      <MealCardStats meal={meal} />
    </Card>
  )

  if (!swipeable) return card

  // Progress doubles as the button's opacity, so it fades in with the finger
  // rather than only at the end of the travel.
  const progress = clamp(-offset / SWIPE_REVEAL, 0, 1)

  return (
    <div id={id} className="meal-card-swipe">
      <button
        type="button"
        className={'meal-card-swipe__delete' + (dragging ? ' meal-card-swipe__delete--dragging' : '')}
        aria-label={`Delete ${meal.title}`}
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        style={{ opacity: progress }}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Icon name="delete" className="meal-card-swipe__delete-icon" />
      </button>
      {card}
    </div>
  )
}
