import { useEffect, useRef, useState } from 'react'

// Fake multiplayer. There is no backend behind any of this: no round is
// published, no link resolves, and nobody is voting. The whole feature is a
// demo of the *shape* of a group decision — see FindMealResults.jsx for how it
// gates the round.
//
// The host is judge #1 and is counted the moment the group goes live. The rest
// trickle in on a timer so the pill visibly climbs instead of arriving
// fully-formed, which is the entire reason to fake it at all: a static "6
// Judges" reads as a label, a climbing one reads as people showing up.

export const MIN_JUDGES = 4
export const MAX_JUDGES = 10

// Gap between arrivals. Randomised inside the window so the cadence doesn't
// tick like a metronome — the whole point is that it should read as people
// tapping a link at their own pace, not a countdown.
const JOIN_DELAY_MIN_MS = 3000
const JOIN_DELAY_MAX_MS = 4000

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/**
 * Judge count for an active group, climbing from 1 to a randomly chosen total
 * between MIN_JUDGES and MAX_JUDGES. Returns 0 when no group is running.
 */
export function useGroupJudges(active) {
  const [count, setCount] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!active) {
      setCount(0)
      return undefined
    }

    // `current` is a per-effect-run local rather than state: the chain below
    // reads it to decide whether to schedule again, and reading it out of
    // state would either need a ref anyway or put a side effect inside a
    // setState updater — which StrictMode double-invokes, spawning two timer
    // chains for every arrival.
    const target = randomInt(MIN_JUDGES, MAX_JUDGES)
    let current = 1
    setCount(current)

    function scheduleNext() {
      if (current >= target) return
      timerRef.current = setTimeout(() => {
        current += 1
        setCount(current)
        scheduleNext()
      }, randomInt(JOIN_DELAY_MIN_MS, JOIN_DELAY_MAX_MS))
    }

    scheduleNext()
    return () => clearTimeout(timerRef.current)
  }, [active])

  return count
}

export function formatJudges(count) {
  return `${count} Food Fight ${count === 1 ? 'Judge' : 'Judges'}`
}

/**
 * The invite link. Nothing serves this route — it exists to have something
 * real-looking on the clipboard when the host pastes it into a group chat.
 */
export function buildInviteLink() {
  const token = Math.random().toString(36).slice(2, 10)
  return `${window.location.origin}/judge/${token}`
}
