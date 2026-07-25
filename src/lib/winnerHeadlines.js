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

const QUEUE_KEY = 'winnerHeadlineQueue'
const LAST_KEY = 'winnerHeadlineLast'

function loadQueue() {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue) {
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // sessionStorage unavailable (e.g. private browsing) — queue just won't persist
  }
}

export function getNextWinnerHeadline() {
  let queue = loadQueue()

  if (queue.length === 0) {
    const lastId = sessionStorage.getItem(LAST_KEY)
    queue = shuffle(WINNER_HEADLINES.map((h) => h.id))
    if (queue.length > 1 && queue[0] === lastId) {
      ;[queue[0], queue[1]] = [queue[1], queue[0]]
    }
  }

  const nextId = queue.shift()
  saveQueue(queue)
  try {
    sessionStorage.setItem(LAST_KEY, nextId)
  } catch {
    // ignore
  }

  return WINNER_HEADLINES.find((h) => h.id === nextId) || WINNER_HEADLINES[0]
}
