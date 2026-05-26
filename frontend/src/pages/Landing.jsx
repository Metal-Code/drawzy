import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRoom } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import { generateGuestId } from '../utils/helpers'
import { connectSocket } from '../utils/socket'

const AVATARS = ['🐱', '🐶', '🦊', '🐸', '🐼', '🦁', '🐯', '🐨', '🐮', '🐷', '🦄', '🐙']
const TONES = ['bg-pink', 'bg-cyan', 'bg-lime', 'bg-yolk']

export default function Landing() {
  const { user, loading: authLoading, login, register, loginAsGuest } = useAuth()
  const navigate = useNavigate()
  const { updateRoom } = useRoom()
  const { addToast } = useToast()

  const [mode, setMode] = useState(null)
  const [guestName, setGuestName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState('🐱')
  const [formSubmitting, setFormSubmitting] = useState(false)

  useEffect(() => { localStorage.removeItem('drawzy_guest') }, [])

  if (authLoading) return null
  if (user && !user.isGuest) return <Navigate to="/home" replace />

  const handleGuestPlay = async () => {
    if (!guestName.trim()) return addToast('enter a username!', 'warning')
    const id = generateGuestId()
    loginAsGuest(guestName.trim(), id)
    const socket = connectSocket()
    socket.emit('create-room', {
      user: { userId: id, username: guestName.trim(), avatar: '🎨', isGuest: true },
      settings: { rounds: 3, drawTime: 60, difficulty: 'easy', isCompetitive: false }
    })
    socket.once('room-created', ({ roomId, room }) => { updateRoom(room); navigate(`/room/${roomId}`) })
    socket.once('error', ({ message }) => addToast(message, 'error'))
  }

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return addToast('enter a room code!', 'warning')
    if (!user && !guestName.trim()) return addToast('enter a username first!', 'warning')
    const id = user ? user.id : generateGuestId()
    const uname = user ? user.username : guestName.trim()
    if (!user) loginAsGuest(uname, id)
    const socket = connectSocket()
    socket.emit('join-room', { roomId: joinCode.toUpperCase(), userId: id, username: uname, avatar: user?.avatar || '🎨', isGuest: !user })
    socket.once('room-joined', ({ roomId, room }) => { updateRoom(room); navigate(`/room/${roomId}`) })
    socket.once('error', ({ message }) => addToast(message, 'error'))
  }

  const handleLogin = async () => {
    if (!username || !password) return addToast('fill in all fields', 'warning')
    setFormSubmitting(true)
    try { await login(username, password); navigate('/home') }
    catch (e) { addToast(e.message, 'error') }
    finally { setFormSubmitting(false) }
  }

  const handleRegister = async () => {
    if (!username || !password) return addToast('fill in all fields', 'warning')
    setFormSubmitting(true)
    try { await register(username, password, avatar); navigate('/home') }
    catch (e) { addToast(e.message, 'error') }
    finally { setFormSubmitting(false) }
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Logo */}
      <div className="text-center mb-10 relative z-10">
        <h1 className="display text-7xl md:text-9xl">
          scribble<span className="text-pink">!</span>
        </h1>
        <p className="font-body font-bold text-ink/70 text-lg mt-2 uppercase tracking-wider">draw badly. guess wildly. win loudly.</p>
      </div>

      {!mode && (
        <div className="blok bg-cream w-full max-w-md p-6 flex flex-col gap-3 animate-pop-in relative z-10">
          <button className="btn btn-pink w-full text-2xl py-5" onClick={() => setMode('guest')}>play</button>
          <button className="btn btn-cyan w-full text-xl py-4" onClick={() => setMode('join')}>join a room</button>
          <div className="flex gap-3">
            <button className="btn btn-lime flex-1 text-base" onClick={() => setMode('login')}>login</button>
            <button className="btn btn-yolk flex-1 text-base" onClick={() => setMode('register')}>register</button>
          </div>
          <p className="text-center font-body text-ink/60 text-sm pt-1">register to save scores & join groups</p>
        </div>
      )}

      {mode === 'guest' && (
        <ModalCard tone="bg-pink" title="play as guest">
          <input className="field mb-4" placeholder="your username" value={guestName}
            onChange={e => setGuestName(e.target.value)} autoComplete="off"
            onKeyDown={e => e.key === 'Enter' && handleGuestPlay()} />
          <div className="flex gap-3">
            <button className="btn btn-pink flex-1" onClick={handleGuestPlay}>let's go</button>
            <button className="btn btn-cream" onClick={() => setMode(null)}>back</button>
          </div>
        </ModalCard>
      )}

      {mode === 'join' && (
        <ModalCard tone="bg-cyan" title="join a room">
          <input className="field mb-3" placeholder="your username (if guest)" value={guestName}
            onChange={e => setGuestName(e.target.value)} />
          <input className="field mb-4 display text-2xl uppercase tracking-[0.3em] text-center" placeholder="ROOM"
            value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6} onKeyDown={e => e.key === 'Enter' && handleJoinRoom()} />
          <div className="flex gap-3">
            <button className="btn btn-cyan flex-1" onClick={handleJoinRoom}>join</button>
            <button className="btn btn-cream" onClick={() => setMode(null)}>back</button>
          </div>
        </ModalCard>
      )}

      {mode === 'login' && (
        <ModalCard tone="bg-lime" title="welcome back">
          <input className="field mb-3" placeholder="username" value={username}
            onChange={e => setUsername(e.target.value)} />
          <input className="field mb-4" type="password" placeholder="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <div className="flex gap-3">
            <button className="btn btn-lime flex-1" onClick={handleLogin} disabled={formSubmitting}>
              {formSubmitting ? 'logging in...' : 'login'}
            </button>
            <button className="btn btn-cream" onClick={() => setMode(null)}>back</button>
          </div>
          <p className="text-center font-body text-ink/60 text-sm mt-3 cursor-pointer hover:text-ink"
            onClick={() => setMode('register')}>no account? register →</p>
        </ModalCard>
      )}

      {mode === 'register' && (
        <ModalCard tone="bg-yolk" title="join scribble!">
          <input className="field mb-3" placeholder="username" value={username}
            onChange={e => setUsername(e.target.value)} />
          <input className="field mb-4" type="password" placeholder="password" value={password}
            onChange={e => setPassword(e.target.value)} />
          <p className="font-body font-bold text-ink/70 text-sm mb-2 uppercase tracking-wide">pick an avatar</p>
          <div className="grid grid-cols-6 gap-2 mb-5">
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)}
                className={`text-2xl py-2 border-2 border-ink transition-all ${avatar === a ? 'bg-pink' : 'bg-cream hover:bg-yolk'}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="btn btn-yolk flex-1" onClick={handleRegister} disabled={formSubmitting}>
              {formSubmitting ? 'creating...' : 'create account'}
            </button>
            <button className="btn btn-cream" onClick={() => setMode(null)}>back</button>
          </div>
        </ModalCard>
      )}
    </div>
  )
}

function ModalCard({ tone, title, children }) {
  return (
    <div className={`blok ${tone} w-full max-w-md p-6 animate-pop-in relative z-10`}>
      <h2 className="display text-4xl mb-5">{title}</h2>
      {children}
    </div>
  )
}
