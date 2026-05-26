import { useEffect, useState } from 'react'
import { playSound } from '../utils/helpers'

export default function Timer({ duration, onEnd, active }) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => { setTimeLeft(duration) }, [duration])

  useEffect(() => {
    if (!active) return
    if (timeLeft <= 0) { onEnd?.(); return }
    if (timeLeft <= 5) playSound('tick')
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, active])

  const pct = Math.max(0, (timeLeft / duration) * 100)
  const ratio = timeLeft / duration
  const fill = ratio > 0.5 ? 'var(--lime)' : ratio > 0.2 ? 'var(--yolk)' : 'var(--pink)'
  const urgent = timeLeft <= 10

  return (
    <div className={`flex items-center gap-3 ${urgent ? 'animate-shake' : ''}`}>
      <div className={`display text-4xl w-14 text-center ${urgent ? 'text-pink' : 'text-ink'}`}>{timeLeft}</div>
      <div className="flex-1 h-5 border-[3px] border-ink bg-cream relative overflow-hidden">
        <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: fill }} />
      </div>
    </div>
  )
}
