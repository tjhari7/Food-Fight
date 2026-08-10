import Button from '../../components/Button'
import curveShape from '../../assets/Curve_Shape.svg'
import pancakePunch from '../../assets/Pancake_Success.png'
import hotdogBlock from '../../assets/HotDog_Success.png'
import { useIris } from '../../components/IrisTransition.jsx'
import { useOnboarding } from '../OnboardingContext.jsx'

// The last frame in both variants. Still no confirmation badge or summary card —
// the headline carries it, framed by two of the fighters the user just signed up
// to keep. The headline states the state ("Ready To Fight") and the CTA is the
// action that follows it, so neither repeats the other.
//
// Both images are decorative: the headline already says everything this screen
// means, so they're aria-hidden rather than carrying alt text that a screen
// reader would have to wade through to reach the point.
export default function Success() {
  const irisNavigate = useIris()
  const { reset } = useOnboarding()

  const handleEnter = (e) => {
    reset()
    const origin = {
      x: e.clientX || e.currentTarget.getBoundingClientRect().left + e.currentTarget.getBoundingClientRect().width / 2,
      y: e.clientY || e.currentTarget.getBoundingClientRect().top + e.currentTarget.getBoundingClientRect().height / 2,
    }
    irisNavigate('/', {}, origin)
  }

  return (
    <div className="ob-step">
      <div className="ob-success">
        <img src={pancakePunch} alt="" aria-hidden="true" className="ob-success__art" />

        <div className="ob-success__text">
          {/* Same title-card treatment as FOOD FIGHT on the opening frame, so
              the flow opens and closes on matching type. One word per line,
              broken by hand rather than left to wrap. */}
          <h1 className="ob-step__display ob-success__title">
            Ready
            <br />
            To
            <br />
            Fight
          </h1>
          {/* The copy is static now that the roster count is gone, so these
              breaks are purely for a balanced two-line rag rather than to stop
              a dynamic number from reflowing the paragraph. */}
          <p className="ob-success__body">
            <span className="ob-success__line">Your meals are in your corner,</span>
            <span className="ob-success__line">and ready for the next round.</span>
          </p>
        </div>

        {/* No CSS mirror on this one: the replacement art is already drawn
            facing back toward the pancake, so flipping it would turn it away
            again. */}
        <img src={hotdogBlock} alt="" aria-hidden="true" className="ob-success__art" />
      </div>

      <div className="ob-step__actions ob-step__actions--shelf ob-step__actions--shelf-low">
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <Button variant="primary" className="btn--full ob-step__cta" onClick={handleEnter}>
          <span>Enter The Ring</span>
        </Button>
      </div>
    </div>
  )
}
