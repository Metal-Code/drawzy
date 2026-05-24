import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import { copyToClipboard } from '../utils/helpers'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const DRAW_TIMES = [30, 60, 90, 120]

export default function Lobby() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const { room, updateRoom } = useRoom()
  const { addToast } = useToast()
  const [settings, setSettings] = useState({ rounds: 3, drawTime: 60, difficulty: 'easy', isCompetitive: false })
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)

  const socket = getSocket()
  const isHost = room?.host === user?.id

  useEffect(() => {
  if (!user) return
  const socket = getSocket()

  socket.on('room-created', ({ room }) => updateRoom(room))
  socket.on('room-joined', ({ room }) => updateRoom(room))
  socket.on('player-joined', ({ room: updatedRoom, player, message }) => {
    if (updatedRoom) updateRoom(updatedRoom)
    addToast(message, 'info')
  })
  socket.on('player-left', ({ room: updatedRoom, message }) => {
    if (updatedRoom) updateRoom(updatedRoom)
    addToast(message, 'warning')
  })

  socket.on('host-changed', ({ newHost, room: updatedRoom }) => {
    if (updatedRoom) updateRoom(updatedRoom)
    if (newHost.id === user.id) addToast('You are now the host!', 'success')
  })
  socket.on('game-started', ({ room: updatedRoom }) => {
    updateRoom(updatedRoom)
    navigate(`/room/${roomId}/game`)
  })
  socket.on('error', ({ message }) => {
    addToast(message, 'error')
    setStarting(false)
  })

  // Only join if not already in the room
  const alreadyInRoom = room?.players?.some(p => p.id === user.id)
  if (!alreadyInRoom) {
    socket.emit('join-room', {
      roomId,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      isGuest: user.isGuest
    })
  }

  return () => {
    socket.off('room-created')
    socket.off('room-joined')
    socket.off('player-joined')
    socket.off('player-left')
    socket.off('host-changed')
    socket.off('game-started')
    socket.off('error')
  }
}, [user, roomId])

  console.log('room:', room)
  console.log('user:', user)
  console.log('isHost:', room?.host === user?.id)

  if (!room) return (
    <div className="min-h-screen doodle-bg flex items-center justify-center">
      <p className="font-display text-2xl text-yellow animate-pulse">Joining room...</p>
    </div>
  )

  const handleCopy = async () => {
    await copyToClipboard(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartGame = () => {
    setStarting(true)
    socket.emit('start-game', { roomId, userId: user.id, settings })
  }

  const handleLeave = () => {
    socket.emit('leave-room', { roomId, userId: user.id })
    navigate('/')
  }

  const players = room?.players || []

  return (
    <div className="min-h-screen doodle-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left — Players */}
        <div className="flex flex-col gap-4">
          {/* Room code */}
          <div className="card bg-yellow border-none">
            <p className="font-body text-navy/60 text-sm font-semibold uppercase tracking-widest mb-1">Room Code</p>
            <div className="flex items-center justify-between">
              <span className="font-display text-5xl font-bold text-navy">{roomId}</span>
              <button onClick={handleCopy}
                className="bg-navy text-yellow font-display font-semibold px-4 py-2 rounded-xl transition-all active:scale-95">
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>

          {/* Players list */}
          <div className="card flex-1">
            <h3 className="font-display text-2xl text-cream mb-4">
              Squad <span className="text-yellow">({players.length})</span>
            </h3>
            <div className="flex flex-col gap-2">
              {players.map((p, i) => {
                const colors = ['bg-coral', 'bg-sky', 'bg-mint', 'bg-purple', 'bg-pink', 'bg-yellow']
                return (
                  <div key={p.id} className={`${colors[i % colors.length]} rounded-2xl px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.avatar}</span>
                      <span className="font-display font-semibold text-navy text-lg">{p.username}</span>
                      {p.id === room?.host && (
                        <span className="bg-navy/20 text-navy text-xs font-bold px-2 py-0.5 rounded-full">host</span>
                      )}
                      {p.isGuest && (
                        <span className="bg-navy/20 text-navy text-xs font-bold px-2 py-0.5 rounded-full">guest</span>
                      )}
                    </div>
                    <span className="font-display text-navy font-bold">
                      {p.score > 0 ? p.score : ''}
                    </span>
                  </div>
                )
              })}
              {players.length === 1 && (
                <p className="text-center text-white/40 text-sm py-4">Waiting for more players...</p>
              )}
            </div>
          </div>

          <button onClick={handleLeave} className="btn-secondary w-full">Leave Room</button>
        </div>

        {/* Right — Settings (host only) */}
        <div className="flex flex-col gap-4">
          <div className="card flex-1">
            <h3 className="font-display text-2xl text-cream mb-6">Settings</h3>

            {/* Rounds */}
            <div className="mb-6">
              <label className="font-body text-white/60 text-sm uppercase tracking-widest mb-3 block">Rounds</label>
              <div className="flex items-center gap-4">
                <button disabled={!isHost} onClick={() => setSettings(s => ({ ...s, rounds: Math.max(2, s.rounds - 1) }))}
                  className="bg-navy-light rounded-xl w-10 h-10 font-display text-xl font-bold text-cream disabled:opacity-40 hover:bg-white/10 transition-colors">−</button>
                <span className="font-display text-4xl font-bold text-yellow w-12 text-center">{settings.rounds}</span>
                <button disabled={!isHost} onClick={() => setSettings(s => ({ ...s, rounds: Math.min(10, s.rounds + 1) }))}
                  className="bg-navy-light rounded-xl w-10 h-10 font-display text-xl font-bold text-cream disabled:opacity-40 hover:bg-white/10 transition-colors">+</button>
                <span className="font-body text-white/40 text-sm">min 2 · max 10</span>
              </div>
            </div>

            {/* Draw time */}
            <div className="mb-6">
              <label className="font-body text-white/60 text-sm uppercase tracking-widest mb-3 block">
                Draw Time <span className="text-coral font-bold">{settings.drawTime}s</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {DRAW_TIMES.map(t => (
                  <button key={t} disabled={!isHost} onClick={() => setSettings(s => ({ ...s, drawTime: t }))}
                    className={`font-display font-semibold px-4 py-2 rounded-xl transition-all ${settings.drawTime === t ? 'bg-sky text-navy' : 'bg-navy-light text-cream hover:bg-white/10'} disabled:opacity-40`}>
                    {t}s
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-6">
              <label className="font-body text-white/60 text-sm uppercase tracking-widest mb-3 block">
                Difficulty <span className="text-coral font-bold capitalize">{settings.difficulty}</span>
              </label>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button key={d} disabled={!isHost} onClick={() => setSettings(s => ({ ...s, difficulty: d }))}
                    className={`font-display font-semibold px-4 py-2 rounded-xl transition-all capitalize ${settings.difficulty === d ? 'bg-mint text-navy' : 'bg-navy-light text-cream hover:bg-white/10'} disabled:opacity-40`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Competitive mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg text-cream">Competitive Mode</p>
                {settings.isCompetitive && (
                  <p className="font-body text-xs text-coral mt-0.5">👀 Tab switching will be exposed</p>
                )}
              </div>
              <button disabled={!isHost} onClick={() => setSettings(s => ({ ...s, isCompetitive: !s.isCompetitive }))}
                className={`relative w-14 h-7 rounded-full transition-colors disabled:opacity-40 ${settings.isCompetitive ? 'bg-coral' : 'bg-navy'}`}>
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${settings.isCompetitive ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={players.length < 2 || starting}
              className={`w-full py-4 rounded-3xl font-display text-xl font-bold transition-all ${players.length >= 2 && !starting ? 'btn-primary animate-pulse' : 'bg-navy-light text-white/30 cursor-not-allowed'}`}>
              {starting ? '⏳ Generating words...' : players.length < 2 ? '⏳ Waiting for players...' : '🚀 Start Game!'}
            </button>
          )}
          {!isHost && (
            <div className="card text-center text-white/50 font-body">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
