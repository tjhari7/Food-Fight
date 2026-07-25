const UNIT_WORD =
  '(?:g|grams?|oz|ounces?|cups?|tbsp|tablespoons?|tsp|teaspoons?|lbs?|pounds?|ml|l|liters?|cloves?|pieces?|slices?)'

const LEADING_AMOUNT = new RegExp(`^(\\d+(?:\\.\\d+)?\\s*${UNIT_WORD}?)\\s+(.+)$`, 'i')
const TRAILING_AMOUNT = new RegExp(`^(.+?)\\s+(\\d+(?:\\.\\d+)?\\s*${UNIT_WORD}?)$`, 'i')
const BARE_TIME = /(\d+)\s*(?:minutes?|mins?)\b/i
const INGREDIENT_LABEL = /^ingredients?\b\s*(?:include[s]?|are|is|:)?\s*/i

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Matches a labeled time clause in either word order: "prep time 5 minutes"
// or "5 minutes prep".
function matchTime(segment, keyword) {
  const labelThenAmount = new RegExp(
    `\\b${keyword}\\b(?:\\s*time)?[^\\d]{0,15}(\\d+)\\s*(?:minutes?|mins?)\\b`,
    'i'
  )
  const amountThenLabel = new RegExp(
    `(\\d+)\\s*(?:minutes?|mins?)\\b[^a-z]{0,15}${keyword}\\b`,
    'i'
  )
  return (segment.match(labelThenAmount) || segment.match(amountThenLabel) || [])[1] || null
}

// Matches a labeled macro clause in either word order: "protein 5 grams"
// or "5 grams protein".
function matchMacro(segment, keyword) {
  const labelThenAmount = new RegExp(`\\b${keyword}\\b[^\\d]{0,15}(\\d+(?:\\.\\d+)?)`, 'i')
  const amountThenLabel = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:g|grams?)?\\s*${keyword}\\b`, 'i')
  return (segment.match(labelThenAmount) || segment.match(amountThenLabel) || [])[1] || null
}

function stripIngredientLabel(segment) {
  if (INGREDIENT_LABEL.test(segment)) {
    return { isLabel: true, rest: segment.replace(INGREDIENT_LABEL, '').trim() }
  }
  return { isLabel: false, rest: segment }
}

function splitNameAmount(segment) {
  const trimmed = segment.trim()
  if (!trimmed) return { name: '', amount: '' }

  const leading = trimmed.match(LEADING_AMOUNT)
  if (leading) return { name: leading[2].trim(), amount: leading[1].trim() }

  const trailing = trimmed.match(TRAILING_AMOUNT)
  if (trailing) return { name: trailing[1].trim(), amount: trailing[2].trim() }

  return { name: trimmed, amount: '' }
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str
}

// Parses a rambling voice transcript into meal form fields. Ingredient/title
// boundaries are inherently ambiguous in free-form speech (e.g. "chocolate"
// could be the dish name or an ingredient) - this is a best-effort heuristic,
// not exact extraction, so the user should review the filled-in fields. Once
// any labeled clause (time, macro, category, an "ingredient(s)" marker) has
// been seen, later unlabeled clauses are treated as ingredients rather than
// competing for the title.
export function parseMealTranscript(transcript, categories = []) {
  const sortedCategories = [...categories].sort((a, b) => b.name.length - a.name.length)

  const segments = transcript
    .trim()
    .replace(/\s+/g, ' ')
    .split(/,|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean)

  let title = ''
  let categoryId = null
  let prepTime = null
  let cookTime = null
  let proteinG = null
  let carbsG = null
  let fatsG = null
  let structuredSeen = false
  let ingredientsStarted = false
  const ingredients = []

  for (const rawSegment of segments) {
    if (ingredientsStarted) {
      ingredients.push(splitNameAmount(rawSegment))
      continue
    }

    // Snapshot before this segment can add its own structured data, so a
    // meal type mentioned in the same breath as the title ("tacos mexican")
    // doesn't retroactively disqualify the leftover text from being the title.
    const structuredBefore = structuredSeen
    let segment = rawSegment

    if (!categoryId) {
      const match = sortedCategories.find((c) =>
        new RegExp(`\\b${escapeRegExp(c.name)}\\b`, 'i').test(segment)
      )
      if (match) {
        categoryId = match.id
        segment = segment.replace(new RegExp(`\\b${escapeRegExp(match.name)}\\b`, 'i'), '').trim()
        structuredSeen = true
        if (!segment) continue
      }
    }

    if (prepTime === null) {
      const prep = matchTime(segment, 'prep')
      if (prep) {
        prepTime = prep
        structuredSeen = true
        continue
      }
    }

    if (cookTime === null) {
      const cook = matchTime(segment, 'cook') || (segment.match(BARE_TIME) || [])[1]
      if (cook) {
        cookTime = cook
        structuredSeen = true
        continue
      }
    }

    if (proteinG === null) {
      const protein = matchMacro(segment, 'protein')
      if (protein) {
        proteinG = protein
        structuredSeen = true
        continue
      }
    }

    if (carbsG === null) {
      const carbs = matchMacro(segment, 'carbs?')
      if (carbs) {
        carbsG = carbs
        structuredSeen = true
        continue
      }
    }

    if (fatsG === null) {
      const fats = matchMacro(segment, 'fats?')
      if (fats) {
        fatsG = fats
        structuredSeen = true
        continue
      }
    }

    const labeled = stripIngredientLabel(segment)
    if (labeled.isLabel) {
      ingredientsStarted = true
      structuredSeen = true
      if (labeled.rest) ingredients.push(splitNameAmount(labeled.rest))
      continue
    }

    if (!title && !structuredBefore) {
      title = capitalize(segment)
    } else {
      ingredients.push(splitNameAmount(segment))
    }
  }

  return {
    title,
    categoryId,
    prepTime,
    cookTime,
    proteinG,
    carbsG,
    fatsG,
    ingredients: ingredients.filter((ing) => ing.name),
  }
}
