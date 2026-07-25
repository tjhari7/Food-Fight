import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { createMeal, updateMeal, deleteMeal } from '../api/meals'
import { UNASSIGNED_NAME } from '../api/categories'
import Button from '../components/Button'
import IconButton from '../components/IconButton'
import ConfirmDialog from '../components/ConfirmDialog'
import './AddEditMeal.css'

const emptyIngredient = () => ({ name: '', amount: '' })

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function toIntOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = parseInt(value, 10)
  return Number.isNaN(n) ? null : n
}

export default function AddEditMeal() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const { meals, categories, loading, reload } = useData()

  const existingMeal = useMemo(
    () => (isEdit ? meals.find((m) => m.id === id) : null),
    [isEdit, meals, id]
  )

  const unassigned = categories.find((c) => c.name === UNASSIGNED_NAME)

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatsG, setFatsG] = useState('')
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [initialized, setInitialized] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (initialized) return
    if (isEdit) {
      if (!existingMeal) return
      setTitle(existingMeal.title ?? '')
      setCategoryId(existingMeal.category_id ?? '')
      setPrepTime(existingMeal.prep_time ?? '')
      setCookTime(existingMeal.cook_time ?? '')
      setProteinG(existingMeal.protein_g ?? '')
      setCarbsG(existingMeal.carbs_g ?? '')
      setFatsG(existingMeal.fats_g ?? '')
      setIngredients(
        existingMeal.ingredients?.length ? existingMeal.ingredients : [emptyIngredient()]
      )
      setInitialized(true)
    } else if (unassigned) {
      setCategoryId(unassigned.id)
      setInitialized(true)
    }
  }, [isEdit, existingMeal, unassigned, initialized])

  const returnTo = location.state?.returnTo

  function goBack() {
    if (returnTo) navigate(returnTo.pathname, { state: returnTo.state })
    else if (isEdit && existingMeal) navigate(`/meals/${existingMeal.id}`)
    else navigate('/')
  }

  async function handleConfirmDelete() {
    await deleteMeal(id)
    await reload()
    setConfirmingDelete(false)
    // returnTo may point at this meal's detail page, which no longer exists
    // after deleting — fall back to that page's own returnTo, then the list.
    if (returnTo && returnTo.pathname !== `/meals/${id}`) {
      navigate(returnTo.pathname, { state: returnTo.state, replace: true })
    } else if (returnTo?.state?.returnTo) {
      const nested = returnTo.state.returnTo
      navigate(nested.pathname, { state: nested.state, replace: true })
    } else {
      navigate('/meals', { replace: true })
    }
  }

  function updateIngredient(index, field, value) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    )
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, emptyIngredient()])
  }

  function removeIngredientRow(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    setError(null)

    const cleanIngredients = ingredients
      .map((ing) => ({ name: ing.name.trim(), amount: ing.amount.trim() }))
      .filter((ing) => ing.name || ing.amount)

    const payload = {
      title: title.trim(),
      category_id: categoryId || unassigned?.id,
      prep_time: toIntOrNull(prepTime),
      cook_time: toIntOrNull(cookTime),
      protein_g: toNumberOrNull(proteinG),
      carbs_g: toNumberOrNull(carbsG),
      fats_g: toNumberOrNull(fatsG),
      ingredients: cleanIngredients,
    }

    try {
      let saved
      if (isEdit) {
        saved = await updateMeal(id, payload)
      } else {
        saved = await createMeal(payload)
      }
      await reload()
      if (returnTo) {
        navigate(returnTo.pathname, { state: returnTo.state, replace: true })
      } else {
        navigate(`/meals/${saved.id}`, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong saving this meal.')
      setSaving(false)
    }
  }

  if (loading || (isEdit && !existingMeal)) {
    return (
      <div className="page">
        <p className="eyebrow">Loading…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <button type="button" className="form-cancel" onClick={goBack}>
          Cancel
        </button>
        {isEdit && (
          <IconButton
            name="delete"
            label="Delete meal"
            size={20}
            className="icon-btn--filled icon-btn--danger"
            onClick={() => setConfirmingDelete(true)}
          />
        )}
      </div>

      <h1 className="form-title">{isEdit ? 'Edit Meal' : 'Add New Meal'}</h1>

      <form className="meal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="eyebrow">Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meal title"
            required
          />
        </label>

        <label className="field">
          <span className="eyebrow">Meal Type</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            <span className="eyebrow">Prep time (min)</span>
            <input
              type="number"
              min="0"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="eyebrow">Cook time (min)</span>
            <input
              type="number"
              min="0"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
            />
          </label>
        </div>

        <div className="field-row field-row--three">
          <label className="field">
            <span className="eyebrow">Protein (g)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={proteinG}
              onChange={(e) => setProteinG(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="eyebrow">Carbs (g)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={carbsG}
              onChange={(e) => setCarbsG(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="eyebrow">Fats (g)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={fatsG}
              onChange={(e) => setFatsG(e.target.value)}
            />
          </label>
        </div>

        <div className="field">
          <span className="eyebrow">Ingredients</span>
          <div className="ingredient-rows">
            {ingredients.map((ing, i) => (
              <div className="ingredient-row" key={i}>
                <input
                  type="text"
                  placeholder="Name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Amount"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                />
                <IconButton
                  name="close"
                  label="Remove ingredient"
                  onClick={() => removeIngredientRow(i)}
                  disabled={ingredients.length === 1}
                />
              </div>
            ))}
          </div>
          <button type="button" className="add-ingredient" onClick={addIngredientRow}>
            <span className="material-symbols-outlined">add</span> Add ingredient
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <Button type="submit" variant="primary" className="btn--full" disabled={saving}>
          {saving ? 'Saving…' : 'Save Meal'}
        </Button>
      </form>

      {isEdit && (
        <ConfirmDialog
          open={confirmingDelete}
          title="Delete this meal?"
          message={`"${existingMeal?.title}" will be permanently removed.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}
