export const MAIN_EVENT_HEADLINES = [
  { id: 'the-main-event', lines: ['The', 'Main', 'Event'] },
  { id: 'next-round-bite', lines: ['Next', 'Round', 'Bites'] },
  { id: 'bite-club-rules', lines: ['Bite', 'Club', 'Rules'] },
  { id: 'the-taste-tussle', lines: ['The', 'Taste', 'Tussle'] },
  { id: 'meal-time-melee', lines: ['Meal', 'Time', 'Melee'] },
  { id: 'your-dish-fight', lines: ['Your', 'Dish', 'Fight'] },
  { id: 'the-flavor-fight', lines: ['The', 'Flavor', 'Fight'] },
  { id: 'your-main-course', lines: ['Your', 'Main', 'Course'] },
  { id: 'next-meal-fight', lines: ['Next', 'Meal', 'Fight'] },
  { id: 'final-chomp-down', lines: ['Final', 'Chomp', 'Down'] },
  { id: 'meal-show-down', lines: ['Meal', 'Show', 'Down'] },
]

export function getMainEventHeadline(index) {
  return MAIN_EVENT_HEADLINES[index % MAIN_EVENT_HEADLINES.length]
}

// Fisher-Yates shuffle, kept local so this module has no dependency on ./random.
function shuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Picks a random headline different from currentId, cycling through every
// other headline once before any of them repeats. `queue` is the remaining
// shuffled order from the previous cycle; pass back the returned `queue` on
// the next call.
export function pickNextHeadline(currentId, queue = []) {
  let nextQueue = queue
  if (nextQueue.length === 0) {
    nextQueue = shuffle(MAIN_EVENT_HEADLINES.filter((h) => h.id !== currentId))
  }
  const [headline, ...rest] = nextQueue
  return { headline, queue: rest }
}
