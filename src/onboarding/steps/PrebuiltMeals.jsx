import { useState } from 'react'
import Button from '../../components/Button'
import curveShape from '../../assets/Curve_Shape.svg'
import groupFight from '../../assets/Food_Fight_BurgerSandwich_01.webp'
import { STARTER_PREVIEW_LIST, buildStarterMeals } from '../starterMeals'

// This screen shows a capped taste of the roster rather than the true count —
// the real pack has grown past this frame's original 30-meal number, but the
// copy still reads "30" on purpose, so it only ever reveals the first 30.
const PREBUILT_DISPLAY_COUNT = 30

// Figma B-4: sits right after the champion reveal and before voice add.
// Variant B seeds the starter pack silently on mount (see flows.js
// `seedStarterPack`) so the very first fight has something to draw from, so
// by the time this screen shows the roster already has the full pack — this
// is a reveal, not an offer. "Load All N Meals" expands the five-title taste
// into the full roster; Continue works the same whether or not it's tapped.
// Collapsed state peeks 3 rows rather than the full 5-title taste — the
// third fades under a gradient so the cutoff itself signals "there's more"
// instead of the list just stopping.
const PREBUILT_PEEK_COUNT = 3

// Per-row offset for the cascade the reveal runs down the roster. Paired with the
// 390ms row duration in Onboarding.css to total 1.3s across the 27 revealed rows
// (26 gaps × 35ms, then the last row's own fade). Keep the two in step if either
// changes: the ratio between them sets how many rows are mid-fade at once — ~11
// here, and that overlap is what makes it read as one continuous wipe rather than
// 27 separate pops.
const PREBUILT_ROW_STAGGER_MS = 35

export default function PrebuiltMeals({ onNext }) {
  const [expanded, setExpanded] = useState(false)
  const titles = expanded ? buildExpandedTitles() : STARTER_PREVIEW_LIST.slice(0, PREBUILT_PEEK_COUNT)

  return (
    <div className={`ob-step ob-step--inset-24 ob-step--sticky-shelf${expanded ? ' ob-step--fill' : ''}`}>
      <div className="ob-step__head">
        <h1 className="ob-step__title">{PREBUILT_DISPLAY_COUNT} Meals Premade Ready To Fight</h1>
        <p className="ob-step__body">
          These meals are easy to edit or remove to help build out your collection of meals.
        </p>
      </div>

      <div className={`ob-prebuilt__list${expanded ? ' ob-prebuilt__list--scroll' : ''}`}>
        {expanded ? (
          titles.map((title, i) => {
            // Only what the tap actually reveals animates. The first three rows
            // are already on screen from the peek and land on exactly the same
            // pixels once expanded, so fading them in would flash three rows that
            // never moved. They re-mount here (different parent than the peek),
            // which is why this has to be opted into per row rather than left to
            // React to skip.
            const revealed = i >= PREBUILT_PEEK_COUNT
            return (
              <div
                key={title}
                className={`ob-prebuilt__row${revealed ? ' ob-prebuilt__row--reveal' : ''}`}
                style={
                  revealed
                    ? { animationDelay: `${(i - PREBUILT_PEEK_COUNT) * PREBUILT_ROW_STAGGER_MS}ms` }
                    : undefined
                }
              >
                <span className="ob-prebuilt__row-number">{i + 1}.</span>
                <span className="ob-prebuilt__row-title">{title}</span>
              </div>
            )
          })
        ) : (
          <div className="ob-prebuilt__peek">
            {titles.map((title, i) => (
              <div key={title} className="ob-prebuilt__row">
                <span className="ob-prebuilt__row-number">{i + 1}.</span>
                <span className="ob-prebuilt__row-title">{title}</span>
              </div>
            ))}
            <div className="ob-prebuilt__fade" aria-hidden="true" />
          </div>
        )}
        {!expanded && (
          <Button variant="secondary" className="btn--sm ob-prebuilt__view-all no-uppercase" onClick={() => setExpanded(true)}>
            View All {PREBUILT_DISPLAY_COUNT} Meals
          </Button>
        )}
        {/* Last child of the list rather than a sibling of it, so it rides the
            same 8px flex gap under the peek/button while collapsed and gets
            carried to the bottom of the scrolled roster once that button is gone
            and the list becomes the scroll container. */}
        <img src={groupFight} alt="" aria-hidden="true" className="ob-prebuilt__art" />
      </div>

      {/* The dome's shadow is the cue that content is passing under the shelf, so
          it's earned rather than decorative: collapsed, the screen is sized to fit
          the viewport exactly and nothing scrolls beneath the lip, so the shelf
          isn't lifted off anything. Expanding the roster is what starts the scroll,
          and that's when the elevation turns on. */}
      <div className={`ob-step__actions ob-step__actions--shelf ob-step__actions--shelf-low${expanded ? ' ob-step__actions--shelf-elevated' : ''}`}>
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <div className="ob-step__curve-mask" aria-hidden="true" />
        <Button variant="primary" className="btn--full ob-step__cta" onClick={onNext}>
          <span>Continue</span>
        </Button>
      </div>
    </div>
  )
}

// Keeps STARTER_PREVIEW_LIST's five titles first, in the same order, once
// "Load All" swaps in the full roster — otherwise the reveal reshuffles under
// the user the moment they tap the link.
function buildExpandedTitles() {
  const meals = buildStarterMeals()
  const anchors = STARTER_PREVIEW_LIST.map((title) => meals.find((m) => m.title === title)).filter(Boolean)
  const anchorTitles = new Set(anchors.map((m) => m.title))
  const rest = meals.filter((m) => !anchorTitles.has(m.title))
  return [...anchors, ...rest].slice(0, PREBUILT_DISPLAY_COUNT).map((m) => m.title)
}
