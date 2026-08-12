import { useState } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { getNextWinnerHeadline } from '../../lib/winnerHeadlines'
import { calcCalories } from '../../lib/calories'
import { useOnboarding } from '../OnboardingContext.jsx'
import impactWinner from '../../assets/Impact_All_Meals_2.svg'
import curveShape from '../../assets/Curve_Shape.svg'
import refreshIcon from '../../assets/Icon_Refresh_Round.svg'
import '../../pages/MealDetail.css'

// The real winner treatment, mirroring MealDetail's `fromMainEvent` view.
//
// Rematch lives here on purpose: it's the safety net for anyone who crowned a
// meal without ever touching New Round. Someone who just picked and feels a
// flicker of "actually, not that" is the most receptive audience reroll will
// ever have — better than explaining the feature before they needed it.
export default function Champion({ onNext, onBack }) {
  const { winner } = useOnboarding()
  const [headline] = useState(() => getNextWinnerHeadline())

  if (!winner) return null

  const hasMacros = winner.protein_g != null || winner.carbs_g != null || winner.fats_g != null
  const calories = hasMacros ? calcCalories(winner.protein_g, winner.carbs_g, winner.fats_g) : null

  return (
    <div className="ob-step ob-step--flush">
      <div className="ob-champion__head">
        <img src={impactWinner} width={120} height={66} alt="" aria-hidden="true" className="detail__winner-impact" />
        <h1 className={`detail__winner-title ${headline.className}`}>
          {headline.lines
            ? headline.lines.map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))
            : headline.text}
        </h1>
      </div>

      {/* Full-bleed like the real winner panel, rather than sitting in the
          fight column — the frame runs its fill to both edges and insets the
          text 40pt. */}
      <Card className="detail__card detail__card--winner ob-champion__panel">
        <img src={curveShape} width={375} height={32} alt="" aria-hidden="true" className="detail__winner-curve" />
        <p className="eyebrow">{winner.category || 'Unassigned'}</p>
        <h2 className="detail__title">{winner.title}</h2>

        {(winner.prep_time != null || winner.cook_time != null) && (
          <div className="detail__times">
            {winner.prep_time != null && (
              <span>
                <span className="eyebrow">Prep</span> {winner.prep_time} min
              </span>
            )}
            {winner.cook_time != null && (
              <span>
                <span className="eyebrow">Cook</span> {winner.cook_time} min
              </span>
            )}
          </div>
        )}

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
              {winner.protein_g != null && (
                <div>
                  <p className="eyebrow">Protein</p>
                  <p>{winner.protein_g}g</p>
                </div>
              )}
              {winner.carbs_g != null && (
                <div>
                  <p className="eyebrow">Carbs</p>
                  <p>{winner.carbs_g}g</p>
                </div>
              )}
              {winner.fats_g != null && (
                <div>
                  <p className="eyebrow">Fats</p>
                  <p>{winner.fats_g}g</p>
                </div>
              )}
            </div>
          </section>
        )}

        {winner.ingredients?.length > 0 && (
          <section className="detail__section">
            <h2 className="detail__section-title">Ingredients</h2>
            <ul className="detail__ingredients">
              {winner.ingredients.map((ing, i) => (
                <li key={i}>
                  <span>{ing.name}</span>
                  {ing.amount && <span className="detail__ingredient-amount">{ing.amount}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </Card>

      {/* position: sticky (see .ob-step__actions--on-panel) — the page now
          scrolls as one column (chrome included), so without this a full
          record's worth of macros and ingredients pushes Continue/Rematch
          below the fold instead of keeping them reachable at every scroll
          position. */}
      <div className="ob-step__actions ob-step__actions--shelf ob-step__actions--on-panel ob-step__actions--shelf-elevated">
        <img src={curveShape} width={375} height={32} alt="" aria-hidden="true" className="ob-step__curve" />
        <div className="ob-step__curve-mask" aria-hidden="true" />
        <p className="ob-step__caption">And the winner dinner is...</p>
        <Button variant="primary" className="btn--full ob-step__cta" onClick={onNext}>
          <span>Continue</span>
        </Button>
        {/* Outlined rather than Figma's Text Link Medium, to match the Rematch
            on the real winner view (.detail__rematch) and the New Round button
            it hands back to. Deliberate deviation from the B frames — revert to
            `variant="text" className="ob-step__skip"` for the Figma original. */}
        <Button variant="secondary" className="btn--full ob-champion__rematch" onClick={onBack}>
          <img src={refreshIcon} width={24} height={24} alt="" className="ob-champion__rematch-icon" />
          <span className="ob-champion__rematch-label">Rematch</span>
        </Button>
      </div>
    </div>
  )
}
