import { useState, useRef, useEffect } from 'react'

export default function Chat({ messages, onGuess, isDrawer, disabled }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onGuess(input.trim())
    setInput('')
  }

  return (
    <div className="card flex flex-col h-full min-h-0">
      <h3 className="font-display text-xl text-cream mb-3">Guesses</h3>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 mb-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`px-3 py-2 rounded-xl text-sm font-body ${
            msg.type === 'correct' ? 'bg-mint/20 border border-mint text-mint font-semibold' :
            msg.type === 'system' ? 'text-white/40 text-center text-xs italic' :
            msg.type === 'tab' ? 'bg-red-600/20 border border-red-500 text-red-400 font-semibold' :
            'bg-navy text-cream'
          }`}>
            {msg.type === 'correct' && '✓ '}
            {msg.username && <span className="font-semibold text-yellow">{msg.username}: </span>}
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="input flex-1 text-sm py-2"
          placeholder={disabled ? 'You guessed it! 🎉' : 'Type a message...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={disabled}
          maxLength={50}
        />
        {!disabled && (
        <button type="submit" className="bg-yellow text-navy font-display font-bold px-4 rounded-2xl active:scale-95 transition-all">
            ↵
        </button>
    )}
      </form>
    </div>
  )
}
