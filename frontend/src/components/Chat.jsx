import { useState, useRef, useEffect } from 'react'

export default function Chat({ messages, onGuess, isDrawer, disabled }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onGuess(input.trim())
    setInput('')
  }

  return (
    <div className="blok bg-cream p-3 flex flex-col min-h-0">
      <h3 className="display text-2xl mb-2">guesses</h3>
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 mb-2 min-h-0 pr-1">
        {messages.map((msg, i) => {
          if (msg.type === 'system') {
            return <div key={i} className="font-body text-ink/50 text-xs italic text-center py-1">{msg.text}</div>
          }
          if (msg.type === 'correct') {
            return (
              <div key={i} className="blok-sm bg-lime px-2 py-1.5 text-sm font-body font-bold flex items-center justify-between gap-2">
                <span><span className="display text-base">{msg.username}</span> {msg.text}</span>
                <span className="chip bg-cream text-[10px] py-0.5 px-1.5">correct!</span>
              </div>
            )
          }
          if (msg.type === 'tab') {
            return <div key={i} className="blok-sm bg-pink text-cream px-2 py-1.5 text-sm font-bold">{msg.text}</div>
          }
          return (
            <div key={i} className="px-2 py-1 text-sm font-body font-bold border-2 border-ink bg-cream">
              {msg.username && <span className="display text-base mr-1">{msg.username}:</span>}
              {msg.text}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="field text-sm py-2"
          placeholder={disabled ? "you got it!" : isDrawer ? "you're drawing..." : "type guess..."}
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
