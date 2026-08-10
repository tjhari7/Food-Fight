import Fight from './steps/Fight.jsx'
import PrebuiltMeals from './steps/PrebuiltMeals.jsx'
import VoiceAdd from './steps/VoiceAdd.jsx'
import AddMeal from './steps/AddMeal.jsx'
import Roster from './steps/Roster.jsx'
import MainEvent from './steps/MainEvent.jsx'
import Champion from './steps/Champion.jsx'
import Account from './steps/Account.jsx'
import Paywall from './steps/Paywall.jsx'
import Success from './steps/Success.jsx'

// The two variants are the same screens in a different order — they share one
// set of step components, so a change to any shared screen lands in both. The
// structural argument between them is now only sequence, not content:
//
//   A — see the roster, add to it, review it, then fight with it.
//   B — fight immediately, then offer voice once the user has seen why a
//       personal roster is worth the effort.
//
// Both seed the starter pack on mount, so both open on a populated roster and
// the prebuilt screen is a reveal in each. A keeps the two screens B doesn't
// have (manual add, roster review) — those are the only frames unique to it.
//
// `seedStarterPack` on a flow means the 30 meals are applied on mount rather
// than offered as a screen.
//
// `progress` on a step is the fill percentage of the chrome's progress bar.
// Variant B takes its values from the Figma frames rather than computing them
// from step count: the designer sized the fills by hand (they aren't even
// steps of 1/6), and the flow ends on two full bars — the paywall and the
// success screen that follows it both read as "done". A has no hand-sized
// values and falls back to an even share of its own (longer) step count, which
// is why the two flows' bars don't line up screen for screen.
//
// Neither variant shows an exit affordance: the chrome is a back chevron and
// the bar, nothing else. Back on the first step still leaves the flow, and the
// last step (Success) drops the chrome entirely.

export const FLOWS = {
  a: {
    id: 'a',
    label: 'Onboarding A',
    length: 10,
    seedStarterPack: true,
    showExit: false,
    steps: [
      { key: 'fight', Component: Fight },
      // Same reveal B runs, not the old opt-in offer: the pack is seeded on
      // mount now, so there's nothing left for this screen to add. Roster
      // (below) is what shows the result.
      { key: 'prebuilt', Component: PrebuiltMeals },
      { key: 'voice', Component: VoiceAdd, skippable: true },
      { key: 'manual', Component: AddMeal, skippable: true },
      { key: 'roster', Component: Roster },
      { key: 'main-event', Component: MainEvent, flush: true },
      { key: 'champion', Component: Champion, flush: true },
      { key: 'account', Component: Account },
      { key: 'paywall', Component: Paywall },
      { key: 'success', Component: Success },
    ],
  },

  b: {
    id: 'b',
    label: 'Onboarding B',
    length: 8,
    seedStarterPack: true,
    showExit: false,
    steps: [
      // No progress fill: the first fight is the hook, before the flow has
      // visibly "started" — a real app wouldn't show progress here.
      { key: 'fight', Component: Fight, progress: 0 },
      { key: 'main-event', Component: MainEvent, progress: 15.6, flush: true },
      { key: 'champion', Component: Champion, progress: 31.1, flush: true },
      { key: 'prebuilt', Component: PrebuiltMeals, progress: 50 },
      { key: 'voice', Component: VoiceAdd, skippable: true, progress: 58.8 },
      { key: 'account', Component: Account, progress: 78.7 },
      { key: 'paywall', Component: Paywall, progress: 100 },
      // Success is its own frame in the design rather than a state folded onto
      // the paywall, which is why B ends on two screens instead of one.
      { key: 'success', Component: Success, progress: 100 },
    ],
  },
}

export function getFlow(variant) {
  return FLOWS[String(variant || '').toLowerCase()] || null
}
