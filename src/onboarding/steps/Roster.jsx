import Button from '../../components/Button'
import Icon from '../../components/Icon'
import curveShape from '../../assets/Curve_Shape.svg'
import { useOnboarding } from '../OnboardingContext.jsx'

const SOURCE_LABEL = {
  starter: 'Starter',
  voice: 'Spoken',
  manual: 'Custom',
}

// Variant A's confirmation screen, and the reason a separate "All Meals preview"
// step doesn't exist: this is the All Meals layout running in onboarding
// context, so the user learns where their roster lives by standing in it.
//
// Remove-only by design. An add button here would quietly turn the summary into
// a second meal editor, and the back button already covers "I missed something".
export default function Roster({ onNext }) {
  const { meals, counts, removeMeal } = useOnboarding()

  return (
    <div className="ob-step ob-step--fill">
      <div className="ob-step__head">
        <h1 className="ob-step__title">Your Roster</h1>
        <div className="ob-roster__counts">
          {counts.starter > 0 && (
            <span className="ob-roster__count">
              <b>{counts.starter}</b> starter
            </span>
          )}
          {counts.voice > 0 && (
            <span className="ob-roster__count">
              <b>{counts.voice}</b> spoken
            </span>
          )}
          {counts.manual > 0 && (
            <span className="ob-roster__count">
              <b>{counts.manual}</b> custom
            </span>
          )}
          <span className="ob-roster__count">
            <b>{counts.total}</b> total
          </span>
        </div>
      </div>

      {meals.length === 0 ? (
        <p className="ob-step__body">
          Nothing in the roster yet. Go back to add some meals, or continue and the{' '}
          {SOURCE_LABEL.starter.toLowerCase()} pack will be added for you.
        </p>
      ) : (
        <div className="ob-roster__list">
          {meals.map((meal) => (
            <div key={meal.id} className="ob-roster__row">
              <div className="ob-roster__row-main">
                <span className="ob-roster__row-title">{meal.title}</span>
                <span className="ob-roster__row-meta">
                  {SOURCE_LABEL[meal.source]}
                  {meal.category ? ` · ${meal.category}` : ''}
                  {meal.cook_time != null ? ` · ${meal.cook_time}m` : ''}
                </span>
              </div>
              <button
                type="button"
                className="ob-roster__row-remove"
                aria-label={`Remove ${meal.title}`}
                onClick={() => removeMeal(meal.id)}
              >
                <Icon name="close" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="ob-step__actions ob-step__actions--shelf">
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <Button variant="primary" className="btn--full ob-step__cta" onClick={onNext}>
          <span>Start Fighting</span>
        </Button>
      </div>
    </div>
  )
}
