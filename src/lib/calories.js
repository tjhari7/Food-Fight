// Calories are derived from macros (4 cal/g protein & carbs, 9 cal/g fat)
// and displayed rounded to the nearest 10 (>=5 rounds up, <=4 rounds down).
export function calcCalories(protein, carbs, fats) {
  const raw = (protein || 0) * 4 + (carbs || 0) * 4 + (fats || 0) * 9
  return Math.round(raw / 10) * 10
}
