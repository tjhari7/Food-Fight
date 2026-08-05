import Button from '../../components/Button'
import curveShape from '../../assets/Curve_Shape.svg'
import { useOnboarding } from '../OnboardingContext.jsx'
import { STARTER_COUNT, STARTER_PREVIEW, buildStarterMeals } from '../starterMeals'

// Variant A's second screen. It goes first among the three roster-building
// steps because it costs one tap and needs no permission — which stops the two
// slower steps that follow from reading as homework.
//
// Variant B never renders this: the pack is seeded silently so the first fight
// has something to draw from.
export default function StarterPack({ onNext, onSkip }) {
  const { addStarterPack } = useOnboarding()
  const previewMeals = buildStarterMeals().filter((m) => STARTER_PREVIEW.includes(m.title))

  function accept() {
    addStarterPack()
    onNext()
  }

  return (
    <div className="ob-step">
      <div className="ob-step__head">
        <h1 className="ob-step__title">{STARTER_COUNT} Meals, Ready To Fight</h1>
        <p className="ob-step__body">
          Start with a full roster of classics. Edit or delete any of them later.
        </p>
      </div>

      <div className="ob-starter__preview">
        {previewMeals.map((meal) => (
          <div key={meal.id} className="ob-starter__card">
            <p className="eyebrow">{meal.category}</p>
            <span className="ob-starter__card-title">{meal.title}</span>
          </div>
        ))}
        <p className="ob-starter__more">+ {STARTER_COUNT - previewMeals.length} more</p>
      </div>

      <div className="ob-step__actions ob-step__actions--shelf">
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <Button variant="primary" className="btn--full ob-step__cta" onClick={accept}>
          <span>Add All {STARTER_COUNT}</span>
        </Button>
        <Button variant="text" className="ob-step__skip" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  )
}
