import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'

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
    socket.once('room-created', ({ roomId, room }) => {
      updateRoom(room)
      navigate(`/room/${roomId}`)
    })
    socket.once('error', ({ message }) => addToast(message, 'error'))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen doodle-bg flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <h1 className="font-display text-4xl text-yellow font-bold">Drawzy!</h1>
        <div className="flex items-center gap-4">
          <span className="font-body text-white/60 text-sm">Hey, <span className="text-cream font-semibold">{user?.username}</span> {user?.avatar}</span>
          <button className="btn-secondary text-sm py-2 px-4" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
        <div className="text-center">
          <h2 className="font-display text-5xl text-cream font-bold mb-2">What'll it be?</h2>
          <p className="font-body text-white/50">Choose your adventure</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          <ActionCard
            emoji="🎮"
            title="Play"
            desc="Jump into a random room and start drawing"
            color="bg-coral"
            onClick={handlePlay}
          />
          <ActionCard
            emoji="👥"
            title="Groups"
            desc="Play with your squad, track your rivalry"
            color="bg-sky"
            onClick={() => navigate('/groups')}
          />
          <ActionCard
            emoji="🏆"
            title="Ranks"
            desc="See who's the best artist on the planet"
            color="bg-yellow"
            onClick={() => navigate('/leaderboard')}
          />
        </div>

        {/* Stats */}
        <div className="card flex gap-8 mt-4">
          <Stat label="Total Points" value={user?.total_points || 0} color="text-yellow" />
          <Stat label="Games Played" value={user?.games_played || 0} color="text-sky" />
          <Stat label="Games Won" value={user?.games_won || 0} color="text-mint" />
        </div>
      </div>
    </div>
  )
}

const ActionCard = ({ emoji, title, desc, color, onClick }) => (
  <button onClick={onClick}
    className={`${color} rounded-3xl p-6 text-left transition-all duration-150 active:scale-95 hover:brightness-110 shadow-xl group`}>
    <div className="text-4xl mb-3 group-hover:animate-wiggle">{emoji}</div>
    <h3 className="font-display text-2xl font-bold text-navy mb-1">{title}</h3>
    <p className="font-body text-navy/70 text-sm">{desc}</p>
  </button>
)

const Stat = ({ label, value, color }) => (
  <div className="text-center">
    <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
    <div className="font-body text-white/50 text-sm mt-1">{label}</div>
  </div>
)
