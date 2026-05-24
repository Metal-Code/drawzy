import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import { generateGuestId } from '../utils/helpers'
import { v4 as uuidv4 } from 'uuid'
import { connectSocket } from '../utils/socket'

const AVATARS = ['🐱', '🐶', '🦊', '🐸', '🐼', '🦁', '🐯', '🐨', '🐮', '🐷', '🦄', '🐙']

export default function Landing() {
  const { user, loading: authLoading, login, register, loginAsGuest, clearGuest } = useAuth()
  const navigate = useNavigate()
  // const { getSocket } = useSocket()
  const { updateRoom } = useRoom()
  const { addToast } = useToast()

  const [mode, setMode] = useState(null) // 'guest' | 'login' | 'register' | 'join'
  const [guestName, setGuestName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState('🐱')
  const [formSubmitting, setFormSubmitting] = useState(false)
  useEffect(() => {
    localStorage.removeItem('drawzy_guest')
}, [])

  if (authLoading) return null
  if (user && !user.isGuest) return <Navigate to="/home" replace />

  const handleGuestPlay = async () => {
  if (!guestName.trim()) return addToast('Enter a username!', 'warning')
  const id = generateGuestId()
  loginAsGuest(guestName.trim(), id)
  const socket = connectSocket()
  socket.emit('create-room', {
    user: { userId: id, username: guestName.trim(), avatar: '🎨', isGuest: true },
    settings: { rounds: 3, drawTime: 60, difficulty: 'easy', isCompetitive: false }
  })
  socket.once('room-created', ({ roomId, room }) => {
    updateRoom(room)
    navigate(`/room/${roomId}`)
  })
  socket.once('error', ({ message }) => addToast(message, 'error'))
}

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return addToast('Enter a room code!', 'warning')
    if (!user && !guestName.trim()) return addToast('Enter a username first!', 'warning')
    const id = user ? user.id : generateGuestId()
    const uname = user ? user.username : guestName.trim()
    if (!user) loginAsGuest(uname, id)
    const socket = connectSocket()
    socket.emit('join-room', { roomId: joinCode.toUpperCase(), userId: id, username: uname, avatar: user?.avatar || '🎨', isGuest: !user })
    socket.once('room-joined', ({ roomId, room }) => {
      updateRoom(room)
      navigate(`/room/${roomId}`)
    })
    socket.once('error', ({ message }) => addToast(message, 'error'))
  }

  const handleLogin = async () => {
    if (!username || !password) return addToast('Fill in all fields', 'warning')
    setFormSubmitting(true)
    try {
      await login(username, password)
      navigate('/home')
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleRegister = async () => {
    if (!username || !password) return addToast('Fill in all fields', 'warning')
    setFormSubmitting(true)
    try {
      await register(username, password, avatar)
      navigate('/home')
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen doodle-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Floating doodles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['✏️','🎨','🖌️','⭐','💡','❓','🎯','🖍️'].map((emoji, i) => (
          <div key={i} className="absolute text-3xl opacity-20 animate-float" style={{
            left: `${10 + i * 12}%`, top: `${15 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.4}s`, animationDuration: `${3 + i * 0.3}s`
          }}>{emoji}</div>
        ))}
      </div>

      {/* Logo */}
      <div className="text-center mb-10 animate-bounce-in">
        <h1 className="font-display text-7xl md:text-8xl font-bold text-yellow drop-shadow-lg">
          Drawzy
          <span className="text-coral">!</span>
        </h1>
        <p className="font-body text-white/60 text-xl mt-2">Draw badly. Guess wildly. Win gloriously.</p>
      </div>

      {/* Main card */}
      {!mode && (
        <div className="card w-full max-w-md animate-slide-up flex flex-col gap-4">
          <button className="btn-primary w-full text-xl py-4" onClick={() => setMode('guest')}>
            🎮 Play Now (Guest)
          </button>
          <button className="btn-secondary w-full text-xl py-4" onClick={() => setMode('join')}>
            🔑 Join a Room
          </button>
          <div className="flex gap-3">
            <button className="btn-coral flex-1" onClick={() => setMode('login')}>Login</button>
            <button className="btn-mint flex-1" onClick={() => setMode('register')}>Register</button>
          </div>
          <p className="text-center text-white/40 text-sm">Register to save scores & join groups</p>
        </div>
      )}

      {/* Guest modal */}
      {mode === 'guest' && (
        <div className="card w-full max-w-md animate-bounce-in">
          <h2 className="font-display text-3xl text-yellow mb-6">Play as Guest</h2>
          <input 
            className="input mb-4" 
            placeholder="Your username" 
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            autoComplete="off"
            onKeyDown={e => e.key === 'Enter' && handleGuestPlay()} 
          />
          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={handleGuestPlay}>Let's Go! 🚀</button>
            <button className="btn-secondary px-4" onClick={() => setMode(null)}>Back</button>
          </div>
        </div>
      )}

      {/* Join room modal */}
      {mode === 'join' && (
        <div className="card w-full max-w-md animate-bounce-in">
          <h2 className="font-display text-3xl text-sky mb-6">Join a Room</h2>
          <input className="input mb-3" placeholder="Your username (if guest)" value={guestName}
            onChange={e => setGuestName(e.target.value)} />
          <input className="input mb-4 uppercase tracking-widest font-display text-xl font-bold" placeholder="Room Code"
            value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6} onKeyDown={e => e.key === 'Enter' && handleJoinRoom()} />
          <div className="flex gap-3">
            <button className="btn-primary flex-1" onClick={handleJoinRoom}>Join Room 🎯</button>
            <button className="btn-secondary px-4" onClick={() => setMode(null)}>Back</button>
          </div>
        </div>
      )}

      {/* Login modal */}
      {mode === 'login' && (
        <div className="card w-full max-w-md animate-bounce-in">
          <h2 className="font-display text-3xl text-coral mb-6">Welcome Back!</h2>
          <input className="input mb-3" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)} />
          <input className="input mb-5" type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <div className="flex gap-3">
            <button className="btn-coral flex-1" onClick={handleLogin} disabled={formSubmitting}>
              {formSubmitting ? 'Logging in...' : 'Login 🔓'}
            </button>
            <button className="btn-secondary px-4" onClick={() => setMode(null)}>Back</button>
          </div>
          <p className="text-center text-white/40 text-sm mt-4 cursor-pointer hover:text-white/60" onClick={() => setMode('register')}>
            No account? Register →
          </p>
        </div>
      )}

      {/* Register modal */}
      {mode === 'register' && (
        <div className="card w-full max-w-md animate-bounce-in">
          <h2 className="font-display text-3xl text-mint mb-6">Join Drawzy!</h2>
          <input className="input mb-3" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)} />
          <input className="input mb-4" type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} />
          <p className="font-body text-white/50 text-sm mb-3">Pick an avatar</p>
          <div className="grid grid-cols-6 gap-2 mb-5">
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)}
                className={`text-2xl p-2 rounded-xl transition-all ${avatar === a ? 'bg-yellow scale-110' : 'bg-navy hover:bg-navy-light'}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="btn-mint flex-1" onClick={handleRegister} disabled={formSubmitting}>
              {formSubmitting ? 'Creating...' : 'Create Account 🎉'}
            </button>
            <button className="btn-secondary px-4" onClick={() => setMode(null)}>Back</button>
          </div>
        </div>
      )}
    </div>
  )
}