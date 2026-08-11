import Button from '../../components/Button'
import heroImage from '../../assets/Pizza_VS_Taco_Fight_Hero.webp'
import curveShape from '../../assets/Curve_Shape.svg'

// One screen carrying the whole pitch. The problem ("can't decide") and the
// differentiator ("so they fight") are the same sentence, and the hero art
// lands both without a word of setup — which is why this isn't three screens.
export default function Fight({ onNext }) {
  return (
    <div className="ob-step">
      <div className="ob-intro">
        <img src={heroImage} alt="" className="ob-intro__art" />
        <h1 className="ob-step__display">
          Food
          <br />
          Fight
        </h1>
        {/* Broken by hand rather than left to wrap: the three lines are three
            beats, and the frame sets them one per line. */}
        <p className="ob-step__body ob-step__body--center">
          Don't fight over what's for dinner.
          <br />
          We set your meal matchup.
          <br />
          You crown the champion.
        </p>
      </div>

      <div className="ob-step__actions ob-step__actions--shelf ob-step__actions--shelf-low">
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <Button variant="primary" className="btn--full ob-step__cta" onClick={onNext}>
          <span>Get Started</span>
        </Button>
      </div>
    </div>
  )
}
