import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'
import Logo from '../components/Logo'

export default function PostGame() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const { resetRoom } = useRoom()

  const { winner, finalScores = [], isCompetitive, tabSwitches = {} } = location.state || {}
  const socket = getSocket()

  const handlePlayAgain = () => navigate(`/room/${roomId}`)
  const handleLeave = () => {
    socket.emit('leave-room', { roomId, userId: user?.id })
    resetRoom()
    navigate('/')
  }

  const podiumOrder = finalScores.length >= 3 ? [finalScores[1], finalScores[0], finalScores[2]] : []
  const heights = ['h-24', 'h-36', 'h-20']
  const tones = ['bg-cyan', 'bg-yolk', 'bg-lime']
  const pos = [2, 1, 3]

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <Logo />
        <span className="chip bg-cream">game over</span>
      </nav>

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 pb-8 flex flex-col items-center">
        <div className="text-center mb-6 animate-pop-in">
          <h1 className="display text-6xl">game over!</h1>
          {winner && (
            <p className="font-body font-bold text-ink/70 uppercase tracking-wider mt-2">
              <span className="text-pink display text-2xl">{winner.username}</span> wins
            </p>
          )}
        </div>

        {podiumOrder.length === 3 && (
          <div className="flex items-end justify-center gap-3 mb-6">
            {podiumOrder.map((p, i) => (
              <div key={p?.id} className="flex flex-col items-center gap-2">
                <div className="text-3xl">{i === 1 ? '👑' : ''}</div>
                <div className="text-2xl">{p?.avatar}</div>
                <div className="display text-base">{p?.username}</div>
                <div className="display text-2xl text-pink">{p?.score}</div>
                <div className={`${heights[i]} ${tones[i]} w-24 border-[3px] border-ink flex items-start justify-center pt-2`}
                  style={{ boxShadow: '4px 4px 0 var(--ink)' }}>
                  <span className="display text-3xl">#{pos[i]}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="blok bg-cream p-5 w-full mb-5">
          <h3 className="display text-2xl mb-4">final scores</h3>
          <div className="flex flex-col gap-2">
            {finalScores.map((p, i) => (
              <div key={p.id} className={`blok-sm ${p.id === user?.id ? 'bg-yolk' : 'bg-cream'} px-3 py-2 flex items-center gap-3`}>
                <span className="display text-2xl w-7">{i + 1}</span>
                <span className="text-xl">{p.avatar}</span>
                <div className="flex-1">
                  <span className="display text-lg">{p.username}</span>
                  {isCompetitive && tabSwitches[p.id] > 0 && (
                    <span className="chip bg-pink text-cream text-[10px] py-0 px-1.5 ml-2">×{tabSwitches[p.id]}</span>
                  )}
                </div>
                <span className="display text-2xl text-pink">{p.score}</span>
                {i === 0 && <span className="display text-2xl">★</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <button onClick={handlePlayAgain} className="btn btn-pink flex-1 py-4 text-2xl">play again</button>
          <button onClick={handleLeave} className="btn btn-cream px-6 py-4">leave</button>
        </div>
      </div>
    </div>
  )
}
