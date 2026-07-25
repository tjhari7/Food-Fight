import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { createCategory, renameCategory, deleteCategory, UNASSIGNED_NAME } from '../api/categories'
import BackHeader from '../components/BackHeader'
import IconButton from '../components/IconButton'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import './ManageCategories.css'

export default function ManageCategories() {
  const { categories, loading, reload } = useData()
  const navigate = useNavigate()

  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    setError(null)
    try {
      await createCategory(name)
      await reload()
      setNewName('')
    } catch (err) {
      setError(err.message || 'Could not add meal type.')
    } finally {
      setAdding(false)
    }
  }

  function startEdit(category) {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  async function saveEdit(category) {
    const name = editingName.trim()
    if (!name || name === category.name) {
      setEditingId(null)
      return
    }
    setError(null)
    try {
      await renameCategory(category.id, name)
      await reload()
      setEditingId(null)
    } catch (err) {
      setError(err.message || 'Could not rename meal type.')
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setError(null)
    try {
      await deleteCategory(pendingDelete.id, categories)
      await reload()
    } catch (err) {
      setError(err.message || 'Could not delete meal type.')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <BackHeader onBack={() => navigate('/settings')} />
      </div>
      <h1 className="categories__title">Edit Meal Types</h1>

      {loading && <p className="eyebrow">Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="categories__list">
        {categories.map((category) => {
          const isUnassigned = category.name === UNASSIGNED_NAME
          const isEditing = editingId === category.id
          return (
            <div
              className={`category-row${isEditing ? ' category-row--editing' : ''}`}
              key={category.id}
              onClick={() => !isEditing && startEdit(category)}
            >
              {isEditing ? (
                <input
                  type="text"
                  className="category-row__input"
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => saveEdit(category)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(category)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
              ) : (
                <span className="category-row__name">{category.name}</span>
              )}

              <div className="category-row__actions" onClick={(e) => e.stopPropagation()}>
                <IconButton
                  name="edit"
                  label={`Rename ${category.name}`}
                  size={20}
                  onClick={() => startEdit(category)}
                />
                <IconButton
                  name="delete"
                  label={`Delete ${category.name}`}
                  size={20}
                  className="icon-btn--danger"
                  disabled={isUnassigned}
                  onClick={() => setPendingDelete(category)}
                />
              </div>
            </div>
          )
        })}
      </div>

      <form className="category-add" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="New meal type name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={adding || !newName.trim()}>
          Add
        </Button>
      </form>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this meal type?"
        message={`Meals in "${pendingDelete?.name}" will be reassigned to "Unassigned".`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
