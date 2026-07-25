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

export function ResultMealCard({ meal, categoryName, onClick, className = '' }) {
  return (
    <Card
      className={`meal-card meal-card--result ${className}`.trim()}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <Icon name="chevron_right" className="meal-card__chevron" />
      <p className="eyebrow">{categoryName}</p>
      <h3 className="meal-card__title">{meal.title}</h3>
      <MealCardStats meal={meal} />
    </Card>
  )
}

export function ListMealCard({ id, meal, categoryName, onClick, onEdit }) {
  // True only while a view transition to or from this meal's detail page is in
  // flight, which is what keeps the name unique across the list. It reports both
  // directions, so the same tag drives the open and the close.
  const morphing = useViewTransitionState(`/meals/${meal.id}`)

  return (
    <Card
      id={id}
      className="meal-card meal-card--list"
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={morphing ? { viewTransitionName: MEAL_MORPH_NAME } : undefined}
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
}
