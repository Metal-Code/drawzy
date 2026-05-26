const TONES = ['bg-cyan', 'bg-lime', 'bg-yolk', 'bg-pink', 'bg-cream']

export default function Scoreboard({ players, currentDrawerId, tabSwitches = {}, currentUserId }) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="blok bg-cream p-3 flex flex-col gap-2 min-h-0 overflow-y-auto">
      <h3 className="display text-2xl mb-1">scores</h3>
      {sorted.map((p, i) => {
        const tone = p.id === currentUserId ? 'bg-yolk' : TONES[i % TONES.length]
        const isDrawer = p.id === currentDrawerId
        return (
          <div key={p.id} className={`blok-sm ${tone} px-2 py-2`}>
            <div className="flex items-center gap-2">
              <span className="display text-lg w-4">{i + 1}</span>
              <span className="text-lg">{p.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="display text-base truncate leading-none">{p.username}</div>
              </div>
              <span className="display text-xl">{p.score}</span>
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {isDrawer && <span className="chip bg-ink text-cream text-[9px] py-0 px-1.5">draw</span>}
              {p.hasGuessedCorrect && <span className="chip bg-lime text-[9px] py-0 px-1.5">✓</span>}
              {tabSwitches[p.id] > 0 && (
                <span className="chip bg-pink text-cream text-[9px] py-0 px-1.5">×{tabSwitches[p.id]}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
