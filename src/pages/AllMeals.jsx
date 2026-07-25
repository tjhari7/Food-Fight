import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { ListMealCard } from '../components/MealCard'
import { shouldMorph } from '../lib/morph'
import { useSwipeBackHome } from '../lib/swipeBack'
import { getPageScroller, getScrollTop, scrollPageTo, offsetWithinScroller } from '../lib/pageScroll'
import BackHeader from '../components/BackHeader'
import Icon from '../components/Icon'
import IconButton from '../components/IconButton'
import AlphabetIndex from '../components/AlphabetIndex'
import addIcon from '../assets/Icon_Plus_Add.svg'
import impactAllMeals from '../assets/Impact_All_Meals.svg'
import './AllMeals.css'

const SEARCH_STOPWORDS = new Set([
  'a', 'an', 'the', 'with', 'and', 'or', 'for', 'of', 'to', 'in', 'on',
  'some', 'something', 'me', 'please', 'my', 'want', 'like',
])

function searchMeals(meals, categoryNameById, query) {
  const q = query.trim().toLowerCase()
  if (!q) return meals

  const words = q.split(/\s+/).filter((w) => w.length > 1 && !SEARCH_STOPWORDS.has(w))

  const scored = meals
    .map((meal) => {
      const title = meal.title.toLowerCase()
      const category = (categoryNameById[meal.category_id] || '').toLowerCase()
      let score = 0
      if (title.includes(q)) score += 4
      if (category.includes(q)) score += 2
      for (const word of words) {
        if (title.includes(word)) score += 2
        if (category.includes(word)) score += 1
      }
      return { meal, score }
    })
    .filter((entry) => entry.score > 0)

  scored.sort((a, b) => b.score - a.score || a.meal.title.localeCompare(b.meal.title))
  return scored.map((entry) => entry.meal)
}

function joinNames(names) {
  if (names.length <= 1) return names.join('')
  if (names.length === 2) return names.join(' & ')
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}

function mealElementId(meal) {
  return `meal-card-${meal.id}`
}

function sectionHeaderId(letter) {
  return `letter-section-${letter}`
}

