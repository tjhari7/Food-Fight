// Display number is never stored — computed at render time from created_at
// order (rank when sorted oldest to newest) so it can't collide or gap.
export function getDisplayNumber(meals, mealId) {
  const sorted = [...meals].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id.localeCompare(b.id)
  )
  const index = sorted.findIndex((m) => m.id === mealId)
  if (index === -1) return null
  return `#${String(index + 1).padStart(3, '0')}`
}
