import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'

export default function Leaderboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/leaderboard').then(res => {
      setPlayers(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const myRank = user && !user.isGuest ? players.findIndex(p => p.id === user.id) + 1 : null
  const MEDALS = { 1: 'gold', 2: 'silver', 3: 'bronze' }

  return (
    <div className="min-h-screen doodle-bg flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <button onClick={() => navigate(user ? '/home' : '/')} className="font-display text-4xl text-yellow font-bold">Drawzy!</button>
        <h2 className="font-display text-3xl text-cream">Leaderboard</h2>
        <div className="w-24" />
      </nav>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-white/40 font-body">Loading...</div>
      ) : (
        <div className="flex-1 px-4 pb-8 max-w-2xl mx-auto w-full pt-6">
          {user?.isGuest && (
            <div className="card border-yellow/30 border-2 mb-4 text-center">
              <p className="font-body text-yellow text-sm">Register to appear on the leaderboard!</p>
            </div>
          )}
          <div className="card">
            {players.map((p, i) => {
              const isMe = p.id === user?.id
              const rank = i + 1
              const medal = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : null
              return (
                <div key={p.id} className={`flex items-center gap-4 px-4 py-3 rounded-2xl mb-1 ${isMe ? 'bg-yellow/10 border border-yellow/40' : ''}`}>
                  <span className="font-display font-bold text-xl w-8 text-center text-white/40">{rank}</span>
                  <span className="text-2xl">{p.avatar}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-body font-semibold text-cream">{p.username}</span>
                      {isMe && <span className="text-xs bg-yellow/20 text-yellow px-2 py-0.5 rounded-full font-semibold">You</span>}
                    </div>
                    <span className="font-body text-white/30 text-xs">{p.games_played} games · {p.games_won} wins</span>
                  </div>
                  <span className="font-display font-bold text-yellow text-xl">{p.total_points}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
