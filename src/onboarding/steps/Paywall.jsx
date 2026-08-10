import { useRef, useState } from 'react'
import Button from '../../components/Button'
import Toast from '../../components/Toast'
import curveShape from '../../assets/Curve_Shape.svg'
import { useOnboarding } from '../OnboardingContext.jsx'

// App Store guideline 3.1.2 wants both reachable from the purchase screen
// itself — a link in Settings doesn't satisfy it.
//
// In-app routes rather than the foodfight.app URLs these used to point at:
// that domain serves nothing, and a 404 behind a required link is a worse
// review outcome than no link at all. Both pages are honest placeholders for
// now; Legal.jsx carries the note on replacing them before launch.
const TERMS_URL = '/terms'
const PRIVACY_URL = '/privacy'

const TRIAL_DAYS = 7

// Prices are normalised to a per-month figure so the three rows are actually
// comparable; `note` carries what the card really charges.
//
// These are NOT the numbers in the Figma frame (Onboarding_07). That frame has
// Monthly at $1.99 and Yearly at $2.99/mo — i.e. the plan wearing the "best
// value" badge is the more expensive one — and its own $23.99/yr works out to
// $2.00/mo, not $2.99. Corrected here; the frame needs the same fix.
//
// Lifetime moved $39.99 -> $59.99. Against $23.99/yr the old price paid for
// itself in 20 months, so it converted subscribers into one-time buyers.
// Both subscriptions carry the trial. Offering it on Yearly alone made it read
// as a lever to push the annual plan rather than a standing offer, and the two
// rows sit next to each other where the gap is obvious. Lifetime doesn't get
// one — there's nothing to trial into on a one-time purchase.
//
// Ordered most expensive first, descending by total price: $59.99, $23.99/yr,
// $2.99/mo. Two reasons for the order rather than the ascending one it replaced.
// Lifetime up top anchors the subscriptions, so $2.99 reads as small against it.
// And it puts Yearly in the middle, which is both the strongest slot in a
// three-item list and where the default selection belongs — with Yearly last,
// the pre-selected card sat below two unselected ones and the group read as
// nothing-chosen on first glance.
//
// Descending is load-bearing here. An earlier pass tried Lifetime, Monthly,
// Yearly, which is high/low/mid: no readable direction, so the eye stops
// comparing. Whatever this order becomes, keep it monotonic.
const PLANS = [
  {
    id: 'lifetime',
    name: 'Lifetime',
    note: 'One-time purchase',
    price: '$59.99',
    unit: 'forever',
    terms: ['$59.99 charged once.', 'No subscription, nothing renews.'],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    note: `Free for ${TRIAL_DAYS} days, then $23.99/yr`,
    price: '$2.00',
    unit: 'per month',
    // "Best value" was an assertion with nothing behind it. The saving against
    // 12x monthly is the evidence, so the badge states that instead — and with
    // the trial no longer exclusive to this row, it's the only thing left
    // differentiating it.
    badge: 'Save 33%',
    trial: true,
    // Unreferenced since the trial timeline came out — it fed that block's
    // "Billed X. Cancel any time." step. Kept on both subscriptions so restoring
    // the timeline is a JSX change rather than a data change. Delete both if the
    // one-line reminder sticks.
    billed: '$23.99/yr',
    terms: [`Free for ${TRIAL_DAYS} days, then $23.99 a year.`, 'Renews automatically until cancelled.'],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    note: `Free for ${TRIAL_DAYS} days, then $2.99/mo`,
    price: '$2.99',
    unit: 'per month',
    trial: true,
    billed: '$2.99/mo',
    // One string per line. The two subscription rows used to land on this break
    // anyway via text-wrap: balance, but Lifetime's shorter copy fit on a single
    // line — so the disclosure was two lines on two plans and one on the third,
    // and the block changed height as you toggled. Splitting at the sentence
    // boundary explicitly makes all three the same shape.
    terms: [`Free for ${TRIAL_DAYS} days, then $2.99 a month.`, 'Renews automatically until cancelled.'],
  },
]

// Shown under the card group on either subscription, blank on Lifetime. This is
// the one fact the old three-step trial timeline carried that nothing else on
// the screen did: the other two steps restated the selected card's own note and
// the disclosure line below. The timeline cost 74px to say one new thing, so
// it's now one line, and the space it freed pays for the benefits list moving
// above the cards where it applies to every plan.
const TRIAL_REMINDER = "We'll remind you 2 days before your trial ends."

// PLACEHOLDER COPY — first pass, not final. Picked to name things the onboarding
// never demonstrates, since anything the user already watched work for free says
// nothing at the point of payment. Roster size is deliberately gone: the trial
// grants it anyway, and it was the subhead this list replaced.
//
// Group decision is the strongest line here and also the least real — it's a
// fake backend today (random winner, no multiplayer). It has to actually work
// before this screen goes in front of anyone paying.
// Each line is kept under 301px so it sets on a single row. Three wrapped rows
// pushed this screen past the viewport and clipped the CTA, so the width is a
// real constraint here rather than a preference.
const BENEFITS = [
  'Filter meals by ingredients in your fridge',
  'Organize your meals into custom meal types',
  'Decide as a group and crown one winner',
]

