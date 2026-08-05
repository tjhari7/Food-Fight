import Button from '../../components/Button'
import curveShape from '../../assets/Curve_Shape.svg'
import { useOnboarding } from '../OnboardingContext.jsx'

// The last frame in both variants. Deliberately bare — no confirmation badge,
// no summary card. The headline and the roster count are the whole screen.
export default function Success({ onNext }) {
  const { counts } = useOnboarding()

  return (
    <div className="ob-step">
      <div className="ob-success">
        <h1 className="ob-success__title">Success</h1>
        <p className="ob-success__body">
          {counts.total} meal{counts.total === 1 ? '' : 's'} in your corner, ready for the next
          round.
        </p>
      </div>

      <div className="ob-step__actions ob-step__actions--shelf ob-step__actions--shelf-low">
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <Button variant="primary" className="btn--full ob-step__cta" onClick={onNext}>
          <span>Let's Fight</span>
        </Button>
      </div>
    </div>
  )
}
