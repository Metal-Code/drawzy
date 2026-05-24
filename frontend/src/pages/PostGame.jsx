import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'

export default function PostGame() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const { room, updateRoom, resetRoom } = useRoom()

  const { winner, finalScores = [], isCompetitive, tabSwitches = {} } = location.state || {}

  const socket = getSocket()

  const handlePlayAgain = () => {
    navigate(`/room/${roomId}`)
  }

  const handleLeave = () => {
    socket.emit('leave-room', { roomId, userId: user?.id })
    resetRoom()
    navigate('/')
  }

  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen doodle-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8 animate-bounce-in">
          <div className="text-6xl mb-3">🎉</div>
          <h1 className="font-display text-5xl font-bold text-yellow">Game Over!</h1>
          {winner && (
            <p className="font-body text-white/60 text-lg mt-2">
              <span className="text-cream font-semibold">{winner.username}</span> wins! 🏆
            </p>
          )}
        </div>

        {/* Podium */}
        {finalScores.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {[finalScores[1], finalScores[0], finalScores[2]].map((p, i) => {
              const heights = ['h-20', 'h-28', 'h-16']
              const colors = ['bg-white/20', 'bg-yellow', 'bg-orange-400']
              const pos = [1, 0, 2]
              return (
                <div key={p?.id} className="flex flex-col items-center gap-2">
                  <div className="text-2xl">{p?.avatar}</div>
                  <div className="font-display font-bold text-cream text-sm">{p?.username}</div>
                  <div className="font-display font-bold text-yellow">{p?.score}</div>
                  <div className={`${heights[i]} ${colors[i]} w-20 rounded-t-2xl flex items-start justify-center pt-2`}>
                    <span className="text-2xl">{MEDALS[pos[i]]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full scoreboard */}
        <div className="card mb-6 animate-slide-up">
          <h3 className="font-display text-xl text-cream mb-4">Final Scores</h3>
          <div className="flex flex-col gap-2">
            {finalScores.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl ${p.id === user?.id ? 'bg-yellow/10 border border-yellow/30' : 'bg-navy'}`}>
                <span className="font-display text-lg font-bold text-white/30 w-6">{i + 1}</span>
                <span className="text-xl">{p.avatar}</span>
                <div className="flex-1">
                  <span className="font-body font-semibold text-cream">{p.username}</span>
                  {isCompetitive && tabSwitches[p.id] > 0 && (
                    <span className="ml-2 text-xs text-red-400">👀 ×{tabSwitches[p.id]}</span>
                  )}
                </div>
                <span className="font-display font-bold text-yellow text-xl">{p.score}</span>
                {i === 0 && <span>🏆</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button onClick={handlePlayAgain} className="btn-primary flex-1 py-4 text-xl">
            🎮 Play Again
          </button>
          <button onClick={handleLeave} className="btn-secondary px-6 py-4">
            🏠 Leave
          </button>
        </div>
      </div>
    </div>
  )
}
