import { shuffle } from './random'

export const WINNER_HEADLINES = [
  { id: 'dinner-winner', text: 'The Dinner Winner', className: 'detail__winner-title--1' },
  { id: 'heavy-hitter', text: 'Heavy Hitter Dinner', className: 'detail__winner-title--2' },
  {
    id: 'last-meal-standing',
    lines: ['Last', 'Meal', 'Stands'],
    className: 'detail__winner-title--3',
  },
  { id: 'tonights-undisputed', text: 'Your Dinner Champ', className: 'detail__winner-title--4' },
  {
    id: 'served-by-the-bell',
    lines: ['Served', 'By The', 'Bell'],
    className: 'detail__winner-title--5',
  },
  {
    id: 'meal-of-the-ring',
    lines: ['Meal', 'Of The', 'Ring'],
    className: 'detail__winner-title--6',
  },
  {
    id: 'ring-ding-dinner',
    lines: ['Ring', 'Ding', 'Dinner'],
    className: 'detail__winner-title--7',
  },
  {
    id: 'heavyweight-meal',
    lines: ['Heavy', 'Weight', 'Meal'],
    className: 'detail__winner-title--8',
  },
  {
    id: 'now-chow-down',
    lines: ['Now', 'Chow', 'Down'],
    className: 'detail__winner-title--9',
  },
]

// Group rounds only, and deliberately a separate pool from WINNER_HEADLINES:
// these credit the room rather than the meal, so they'd read as a non sequitur
// on a solo win. Keeping them apart also keeps the two rotations independent —
// a group win never spends a slot from the solo queue, or the other way round.
export const JUDGES_HEADLINES = [
  { id: 'judges-decision', lines: ['The', 'Judges', 'Decision'], className: 'detail__winner-title--judges' },
  { id: 'crews-champ', lines: ['Your', 'Crews', 'Champ'], className: 'detail__winner-title--judges' },
  { id: 'crowds-winner', lines: ['The', 'Crowds', 'Winner'], className: 'detail__winner-title--judges' },
]

const QUEUE_KEY = 'winnerHeadlineQueue'
const LAST_KEY = 'winnerHeadlineLast'
const JUDGES_QUEUE_KEY = 'judgesHeadlineQueue'
const JUDGES_LAST_KEY = 'judgesHeadlineLast'

function readStored(key) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function loadQueue(key) {
  try {
    const raw = readStored(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(key, queue) {
  try {
    sessionStorage.setItem(key, JSON.stringify(queue))
  } catch {
    // sessionStorage unavailable (e.g. private browsing) — queue just won't persist
  }
}

// Deal from a shuffled queue and refill when it runs dry, never repeating the
// headline that came immediately before. The no-repeat swap matters most for
// the three-strong group pool, where a fresh shuffle lands on the previous
// headline a third of the time.
function nextFromPool(pool, queueKey, lastKey) {
  let queue = loadQueue(queueKey)

  if (queue.length === 0) {
    const lastId = readStored(lastKey)
    queue = shuffle(pool.map((h) => h.id))
    if (queue.length > 1 && queue[0] === lastId) {
      ;[queue[0], queue[1]] = [queue[1], queue[0]]
    }
  }

  const nextId = queue.shift()
  saveQueue(queueKey, queue)
  try {
    sessionStorage.setItem(lastKey, nextId)
  } catch {
    // ignore
  }

  return pool.find((h) => h.id === nextId) || pool[0]
}

export function getNextWinnerHeadline() {
  return nextFromPool(WINNER_HEADLINES, QUEUE_KEY, LAST_KEY)
}

export function getNextJudgesHeadline() {
  return nextFromPool(JUDGES_HEADLINES, JUDGES_QUEUE_KEY, JUDGES_LAST_KEY)
}
