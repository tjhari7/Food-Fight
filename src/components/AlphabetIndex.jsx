import { useRef, useState } from 'react'
import './AlphabetIndex.css'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function AlphabetIndex({ availableLetters, onSelect }) {
  const barRef = useRef(null)
  const draggingRef = useRef(false)
  const [activeLetter, setActiveLetter] = useState(null)
  const [bubbleY, setBubbleY] = useState(0)

  function letterAtPoint(clientY) {
    const bar = barRef.current
    if (!bar) return null
    const rect = bar.getBoundingClientRect()
    const relY = Math.min(Math.max(clientY - rect.top, 0), rect.height - 1)
    const index = Math.floor((relY / rect.height) * LETTERS.length)
    return LETTERS[Math.min(Math.max(index, 0), LETTERS.length - 1)]
  }

  function handleAt(clientY) {
    const letter = letterAtPoint(clientY)
    if (!letter) return
    setActiveLetter(letter)
    setBubbleY(clientY)
    onSelect(letter)
  }

  function handlePointerDown(e) {
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    handleAt(e.clientY)
  }

  function handlePointerMove(e) {
    if (!draggingRef.current) return
    handleAt(e.clientY)
  }

  function handlePointerUp() {
    draggingRef.current = false
    setActiveLetter(null)
  }

  return (
    <>
      <div
        className="alphabet-index"
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {LETTERS.map((letter) => (
          <span
            key={letter}
            className={
              'alphabet-index__letter' +
              (availableLetters.has(letter) ? '' : ' alphabet-index__letter--empty') +
              (activeLetter === letter ? ' alphabet-index__letter--active' : '')
            }
          >
            {letter}
          </span>
        ))}
      </div>

      {activeLetter && (
        <div className="alphabet-index__bubble" style={{ top: bubbleY }}>
          <span className="alphabet-index__bubble-letter">{activeLetter}</span>
        </div>
      )}
    </>
  )
}
