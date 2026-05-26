import { useState, useEffect } from 'react'

const TONES = ['bg-lime', 'bg-yolk', 'bg-pink']
const LABELS = ['easy', 'medium', 'hard']

export default function WordPicker({ words, onPick, timeLimit = 20 }) {
  const [timeLeft, setTimeLeft] = useState(timeLimit)

  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'color-mix(in oklab, var(--ink) 70%, transparent)' }}>
      <div className="blok bg-cream w-full max-w-lg p-6 animate-pop-in mx-4">
        <div className="text-center mb-5">
          <h2 className="display text-4xl">pick a word!</h2>
          <p className="font-body font-bold text-ink/60 uppercase text-xs tracking-widest mt-1">{timeLeft}s or we'll pick</p>
          <div className="w-full h-3 border-[3px] border-ink mt-3">
            <div className="h-full bg-pink transition-all duration-1000" style={{ width: `${(timeLeft / timeLimit) * 100}%` }} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {words.map((word, i) => (
            <button key={word} onClick={() => onPick(word)}
              className={`btn ${i === 0 ? 'btn-lime' : i === 1 ? 'btn-yolk' : 'btn-pink'} w-full justify-between text-2xl py-4`}>
              <span>{word}</span>
              <span className="text-xs opacity-80">{LABELS[i]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