const SpeechRecognitionClass =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export default function AllMeals() {
  const { meals, categories, loading } = useData()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [voiceQuery, setVoiceQuery] = useState(false)
  const [categoryFilters, setCategoryFilters] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [fabCollapsed, setFabCollapsed] = useState(false)
  const filterRef = useRef(null)
  const recognitionRef = useRef(null)
  const lastScrollYRef = useRef(0)
  // 'down': this page sits below Home, so it exits that way and Home returns
  // from the top — the reverse of the swipe that opened it.
  const { leaving, startBack, rootProps, leavingClass } = useSwipeBackHome('down')
  // Frozen at mount: clearing the history state below must not retract the
  // class mid-animation.
  const [swipingForwardIn] = useState(() => Boolean(location.state?.swipeForward))
  // Both classes animate the same children, so they'd collide — and the
  // entering rule, being later in index.css, would win and swallow the leave
  // entirely. Drop it the moment we start leaving; it has served its purpose by
  // then, and its resting state is the natural position anyway.
  const enteringClass = swipingForwardIn && !leaving ? ' swipe-entering-from-below' : ''

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  // Collapse the Add Meal FAB to just its "+" while the user scrolls down,
  // and expand it back to the full pill the instant they scroll up (or reach
  // the top). A small delta threshold keeps it from flickering on jitter.
  useEffect(() => {
    // The scroller is the window on phones and the device frame's inner scroll
    // container on desktop/tablet — listen on whichever actually moves.
    const scroller = getPageScroller()
    lastScrollYRef.current = getScrollTop(scroller)
    function handleFabScroll() {
      const y = getScrollTop(scroller)
      const delta = y - lastScrollYRef.current
      if (Math.abs(delta) < 4) return
      setFabCollapsed(y > 0 && delta > 0)
      lastScrollYRef.current = y
    }
    scroller.addEventListener('scroll', handleFabScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', handleFabScroll)
  }, [])

  // Drop the forward-nav flag once consumed, so reloading this page doesn't
  // replay the slide-in.
  useEffect(() => {
    if (swipingForwardIn) navigate('.', { replace: true, state: null })
  }, [swipingForwardIn, navigate])

  function handleVoiceSearch() {
    if (!SpeechRecognitionClass) return

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
      const t = transcript.toLowerCase()
      const matched = categories.filter((c) => t.includes(c.name.toLowerCase()))

      if (matched.length) {
        setCategoryFilters((prev) => [
          ...prev,
          ...matched.filter((c) => !prev.includes(c.id)).map((c) => c.id),
        ])
        setQuery('')
        setVoiceQuery(false)
      } else {
        setQuery(transcript)
        setVoiceQuery(true)
      }
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  // A layout effect, not a passive one: the back navigation renders this page
  // inside a view transition, and the browser snapshots the result as soon as the
  // render commits. A passive effect would restore the scroll *after* that
  // snapshot, so the card would fly back to wherever it happened to sit at scroll
  // position 0 and the list would jump into place once the animation finished.
  useLayoutEffect(() => {
    if (location.state?.scrollY != null) {
      scrollPageTo(location.state.scrollY)
    } else {
      // Fresh forward entry (from Home or a swipe-in). The scroll container
      // lives outside the <Outlet> and never unmounts, so it retains whatever
      // scrollTop the previous page left — reset it so All Meals opens at the
      // very top instead of mid-list.
      scrollPageTo(0)
    }
  }, [location.state])

  useEffect(() => {
    if (!filterOpen) return
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setFilterOpen(false)
    }
    function handleScroll(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [filterOpen])

  function toggleCategoryFilter(categoryId) {
    setCategoryFilters((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }

  function clearAllFilters() {
    setCategoryFilters([])
    setQuery('')
    setVoiceQuery(false)
  }

  const categoryNameById = useMemo(() => {
    const map = {}
    for (const c of categories) map[c.id] = c.name
    return map
  }, [categories])

  const isSearching = Boolean(query.trim())

  const categoryFilteredMeals = useMemo(() => {
    return categoryFilters.length
      ? meals.filter((m) => categoryFilters.includes(m.category_id))
      : meals
  }, [meals, categoryFilters])

  const visibleMeals = useMemo(() => {
    if (isSearching) {
      return searchMeals(categoryFilteredMeals, categoryNameById, query)
    }

    return [...categoryFilteredMeals].sort((a, b) => a.title.localeCompare(b.title))
  }, [categoryFilteredMeals, categoryNameById, query, isSearching])

  const searchPlaceholder = categoryFilters.length
    ? `Search all ${categoryFilteredMeals.length} ${joinNames(
        categoryFilters.map((id) => categoryNameById[id])
      )} meals…`
    : `Search all ${meals.length} meals…`

  function categoryMealCount(categoryId) {
    return meals.filter((m) => m.category_id === categoryId).length
  }

  const availableLetters = useMemo(() => {
    const set = new Set()
    for (const meal of visibleMeals) {
      const first = meal.title.trim()[0]
      if (first) set.add(first.toUpperCase())
    }
    return set
  }, [visibleMeals])

  function handleEdit(meal) {
    navigate(`/meals/${meal.id}/edit`, {
      state: { returnTo: { pathname: '/meals', state: { scrollY: getScrollTop() } } },
    })
  }

  function handleCardClick(meal) {
    navigate(`/meals/${meal.id}`, {
      state: { returnTo: { pathname: '/meals', state: { scrollY: getScrollTop() } } },
      viewTransition: shouldMorph(),
    })
  }

  function handleAddMeal() {
    navigate('/meals/new', {
      state: { returnTo: { pathname: '/meals', state: { scrollY: getScrollTop() } } },
    })
  }

  function handleLetterSelect(letter) {
    const target = visibleMeals.find((m) => (m.title.trim()[0] || '').toUpperCase() >= letter)
    const meal = target || visibleMeals[visibleMeals.length - 1]
    if (!meal) return
    const targetLetter = (meal.title.trim()[0] || '').toUpperCase()
    const header = document.getElementById(sectionHeaderId(targetLetter))

    // Section headers are `position: sticky`, so once scrolled past, their
    // getBoundingClientRect() reports the pinned-at-top position instead of their
    // real document position — scrollIntoView() on them becomes a no-op. The header's
    // next sibling (that section's first card) is never sticky, so anchor on it instead
    // and subtract the header's own height, which stays accurate regardless of sticky state.
    const anchor = header?.nextElementSibling || document.getElementById(mealElementId(meal))
    if (!anchor) return

    if (header) {
      const scroller = getPageScroller()
      const anchorTop = offsetWithinScroller(anchor, scroller)
      scrollPageTo(Math.max(0, anchorTop - header.offsetHeight), scroller)
    } else {
      anchor.scrollIntoView({ behavior: 'auto', block: 'start' })
    }
  }

  return (
    <div
      className={`page all-meals-page${enteringClass}${leavingClass}`}
      {...rootProps}
    >
      <div className="page-header">
        <BackHeader onBack={startBack} icon="close" label="Close" />
        <IconButton
          as={Link}
          to="/settings"
          name="more_vert"
          label="Settings"
          className="all-meals__menu-btn icon-btn--filled"
        />
      </div>
      <h1 className="all-meals__title">
        All
        <br />
        Meals
      </h1>
      <img src={impactAllMeals} alt="" className="all-meals__impact" />

      <div className="all-meals__search-row">
        <div className="all-meals__search">
          <Icon name="search" className="all-meals__search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setVoiceQuery(false)
            }}
          />
          {query && (
            <IconButton
              name="close"
              label="Clear search"
              className="all-meals__clear-btn"
              onClick={() => {
                setQuery('')
                setVoiceQuery(false)
              }}
            />
          )}
          {query && SpeechRecognitionClass && <span className="all-meals__search-divider" />}
          {SpeechRecognitionClass && (
            <IconButton
              name="mic"
              label={listening ? 'Stop voice search' : 'Search by voice'}
              className={'all-meals__mic-btn' + (listening ? ' all-meals__mic-btn--active' : '')}
              onClick={handleVoiceSearch}
            />
          )}
        </div>
        <div className="all-meals__filter" ref={filterRef}>
          <button
            type="button"
            className={
              'all-meals__filter-btn' +
              (categoryFilters.length ? ' all-meals__filter-btn--active' : '')
            }
            aria-label="Filter meal type"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((open) => !open)}
          >
            <Icon name="tune" className="all-meals__filter-icon" />
          </button>

          {filterOpen && (
            <div className="all-meals__filter-popover">
              {categories.map((c) => {
                const checked = categoryFilters.includes(c.id)
                return (
                  <label key={c.id} className="all-meals__filter-option">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategoryFilter(c.id)}
                    />
                    <span>{c.name}</span>
                  </label>
                )
              })}
              {categoryFilters.length > 0 && (
                <button
                  type="button"
                  className="all-meals__filter-clear"
                  onClick={() => setCategoryFilters([])}
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {(categoryFilters.length > 0 || (isSearching && voiceQuery)) && (
        <div className="all-meals__count-row">
          {categoryFilters.map((id) => (
            <button
              key={id}
              type="button"
              className="all-meals__count-chip all-meals__count-chip--active"
              onClick={() => toggleCategoryFilter(id)}
            >
              <span className="all-meals__count-chip-label">
                {categoryMealCount(id)} &bull; {categoryNameById[id]}
              </span>
              <Icon name="close" className="all-meals__count-chip-icon" />
            </button>
          ))}
          {isSearching && voiceQuery && (
            <button
              type="button"
              className="all-meals__count-chip all-meals__count-chip--active"
              onClick={() => {
                setQuery('')
                setVoiceQuery(false)
              }}
            >
              <span className="all-meals__count-chip-label">
                {visibleMeals.length} &bull;
                <Icon name="mic" className="all-meals__count-chip-mic-icon" />
                "{query}"
              </span>
              <Icon name="close" className="all-meals__count-chip-icon" />
            </button>
          )}
          {categoryFilters.length + (isSearching && voiceQuery ? 1 : 0) >= 2 && (
            <button type="button" className="all-meals__count-clear" onClick={clearAllFilters}>
              Clear All
            </button>
          )}
        </div>
      )}

      {loading && <p className="eyebrow">Loading…</p>}

      {!loading && visibleMeals.length === 0 && (
        <p className="all-meals__empty">No meals match "{query}".</p>
      )}

      <div className="all-meals__grid">
        {(() => {
          let lastLetter = null
          return visibleMeals.map((meal) => {
            const letter = (meal.title.trim()[0] || '#').toUpperCase()
            const isNewSection = !isSearching && letter !== lastLetter
            lastLetter = letter
            return (
              <Fragment key={meal.id}>
                {isNewSection && (
                  <div id={sectionHeaderId(letter)} className="all-meals__section-header">
                    {letter}
                  </div>
                )}
                <ListMealCard
                  id={mealElementId(meal)}
                  meal={meal}
                  categoryName={categoryNameById[meal.category_id] || 'Unassigned'}
                  onClick={() => handleCardClick(meal)}
                  onEdit={() => handleEdit(meal)}
                />
              </Fragment>
            )
          })
        })()}
      </div>

      {!isSearching && visibleMeals.length > 0 && (
        <AlphabetIndex availableLetters={availableLetters} onSelect={handleLetterSelect} />
      )}

      <Link
        to="/meals/new"
        onClick={(e) => {
          e.preventDefault()
          handleAddMeal()
        }}
        className={'all-meals__fab' + (fabCollapsed ? ' all-meals__fab--collapsed' : '')}
      >
        <img src={addIcon} alt="" className="all-meals__fab-icon" />
        <span className="all-meals__fab-label">Add Meal</span>
      </Link>
    </div>
  )
}
