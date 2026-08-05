import Button from '../../components/Button'
import curveShape from '../../assets/Curve_Shape.svg'
import { useOnboarding } from '../OnboardingContext.jsx'

const PLANS = [
  { id: 'monthly', name: 'Monthly', price: '$2.99', note: 'Billed every month' },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$1.99',
    note: 'Per month, billed annually',
    badge: 'Best value',
  },
  { id: 'lifetime', name: 'Lifetime', price: '$39.99', note: 'One time purchase' },
]

// Both variants hand off to a dedicated success screen from here.
export default function Paywall({ onNext }) {
  const { plan, setPlan } = useOnboarding()

  return (
    <div className="ob-step ob-step--inset-24">
      <div className="ob-step__head">
        <h1 className="ob-step__title">Never Fight Over Food Ever Again</h1>
        <p className="ob-step__body">Unlimited meals, cancel any time.</p>
      </div>

      <div className="ob-plans">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={'ob-plan' + (plan === p.id ? ' ob-plan--selected' : '')}
            aria-pressed={plan === p.id}
            onClick={() => setPlan(p.id)}
          >
            {p.badge && <span className="ob-plan__badge">{p.badge}</span>}
            <span>
              <span className="ob-plan__name">{p.name}</span>
              <br />
              <span className="ob-plan__note">{p.note}</span>
            </span>
            <span className="ob-plan__price">{p.price}</span>
          </button>
        ))}
      </div>

      <div className="ob-step__actions ob-step__actions--shelf ob-step__actions--shelf-low">
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <Button
          variant="primary"
          className="btn--full ob-step__cta"
          onClick={onNext}
          disabled={!plan}
        >
          <span>Continue</span>
        </Button>
      </div>
    </div>
  )
}
