import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import './FiltersDropdown.css'

export default function FiltersDropdown({ categories, filters, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const categoryIds = filters.categoryIds || []

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function toggleCategory(id) {
    const next = categoryIds.includes(id)
      ? categoryIds.filter((c) => c !== id)
      : [...categoryIds, id]
    onChange({ ...filters, categoryIds: next })
  }

  return (
    <div className="filters-dropdown" ref={wrapRef}>
      <button
        type="button"
        className={
          'filters-dropdown__btn' + (categoryIds.length ? ' filters-dropdown__btn--active' : '')
        }
        aria-label="Filter meals"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="tune" className="filters-dropdown__icon" />
        <span className="filters-dropdown__label">Filter Meals</span>
      </button>

      {open && (
        <div className="filters-dropdown__popover">
          {categories.map((c) => {
            const checked = categoryIds.includes(c.id)
            return (
              <label key={c.id} className="filters-dropdown__option">
                <input type="checkbox" checked={checked} onChange={() => toggleCategory(c.id)} />
                <span>{c.name}</span>
              </label>
            )
          })}
          {categoryIds.length > 0 && (
            <button
              type="button"
              className="filters-dropdown__clear"
              onClick={() => onChange({ ...filters, categoryIds: [] })}
            >
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  )
}
