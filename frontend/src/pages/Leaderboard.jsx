import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import Logo from '../components/Logo'

export default function Leaderboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/leaderboard').then(res => { setPlayers(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const TONES = ['bg-yolk', 'bg-cyan', 'bg-lime']

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <Logo to={user ? '/home' : '/'} />
        <h2 className="display text-3xl">ranks</h2>
        <button onClick={() => navigate(user ? '/home' : '/')} className="btn btn-sm btn-cream">back</button>
      </nav>

      {loading ? (
        <div className="flex-1 flex items-center justify-center display text-2xl text-ink/50">loading...</div>
      ) : (
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 pb-8">
          {user?.isGuest && (
            <div className="blok bg-yolk p-3 mb-4 text-center">
              <p className="display text-lg">register to appear on the leaderboard!</p>
            </div>
          )}
          <div className="blok bg-cream p-4 flex flex-col gap-2">
            {players.map((p, i) => {
              const rank = i + 1
              const isMe = p.id === user?.id
              const tone = isMe ? 'bg-pink' : (rank <= 3 ? TONES[rank - 1] : 'bg-cream')
              const cream = isMe
              return (
                <div key={p.id} className={`blok-sm ${tone} px-3 py-3 flex items-center gap-3`}>
                  <span className={`display text-3xl w-10 text-center ${cream ? 'text-cream' : ''}`}>{rank}</span>
                  <span className="text-2xl">{p.avatar}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`display text-xl ${cream ? 'text-cream' : ''}`}>{p.username}</span>
                      {isMe && <span className="chip bg-cream text-[10px] py-0 px-1.5">you</span>}
                    </div>
                    <span className={`font-body font-bold uppercase tracking-wider text-[10px] ${cream ? 'text-cream/80' : 'text-ink/60'}`}>
                      {p.games_played} games · {p.games_won} wins
                    </span>
                  </div>
                  <span className={`display text-2xl ${cream ? 'text-cream' : 'text-pink'}`}>{p.total_points}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
