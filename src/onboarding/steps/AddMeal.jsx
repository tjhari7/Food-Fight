import { useState } from 'react'
import Button from '../../components/Button'
import Icon from '../../components/Icon'
import IconButton from '../../components/IconButton'
import curveShape from '../../assets/Curve_Shape.svg'
import { useOnboarding } from '../OnboardingContext.jsx'
import { ONBOARDING_CATEGORIES } from '../starterMeals'

const emptyIngredient = () => ({ name: '', amount: '' })

// Variant A's dedicated manual-entry screen. It comes last of the three
// roster-building steps because it's the slowest, and by now the user has seen
// what a complete meal looks like in the starter pack.
//
// Variant B drops this screen and teaches the same thing from a voice chip.
export default function AddMeal({ onNext, onSkip }) {
  const { addManualMeal } = useOnboarding()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [ingredients, setIngredients] = useState([emptyIngredient()])

  function updateIngredient(index, field, value) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    )
  }

  function save() {
    if (!title.trim()) return
    addManualMeal({
      title: title.trim(),
      category: category || null,
      cook_time: cookTime === '' ? null : Number(cookTime),
      ingredients: ingredients.filter((ing) => ing.name.trim()),
    })
    onNext()
  }

  return (
    <div className="ob-step">
      <div className="ob-step__head">
        <h1 className="ob-step__title">Add One Of Your Own</h1>
        <p className="ob-step__body">
          Something you actually cook. The more detail you add, the better the filters work
          later.
        </p>
      </div>

      <div className="ob-form">
        <div className="ob-field">
          <label className="ob-field__label" htmlFor="ob-title">
            Meal name
          </label>
          <input
            id="ob-title"
            className="ob-field__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sunday roast"
          />
        </div>

        <div className="ob-field">
          <label className="ob-field__label" htmlFor="ob-category">
            Meal type
          </label>
          <select
            id="ob-category"
            className="ob-field__select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Unassigned</option>
            {ONBOARDING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="ob-field">
          <label className="ob-field__label" htmlFor="ob-cook">
            Cook time (minutes)
          </label>
          <input
            id="ob-cook"
            className="ob-field__input"
            type="number"
            inputMode="numeric"
            min="0"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            placeholder="30"
          />
        </div>

        <div className="ob-field">
          <span className="ob-field__label">Ingredients</span>
          {ingredients.map((ing, i) => (
            <div key={i} className="ob-field__row">
              <input
                className="ob-field__input"
                value={ing.name}
                onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                placeholder="Ingredient"
                aria-label={`Ingredient ${i + 1} name`}
              />
              <IconButton
                name="close"
                label={`Remove ingredient ${i + 1}`}
                onClick={() =>
                  setIngredients((prev) =>
                    prev.length === 1 ? [emptyIngredient()] : prev.filter((_, j) => j !== i)
                  )
                }
              />
            </div>
          ))}
          <Button
            variant="text"
            className="ob-form__ingredient-add"
            onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
          >
            <Icon name="add" /> Add ingredient
          </Button>
        </div>
      </div>

      <div className="ob-step__actions ob-step__actions--shelf">
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <Button
          variant="primary"
          className="btn--full ob-step__cta"
          onClick={save}
          disabled={!title.trim()}
        >
          <span>Save Meal</span>
        </Button>
        {onSkip && (
          <Button variant="text" className="ob-step__skip" onClick={onSkip}>
            Skip for now
          </Button>
        )}
      </div>
    </div>
  )
}
