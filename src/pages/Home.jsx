import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { useIris } from '../components/IrisTransition.jsx'
import { useSwipeForward } from '../lib/swipeBack'
import Button from '../components/Button'
import FiltersDropdown from '../components/FiltersDropdown'
import IconButton from '../components/IconButton'
import Icon from '../components/Icon'
import { UNASSIGNED_NAME } from '../api/categories'
import { parseIngredientTranscript } from '../lib/ingredientMatch'
import heroImage from '../assets/Pizza_VS_Taco_Fight_Hero.webp'
import './Home.css'

const SpeechRecognitionClass =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

const VOICE_TOOLTIP_TEXT =
  'List any ingredients or foods in your fridge to filter your meals.'

// Keyed by the side Home slides in from on a back swipe (see Home.css).
// 'left' as Main Event exits right; 'up' from the top as All Meals exits down.
const HOME_ENTER_CLASS = {
  left: ' home--entering',
  right: ' home--entering-right',
  up: ' home--entering-up',
}

export default function Home() {
  const { categories } = useData()
  const selectableCategories = useMemo(
    () => categories.filter((c) => c.name !== UNASSIGNED_NAME),
    [categories]
  )
  const irisNavigate = useIris()
  const location = useLocation()
  const navigate = useNavigate()
  // Frozen at mount: clearing the history state below must not retract the
  // class mid-animation. Holds the side to slide in from, or null when this
  // wasn't a back swipe.
  const [swipingBackFrom] = useState(() =>
    location.state?.swipeBack ? location.state.enterFrom || 'left' : null
  )
  const [filters, setFilters] = useState({ categoryIds: [] })
  const [ingredientTerms, setIngredientTerms] = useState([])
  const [listening, setListening] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [clickTooltip, setClickTooltip] = useState(false)
  const recognitionRef = useRef(null)
  const tooltipTimeoutRef = useRef(null)
  const { startForward, rootProps, leavingClass } = useSwipeForward('/meals')

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      clearTimeout(tooltipTimeoutRef.current)
    }
  }, [])

  // Drop the back-nav flag once consumed, so reloading Home doesn't replay the
  // slide-in underneath the boot iris.
  useEffect(() => {
    if (swipingBackFrom) navigate('.', { replace: true, state: null })
  }, [swipingBackFrom, navigate])

  const tooltipVisible = isHovering || clickTooltip

  function showTooltipBriefly() {
    setClickTooltip(true)
    clearTimeout(tooltipTimeoutRef.current)
    tooltipTimeoutRef.current = setTimeout(() => setClickTooltip(false), 2500)
  }

  function handleMicClick() {
    if (!SpeechRecognitionClass) return
    showTooltipBriefly()

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      const terms = parseIngredientTranscript(transcript)
      if (terms.length) {
        setIngredientTerms((prev) => [...prev, ...terms.filter((t) => !prev.includes(t))])
      }
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  function clearIngredientFilter() {
    setIngredientTerms([])
  }

  function removeCategoryFilter(id) {
    setFilters((f) => ({ ...f, categoryIds: (f.categoryIds || []).filter((c) => c !== id) }))
  }

  function clearAllFilters() {
    setFilters((f) => ({ ...f, categoryIds: [] }))
    setIngredientTerms([])
  }

  function handleFindMeal(e) {
    // Keyboard activation reports 0,0 — fall back to the button's center.
    const origin =
      e.clientX || e.clientY
        ? { x: e.clientX, y: e.clientY }
        : (() => {
            const r = e.currentTarget.getBoundingClientRect()
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
          })()
    irisNavigate('/find/results', { state: { filters: { ...filters, ingredientTerms } } }, origin)
  }

  return (
    <div
      className={'page home' + (HOME_ENTER_CLASS[swipingBackFrom] || '') + leavingClass}
      {...rootProps}
    >
      <div className="home__hero">
        {/* width/height are here to reserve the box, not to size the image —
            .home__hero-image pins width to 320px and leaves height auto, so
            without them this reserves 0px and the title below it drops ~237px
            the moment the art lands. The browser turns the pair into an
            aspect-ratio and gets the box right on the first frame.
            Only the RATIO has to stay true to the file: re-exporting the hero
            at 2160x1600 for retina needs no change here. Re-cropping it does,
            and fails silently by stretching the art — `npm run check:images`
            is what catches that. */}
        <img src={heroImage} width={1080} height={800} alt="" className="home__hero-image" />
        <h1 className="home__title">
          Food
          <br />
          Fight
        </h1>
        <p className="home__subtitle">
          Don't fight over what's for dinner.
          <br />
          We set your meal matchup.
          <br />
          You crown the champion.
        </p>
      </div>

      <div className="home__actions">
        <div className="home__filter-row">
          <FiltersDropdown categories={selectableCategories} filters={filters} onChange={setFilters} />

          {SpeechRecognitionClass && (
            <div
              className={'home__mic-wrap' + (listening ? ' home__mic-wrap--active' : '')}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <IconButton
                name="mic"
                label={listening ? 'Stop voice search' : 'List your ingredients'}
                className={'home__mic-btn' + (listening ? ' home__mic-btn--active' : '')}
                onClick={handleMicClick}
                onFocus={() => setIsHovering(true)}
                onBlur={() => setIsHovering(false)}
              />
              {tooltipVisible && (
                <div className="home__mic-tooltip" role="tooltip">
                  {VOICE_TOOLTIP_TEXT}
                </div>
              )}
            </div>
          )}
        </div>

        {(filters.categoryIds.length > 0 || ingredientTerms.length > 0) && (
          <div className="home__chip-row">
            {filters.categoryIds.map((id) => {
              const category = categories.find((c) => c.id === id)
              if (!category) return null
              return (
                <button
                  key={id}
                  type="button"
                  className="home__chip"
                  onClick={() => removeCategoryFilter(id)}
                >
                  <span className="home__chip-label">{category.name}</span>
                  <Icon name="close" className="home__chip-close" />
                </button>
              )
            })}

            {ingredientTerms.length > 0 && (
              <button type="button" className="home__chip" onClick={clearIngredientFilter}>
                <Icon name="mic" className="home__chip-icon" />
                <span className="home__chip-label">{ingredientTerms.join(', ')}</span>
                <Icon name="close" className="home__chip-close" />
              </button>
            )}

            {filters.categoryIds.length + (ingredientTerms.length > 0 ? 1 : 0) >= 2 && (
              <button type="button" className="home__chip-clear" onClick={clearAllFilters}>
                Clear All
              </button>
            )}
          </div>
        )}

        <Button variant="primary" className="home__cta" onClick={handleFindMeal}>
          <span className="home__cta-label">Find Your Meal</span>
        </Button>
        <Link
          to="/meals"
          className="home__link"
          onClick={(e) => {
            e.preventDefault()
            startForward()
          }}
        >
          View All Meals
        </Link>
      </div>
    </div>
  )
}
