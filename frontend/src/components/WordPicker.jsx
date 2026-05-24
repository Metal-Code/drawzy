import { useState, useEffect } from 'react'

const DIFFICULTY_COLORS = { easy: 'bg-mint text-navy', medium: 'bg-yellow text-navy', hard: 'bg-coral text-white' }
const DIFFICULTY_LABELS = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' }

export default function WordPicker({ words, onPick, timeLimit = 20 }) {
  const [timeLeft, setTimeLeft] = useState(timeLimit)

  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  const difficulties = ['easy', 'medium', 'hard']

  return (
    <div className="fixed inset-0 bg-navy/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="card w-full max-w-lg animate-bounce-in">
        <div className="text-center mb-6">
          <h2 className="font-display text-3xl text-yellow">Choose your word!</h2>
          <p className="font-body text-white/50 text-sm mt-1">{timeLeft}s to pick or we'll pick for you</p>
          <div className="w-full h-1.5 bg-navy rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-yellow rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / timeLimit) * 100}%` }} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {words.map((word, i) => (
            <button key={word} onClick={() => onPick(word)}
              className={`${DIFFICULTY_COLORS[difficulties[i]]} rounded-2xl px-6 py-4 flex items-center justify-between font-display font-semibold text-xl transition-all active:scale-95 hover:brightness-110`}>
              <span>{word}</span>
              <span className="text-sm opacity-70">{DIFFICULTY_LABELS[difficulties[i]]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