const ARROW_STEP = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }

// Both variants hand off to a dedicated success screen from here.
export default function Paywall({ onNext }) {
  const { plan, setPlan } = useOnboarding()
  const cardRefs = useRef([])
  const [toast, setToast] = useState(null)

  const selectedIndex = Math.max(
    0,
    PLANS.findIndex((p) => p.id === plan),
  )
  const selected = PLANS[selectedIndex]

  // The cards are one radiogroup, not three independent toggles: `aria-pressed`
  // announced "toggled on", which doesn't say pick-one-of-three. The pattern
  // that does is a roving tabindex — only the checked radio is tabbable, so the
  // group is a single tab stop and arrows move the selection inside it.
  function handleKeyDown(event) {
    const step = ARROW_STEP[event.key]
    if (!step) return
    event.preventDefault()
    const next = (selectedIndex + step + PLANS.length) % PLANS.length
    setPlan(PLANS[next].id)
    cardRefs.current[next]?.focus()
  }

  // No store integration exists yet, so this reports the honest result rather
  // than pretending to find something. Swap the body for the real
  // restoreCompletedTransactions call when IAP lands — the control itself has
  // to be here either way (guideline 3.1.2).
  function handleRestore() {
    setToast('No previous purchases found for this account.')
  }

  return (
    <div className="ob-step ob-step--inset-24">
      {/* No subhead. It used to read "Unlock your full roster of fighters." and
          sat immediately above three value bullets, which made four consecutive
          claims before the user reached a price. The bullets say it better and
          with specifics, so the line was cut rather than duplicated. */}
      <div className="ob-step__head">
        <h1 className="ob-step__title">Never Fight Over Food Ever Again</h1>
      </div>

      {/* Above the cards and shown on every plan. Previously this list appeared
          only when Lifetime was selected — not because Lifetime unlocked more,
          but because Lifetime had no trial timeline to fill the slot. That made
          three features the whole product offers look like a Lifetime perk. */}
      <ul className="ob-benefits">
        {BENEFITS.map((b) => (
          <li key={b} className="ob-benefits__item">
            {b}
          </li>
        ))}
      </ul>

      <div className="ob-plans" role="radiogroup" aria-label="Choose a plan" onKeyDown={handleKeyDown}>
        {PLANS.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              cardRefs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={plan === p.id}
            tabIndex={plan === p.id ? 0 : -1}
            className={'ob-plan' + (plan === p.id ? ' ob-plan--selected' : '')}
            onClick={() => setPlan(p.id)}
          >
            {p.badge && <span className="ob-plan__badge">{p.badge}</span>}
            <span className="ob-plan__text">
              <span className="ob-plan__name">{p.name}</span>
              <span className="ob-plan__note">{p.note}</span>
            </span>
            <span className="ob-plan__cost">
              <span className="ob-plan__price">{p.price}</span>
              <span className="ob-plan__unit">{p.unit}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Always rendered, empty on Lifetime. Conditionally mounting it would pull
          ~20px out of the flow on every toggle between a subscription and
          Lifetime and shunt the disclosure block and shelf up with it — the same
          layout shift .ob-plan was rebuilt to avoid. The slot's height is
          reserved in CSS so only the text changes. */}
      <p className="ob-paywall__reminder">{selected.trial ? TRIAL_REMINDER : ''}</p>

      {/* Outside the shelf, so it sits on the page cream above the arc rather
          than in the shelf's fill under the button. */}
      <div className="ob-paywall__fine">
        <p className="ob-paywall__terms">
          {selected.terms.map((line) => (
            <span key={line} className="ob-paywall__terms-line">
              {line}
            </span>
          ))}
        </p>
        <p className="ob-paywall__links">
          <button type="button" className="ob-paywall__link" onClick={handleRestore}>
            Restore purchases
          </button>
          <span className="ob-paywall__dot" aria-hidden="true">
            ·
          </span>
          {/* Plain anchors opening a new tab, not react-router <Link>s: the
              whole onboarding roster lives in memory, so navigating away in
              this tab would drop the user's answers and restart the flow at
              frame one when they came back. */}
          <a className="ob-paywall__link" href={TERMS_URL} target="_blank" rel="noreferrer">
            Terms
          </a>
          <span className="ob-paywall__dot" aria-hidden="true">
            ·
          </span>
          <a className="ob-paywall__link" href={PRIVACY_URL} target="_blank" rel="noreferrer">
            Privacy
          </a>
        </p>
      </div>

      <div className="ob-step__actions ob-step__actions--shelf ob-step__actions--shelf-low">
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <Button variant="primary" className="btn--full ob-step__cta" onClick={onNext}>
          {/* Kept to ~12 uppercase characters — see .ob-step__cta's note on the
              Semi Expanded cut deforming the pill if the label wraps. The price
              confirmation goes in the line above rather than on the button.

              Lifetime says "Buy" rather than the "Continue" this used to read.
              It's the only plan that charges the moment the button is pressed,
              and a neutral verb hid a $59.99 debit behind a word that elsewhere
              in this flow just means "next screen". */}
          <span>{selected.trial ? 'Start Trial' : 'Buy Lifetime'}</span>
        </Button>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
