import { useEffect, useState } from 'react'
import { playSound } from '../utils/helpers'

export default function Timer({ duration, onEnd, active }) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    setTimeLeft(duration)
  }, [duration])

  useEffect(() => {
    if (!active) return
    if (timeLeft <= 0) { onEnd?.(); return }
    if (timeLeft <= 5) playSound('tick')
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, active])

  const pct = (timeLeft / duration) * 100
  const color = timeLeft > duration * 0.5 ? '#6BCB77' : timeLeft > duration * 0.2 ? '#FFD93D' : '#FF6B6B'
  const urgent = timeLeft <= 10

  return (
    <div className="flex items-center gap-3">
      <div className={`font-display text-3xl font-bold w-14 text-center ${urgent ? 'text-coral animate-pulse' : 'text-cream'}`}>
        {timeLeft}
      </div>
      <div className="flex-1 h-3 bg-navy rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgent ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
