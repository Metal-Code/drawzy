import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import Logo from '../components/Logo'

export default function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { getSocket } = useSocket()
  const { updateRoom } = useRoom()
  const { addToast } = useToast()

  const handlePlay = () => {
    const socket = getSocket()
    socket.emit('create-room', {
      user: { userId: user.id, username: user.username, avatar: user.avatar, isGuest: false },
      settings: { rounds: 3, drawTime: 60, difficulty: 'easy', isCompetitive: false }
    })
    socket.once('room-created', ({ roomId, room }) => { updateRoom(room); navigate(`/room/${roomId}`) })
    socket.once('error', ({ message }) => addToast(message, 'error'))
  }

  const handleLogout = async () => { await logout(); navigate('/') }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="chip bg-cream">hey {user?.username} {user?.avatar}</span>
          <button className="btn btn-sm btn-cream" onClick={handleLogout}>logout</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8 max-w-5xl mx-auto w-full">
        <div className="text-center">
          <h2 className="display text-6xl md:text-7xl">what'll it be?</h2>
          <p className="font-body font-bold text-ink/70 uppercase tracking-wider mt-2">pick your poison</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <ActionCard tone="bg-pink" text="cream" icon="▶" title="play" desc="jump into a fresh room" onClick={handlePlay} />
          <ActionCard tone="bg-cyan" text="ink" icon="◆" title="groups" desc="play with your squad" onClick={() => navigate('/groups')} />
          <ActionCard tone="bg-yolk" text="ink" icon="★" title="ranks" desc="see the top scribblers" onClick={() => navigate('/leaderboard')} />
        </div>

        <div className="blok bg-cream flex gap-8 md:gap-12 px-8 py-5">
          <Stat label="points" value={user?.total_points || 0} />
          <Stat label="played" value={user?.games_played || 0} />
          <Stat label="won" value={user?.games_won || 0} />
        </div>
      </div>
    </div>
  )
}

const ActionCard = ({ tone, text, icon, title, desc, onClick }) => (
  <button onClick={onClick} className={`blok ${tone} press p-6 text-left`}>
    <div className={`display text-5xl mb-2 ${text === 'cream' ? 'text-cream' : 'text-ink'}`}>{icon}</div>
    <h3 className={`display text-4xl mb-1 ${text === 'cream' ? 'text-cream' : 'text-ink'}`}>{title}</h3>
    <p className={`font-body font-bold text-sm uppercase tracking-wider ${text === 'cream' ? 'text-cream/80' : 'text-ink/70'}`}>{desc}</p>
  </button>
)

const Stat = ({ label, value }) => (
  <div className="text-center">
    <div className="display text-4xl">{value}</div>
    <div className="font-body font-bold text-ink/60 text-xs uppercase tracking-widest mt-1">{label}</div>
  </div>
)
