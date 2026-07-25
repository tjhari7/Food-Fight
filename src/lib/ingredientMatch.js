const FILLER_PHRASES =
  /\b(i'?ve got|i have|i got|we have|we've got|there'?s|there is|in (my|the|our) fridge|for (the )?(dinner|fight|meal))\b/g

const STOPWORDS = new Set(['a', 'an', 'the', 'some', 'my', 'our', 'is', 'are', 'got'])

export function parseIngredientTranscript(transcript) {
  const cleaned = transcript.toLowerCase().replace(FILLER_PHRASES, ' ')

  return cleaned
    .split(/,|\band\b/)
    .map((part) =>
      part
        .trim()
        .split(/\s+/)
        .filter((word) => word && !STOPWORDS.has(word))
        .join(' ')
    )
    .filter((part) => part.length > 1)
}

export function mealMatchesIngredients(meal, terms) {
  if (!terms || terms.length === 0) return true

  const ingredientNames = (meal.ingredients || [])
    .map((ing) => (ing.name || '').toLowerCase().trim())
    .filter(Boolean)
  if (!ingredientNames.length) return false

  return terms.some((term) =>
    ingredientNames.some((name) => name.includes(term) || term.includes(name))
  )
}
