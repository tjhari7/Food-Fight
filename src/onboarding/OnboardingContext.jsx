import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { buildStarterMeals } from './starterMeals'

const OnboardingContext = createContext(null)

// The paywall opens with Yearly already active — it's the "Best value" row, and
// landing on the screen with nothing chosen leaves Continue disabled and the
// user with a decision they didn't ask for. Must stay in sync with a `PLANS` id
// in steps/Paywall.jsx.
const DEFAULT_PLAN = 'yearly'

let nextId = 0
const makeId = (source) => `${source}-${nextId++}`

// The roster a user builds during onboarding. Deliberately NOT persisted:
// both variants are prototypes for user testing, so nothing touches Supabase
// and a reload starts the flow clean. That also means running either flow
// repeatedly can't pollute the real meal list.
export function OnboardingProvider({ children }) {
  const [meals, setMeals] = useState([])
  // Email is collected on the account screen. Never sent anywhere.
  const [account, setAccount] = useState({ email: '', password: '' })
  const [plan, setPlan] = useState(DEFAULT_PLAN)
  // The meal crowned on the Main Event, handed to the Champion screen.
  const [winner, setWinner] = useState(null)
  // The most recently decided fight, read by Main Event when it remounts
  // after a Rematch tap: the loser is re-served as one of the next pair, the
  // winner sits out the redraw (often the whole reason for the rematch is
  // that it turned out not to be cookable tonight).
  const [lastFight, setLastFight] = useState(null)

  const addStarterPack = useCallback(() => {
    setMeals((prev) =>
      prev.some((m) => m.source === 'starter') ? prev : [...buildStarterMeals(), ...prev]
    )
  }, [])

  const addVoiceMeals = useCallback((titles) => {
    setMeals((prev) => [
      ...prev,
      ...titles.map((title) => ({ id: makeId('voice'), title, source: 'voice' })),
    ])
  }, [])

  const addManualMeal = useCallback((meal) => {
    setMeals((prev) => [...prev, { ...meal, id: makeId('manual'), source: 'manual' }])
  }, [])

  const updateMeal = useCallback((id, patch) => {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const removeMeal = useCallback((id) => {
    setMeals((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const reset = useCallback(() => {
    setMeals([])
    setAccount({ email: '', password: '' })
    setPlan(DEFAULT_PLAN)
    setWinner(null)
    setLastFight(null)
  }, [])

  const counts = useMemo(
    () => ({
      starter: meals.filter((m) => m.source === 'starter').length,
      voice: meals.filter((m) => m.source === 'voice').length,
      manual: meals.filter((m) => m.source === 'manual').length,
      total: meals.length,
    }),
    [meals]
  )

  const value = useMemo(
    () => ({
      meals,
      counts,
      account,
      setAccount,
      plan,
      setPlan,
      winner,
      setWinner,
      lastFight,
      setLastFight,
      addStarterPack,
      addVoiceMeals,
      addManualMeal,
      updateMeal,
      removeMeal,
      reset,
    }),
    [
      meals,
      counts,
      account,
      plan,
      winner,
      lastFight,
      addStarterPack,
      addVoiceMeals,
      addManualMeal,
      updateMeal,
      removeMeal,
      reset,
    ]
  )

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider')
  return ctx
}
