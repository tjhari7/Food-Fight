import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button'
import IconButton from '../../components/IconButton'
import curveShape from '../../assets/Curve_Shape.svg'
import appleLogo from '../../assets/Apple_logo1.svg'
import googleLogo from '../../assets/Google_Logo1.svg'
import { useOnboarding } from '../OnboardingContext.jsx'

// Both marks are the official assets. Neither may be redrawn, recolored, or
// distorted, so they're rendered at their native 1:1 ratio and nothing here
// tints them — leave the fills alone if this button ever gets a dark variant
// (Apple's mark inverts to white via a *different* supplied asset, not CSS).
const PROVIDERS = [
  { id: 'google', label: 'Continue with Google', logo: googleLogo },
  { id: 'apple', label: 'Continue with Apple', logo: appleLogo },
]

// Placed after the first fight in both variants: value first, ask second.
//
// A façade — the fields validate and carry through to the success copy, but
// nothing is sent anywhere and no account is created.
export default function Account({ onNext }) {
  const { account, setAccount } = useOnboarding()
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [pendingProvider, setPendingProvider] = useState(null)
  const timerRef = useRef(null)
  const canContinue =
    /\S+@\S+\.\S+/.test(account.email) && account.password.length >= 6

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function update(field, value) {
    setAccount((a) => ({ ...a, [field]: value }))
    // Clear the field's error as soon as it's being addressed, rather than
    // making the user re-submit to find out they've fixed it.
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e))
  }

  // canContinue only ever dims the button (see ob-step__cta--inactive below) —
  // it never sets the `disabled` attribute. A truly disabled button eats the
  // click event entirely, so tapping it while invalid would do nothing and the
  // per-field errors below could never surface. Staying clickable while
  // looking disabled is what lets both be true at once.
  function handleContinue() {
    const next = {}
    if (!/\S+@\S+\.\S+/.test(account.email)) next.email = 'Enter a valid email address.'
    if (account.password.length < 6) next.password = 'Use at least 6 characters.'
    setErrors(next)
    if (Object.keys(next).length === 0) onNext()
  }

  // No real auth behind these. The delay stands in for the native sheet — an
  // instant jump to the paywall breaks the illusion at exactly the moment the
  // screen is being judged on whether it feels like a real signup.
  function handleProvider(id) {
    if (pendingProvider) return
    setPendingProvider(id)
    timerRef.current = setTimeout(onNext, 900)
  }

  return (
    <div className="ob-step ob-step--inset-24">
      <div className="ob-step__head">
        <h1 className="ob-step__title">Save Your Meals By Setting Up An Account</h1>
        <p className="ob-step__body">
          Takes less than a minute, and your meals will be ready to fight.
        </p>
      </div>

      <div className="ob-form">
        <div className="ob-field">
          <label className="ob-field__label" htmlFor="ob-email">
            Email
          </label>
          <input
            id="ob-email"
            className="ob-field__input"
            type="email"
            value={account.email}
            // Was "off", which suppressed password-manager autofill on the
            // most conversion-sensitive screen in the flow.
            autoComplete="username"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'ob-email-error' : undefined}
            onChange={(e) => update('email', e.target.value)}
            placeholder="alex@example.com"
          />
          {errors.email && (
            <p className="ob-field__error" id="ob-email-error">
              {errors.email}
            </p>
          )}
        </div>

        <div className="ob-field">
          <label className="ob-field__label" htmlFor="ob-password">
            Password
          </label>
          <div className="ob-field__input-wrap">
            <input
              id="ob-password"
              className="ob-field__input ob-field__input--password"
              type={showPassword ? 'text' : 'password'}
              value={account.password}
              autoComplete="new-password"
              aria-invalid={errors.password ? 'true' : undefined}
              aria-describedby={
                errors.password ? 'ob-password-error' : 'ob-password-hint'
              }
              onChange={(e) => update('password', e.target.value)}
              placeholder="Create a password"
            />
            <IconButton
              name={showPassword ? 'visibility_off' : 'visibility'}
              label={showPassword ? 'Hide password' : 'Show password'}
              className="ob-field__toggle"
              onClick={() => setShowPassword((v) => !v)}
            />
          </div>
          {errors.password ? (
            <p className="ob-field__error" id="ob-password-error">
              {errors.password}
            </p>
          ) : (
            <p className="ob-field__hint" id="ob-password-hint">
              At least 6 characters
            </p>
          )}
        </div>
      </div>

      <div className="ob-divider">or</div>

      <div className="ob-social">
        {PROVIDERS.map((p) => {
          const pending = pendingProvider === p.id
          return (
            <button
              key={p.id}
              type="button"
              className={'ob-social__btn' + (pending ? ' ob-social__btn--pending' : '')}
              onClick={() => handleProvider(p.id)}
              disabled={Boolean(pendingProvider)}
            >
              {pending ? (
                <span className="ob-social__spinner" aria-hidden="true" />
              ) : (
                <img src={p.logo} alt="" aria-hidden="true" className="ob-social__logo" />
              )}
              <span>{pending ? 'Signing in…' : p.label}</span>
            </button>
          )
        })}
      </div>

      <div className="ob-step__actions ob-step__actions--shelf ob-step__actions--shelf-low">
        <img src={curveShape} alt="" aria-hidden="true" className="ob-step__curve" />
        <Button
          variant="primary"
          className={
            'btn--full ob-step__cta' + (canContinue ? '' : ' ob-step__cta--inactive')
          }
          aria-disabled={!canContinue}
          onClick={handleContinue}
        >
          <span>Continue</span>
        </Button>
      </div>
    </div>
  )
}
