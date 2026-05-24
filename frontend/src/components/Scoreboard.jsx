export default function Scoreboard({ players, currentDrawerId, tabSwitches = {} }) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="card flex flex-col gap-2">
      <h3 className="font-display text-xl text-cream mb-1">Scores</h3>
      {sorted.map((p, i) => (
        <div key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-2xl transition-all ${p.id === currentDrawerId ? 'bg-yellow/10 border border-yellow/30' : 'bg-navy'}`}>
          <span className="font-display text-lg text-white/30 w-5">{i + 1}</span>
          <span className="text-xl">{p.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-body font-semibold text-cream text-sm truncate">{p.username}</span>
              {p.id === currentDrawerId && <span className="text-xs">✏️</span>}
              {tabSwitches[p.id] > 0 && <span className="text-xs" title={`Switched tabs ${tabSwitches[p.id]} times`}>👀</span>}
              {p.hasGuessedCorrect && <span className="text-xs">✓</span>}
            </div>
          </div>
          <span className="font-display font-bold text-yellow text-lg">{p.score}</span>
        </div>
      ))}
    </div>
  )
}
