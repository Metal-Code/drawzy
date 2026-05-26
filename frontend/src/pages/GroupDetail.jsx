import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import { api } from '../utils/api'
import { copyToClipboard } from '../utils/helpers'
import Logo from '../components/Logo'

export default function GroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const { updateRoom } = useRoom()
  const { addToast } = useToast()
  const location = useLocation()
  const [members, setMembers] = useState([])
  const [history, setHistory] = useState([])
  const [group] = useState(location.state?.group || null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchData() }, [groupId])

  useEffect(() => {
    const socket = getSocket()
    socket.emit('join-group-channel', { groupId })
    socket.on('group-game-invite', ({ roomId }) => navigate(`/room/${roomId}`))
    return () => socket.off('group-game-invite')
  }, [groupId])

  const fetchData = async () => {
    try {
      const [m, h] = await Promise.all([api.get(`/groups/${groupId}/members`), api.get(`/groups/${groupId}/history`)])
      setMembers(m.data); setHistory(h.data); setLoading(false)
    } catch (e) { addToast(e.message, 'error'); setLoading(false) }
  }

  const handleStartGame = () => {
    const socket = getSocket()
    socket.emit('create-room', {
      user: { userId: user.id, username: user.username, avatar: user.avatar, isGuest: false },
      settings: { rounds: 3, drawTime: 60, difficulty: 'easy', isCompetitive: false, isGroupRoom: true, groupId }
    })
    socket.once('room-created', ({ roomId, room }) => {
      updateRoom(room)
      socket.emit('group-game-started', { groupId, roomId })
      navigate(`/room/${roomId}`)
    })
  }

  const handleCopyCode = async () => {
    if (!group) return
    await copyToClipboard(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sorted = [...members].sort((a, b) => b.total_points - a.total_points)
  const TONES = ['bg-yolk', 'bg-cyan', 'bg-lime', 'bg-cream']

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/groups')} className="btn btn-sm btn-cream">← back</button>
          <Logo to="/home" />
        </div>
        <button onClick={handleStartGame} className="btn btn-sm btn-pink">▶ start game</button>
      </nav>

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 pb-8">
        {group && (
          <div className="blok bg-pink p-5 flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <p className="font-body font-bold text-cream/80 text-xs uppercase tracking-widest">group</p>
              <h2 className="display text-4xl text-cream">{group.name}</h2>
            </div>
            <div className="text-right">
              <p className="font-body font-bold text-cream/80 text-xs uppercase tracking-widest">invite code</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="display text-3xl text-cream tracking-widest">{group.invite_code}</span>
                <button onClick={handleCopyCode} className="btn btn-sm btn-ink">{copied ? '✓' : 'copy'}</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 display text-2xl text-ink/50">loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="blok bg-cream p-5">
              <h3 className="display text-3xl mb-4">members</h3>
              <div className="flex flex-col gap-2">
                {sorted.map((m, i) => (
                  <div key={m.id} className={`blok-sm ${m.id === user.id ? 'bg-yolk' : TONES[i % TONES.length]} px-3 py-2 flex items-center gap-3`}>
                    <span className="display text-xl w-6">{i + 1}</span>
                    <span className="text-xl">{m.avatar}</span>
                    <span className="flex-1 display text-lg truncate">{m.username}</span>
                    <span className="display text-xl text-pink">{m.total_points}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="blok bg-cream p-5">
              <h3 className="display text-3xl mb-4">history</h3>
              {history.length === 0 ? (
                <p className="font-body font-bold text-ink/50 uppercase tracking-wider text-sm text-center py-8">no games played yet</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((match) => (
                    <div key={match.id} className="blok-sm bg-cream px-3 py-2 flex items-center gap-3">
                      <span className="text-xl">{match.winner_avatar}</span>
                      <div className="flex-1">
                        <span className="display text-lg">{match.winner_username}</span>
                        <span className="font-body font-bold text-ink/50 text-xs ml-2 uppercase">won</span>
                      </div>
                      <span className="font-body font-bold text-ink/50 text-xs">{new Date(match.played_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
