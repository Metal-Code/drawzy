import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import { copyToClipboard } from '../utils/helpers'
import Logo from '../components/Logo'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const DRAW_TIMES = [30, 60, 90, 120]
const TONES = ['bg-cyan', 'bg-lime', 'bg-yolk', 'bg-pink']

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
    socket.on('player-joined', ({ room: updatedRoom, message }) => {
      if (updatedRoom) updateRoom(updatedRoom)
      addToast(message, 'info')
    })
    socket.on('player-left', ({ room: updatedRoom, message }) => {
      if (updatedRoom) updateRoom(updatedRoom)
      addToast(message, 'warning')
    })
    socket.on('host-changed', ({ newHost, room: updatedRoom }) => {
      if (updatedRoom) updateRoom(updatedRoom)
      if (newHost.id === user.id) addToast('you are now the host!', 'success')
    })
    socket.on('game-started', ({ room: updatedRoom }) => {
      updateRoom(updatedRoom)
      navigate(`/room/${roomId}/game`)
    })
    socket.on('error', ({ message }) => { addToast(message, 'error'); setStarting(false) })

    socket.on('back-to-lobby', ({ room: updatedRoom }) => {
      updateRoom(updatedRoom)
  })

    socket.emit('join-room', {
      roomId, userId: user.id, username: user.username, avatar: user.avatar, isGuest: user.isGuest
    })

    

    return () => {
      ['room-created','room-joined','player-joined','player-left','host-changed','game-started', 'back-to-lobby','error']
        .forEach(e => socket.off(e))
    }
  }, [user, roomId])

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="blok bg-yolk px-8 py-6 animate-wiggle">
        <p className="display text-3xl">joining room...</p>
      </div>
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
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <Logo />
        <button className="btn btn-sm btn-cream" onClick={handleLeave}>leave</button>
      </nav>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left */}
        <div className="flex flex-col gap-5">
          <div className="blok bg-pink p-5">
            <p className="font-body font-bold text-cream/80 text-xs uppercase tracking-widest mb-1">room code</p>
            <div className="flex items-center justify-between gap-3">
              <span className="display text-6xl text-cream tracking-widest">{roomId}</span>
              <button onClick={handleCopy} className="btn btn-sm btn-ink">
                {copied ? '✓ copied' : 'copy'}
              </button>
            </div>
          </div>

          <div className="blok bg-cream p-5 flex-1">
            <h3 className="display text-3xl mb-4">squad <span className="text-pink">({players.length})</span></h3>
            <div className="grid grid-cols-2 gap-3">
              {players.map((p, i) => (
                <div key={p.id} className={`blok-sm ${TONES[i % TONES.length]} px-3 py-3`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.avatar}</span>
                    <span className="display text-xl truncate">{p.username}</span>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {p.id === room?.host && <span className="chip bg-ink text-cream text-[10px] py-0.5 px-2">host</span>}
                    {p.isGuest && <span className="chip bg-cream text-[10px] py-0.5 px-2">guest</span>}
                    {p.id === user?.id && <span className="chip bg-yolk text-[10px] py-0.5 px-2">you</span>}
                  </div>
                </div>
              ))}
              {players.length === 1 && (
                <div className="blok-sm bg-cream border-dashed col-span-2 px-3 py-6 text-center">
                  <p className="font-body font-bold text-ink/60 uppercase text-sm tracking-wider">waiting for more players...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-5">
          <div className="blok bg-cream p-5">
            <h3 className="display text-3xl mb-5">settings</h3>

            {/* Rounds — chevron stepper */}
            <Setting label="rounds">
              <div className="flex items-center gap-3">
                <button disabled={!isHost || settings.rounds <= 1}
                  onClick={() => setSettings(s => ({ ...s, rounds: Math.max(1, s.rounds - 1) }))}
                  className="btn btn-sm btn-cyan w-10">−</button>
                <span className="display text-4xl w-12 text-center">{settings.rounds}</span>
                <button disabled={!isHost || settings.rounds >= 10}
                  onClick={() => setSettings(s => ({ ...s, rounds: Math.min(10, s.rounds + 1) }))}
                  className="btn btn-sm btn-cyan w-10">+</button>
              </div>
            </Setting>

            <Setting label="draw time">
              <div className="flex gap-2 flex-wrap">
                {DRAW_TIMES.map(t => (
                  <button key={t} disabled={!isHost} onClick={() => setSettings(s => ({ ...s, drawTime: t }))}
                    className={`btn btn-sm ${settings.drawTime === t ? 'btn-yolk' : 'btn-cream'}`}>{t}s</button>
                ))}
              </div>
            </Setting>

            <Setting label="difficulty">
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button key={d} disabled={!isHost} onClick={() => setSettings(s => ({ ...s, difficulty: d }))}
                    className={`btn btn-sm ${settings.difficulty === d ? 'btn-lime' : 'btn-cream'}`}>{d}</button>
                ))}
              </div>
            </Setting>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="display text-2xl">competitive</p>
                {settings.isCompetitive && (
                  <p className="font-body font-bold text-pink text-xs uppercase tracking-wide mt-0.5">tab-switching exposed</p>
                )}
              </div>
              <button disabled={!isHost} onClick={() => setSettings(s => ({ ...s, isCompetitive: !s.isCompetitive }))}
                className={`relative w-16 h-9 border-[3px] border-ink transition-colors disabled:opacity-40 ${settings.isCompetitive ? 'bg-pink' : 'bg-cream'}`}>
                <div className={`absolute top-0.5 w-6 h-6 bg-ink transition-all ${settings.isCompetitive ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {isHost ? (
            <button onClick={handleStartGame} disabled={players.length < 2 || starting}
              className="btn btn-pink w-full py-6 text-3xl">
              {starting ? 'cooking words...' : players.length < 2 ? 'need 2+ players' : 'start!'}
            </button>
          ) : (
            <div className="blok bg-cream p-5 text-center">
              <p className="display text-xl">waiting for host to start...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Setting({ label, children }) {
  return (
    <div className="mb-5">
      <p className="font-body font-bold text-ink/60 text-xs uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  )
}
