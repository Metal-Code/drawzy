import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import { api } from '../utils/api'
import { copyToClipboard } from '../utils/helpers'

export default function GroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const { updateRoom } = useRoom()
  const { addToast } = useToast()
  const [members, setMembers] = useState([])
  const [history, setHistory] = useState([])
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [groupId])

  const fetchData = async () => {
    try {
      const [membersRes, historyRes] = await Promise.all([
        api.get(`/groups/${groupId}/members`),
        api.get(`/groups/${groupId}/history`)
      ])
      setMembers(membersRes.data)
      setHistory(historyRes.data)
      setLoading(false)
    } catch (e) {
      addToast(e.message, 'error')
      setLoading(false)
    }
  }

  const handleStartGame = () => {
    const socket = getSocket()
    socket.emit('create-room', {
      user: { userId: user.id, username: user.username, avatar: user.avatar, isGuest: false },
      settings: { rounds: 3, drawTime: 60, difficulty: 'easy', isCompetitive: false, isGroupRoom: true, groupId }
    })
    socket.once('room-created', ({ roomId, room }) => {
      updateRoom(room)
      navigate(`/room/${roomId}`)
    })
  }

  const handleCopyCode = async () => {
    if (!group) return
    await copyToClipboard(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sortedMembers = [...members].sort((a, b) => b.total_points - a.total_points)

  return (
    <div className="min-h-screen doodle-bg flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <button onClick={() => navigate('/groups')} className="font-display text-2xl text-yellow font-bold">← Groups</button>
        <h2 className="font-display text-2xl text-cream">{loading ? '...' : members[0] ? 'Group' : ''}</h2>
        <button onClick={handleStartGame} className="btn-primary py-2 px-6">🎮 Start Game</button>
      </nav>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-white/40 font-body">Loading...</div>
      ) : (
        <div className="flex-1 px-8 py-6 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Members / Leaderboard */}
          <div className="card">
            <h3 className="font-display text-2xl text-yellow mb-4">Members</h3>
            <div className="flex flex-col gap-2">
              {sortedMembers.map((m, i) => (
                <div key={m.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl ${m.id === user.id ? 'bg-yellow/10 border border-yellow/30' : 'bg-navy'}`}>
                  <span className="font-display font-bold text-white/30 w-5">{i + 1}</span>
                  <span className="text-xl">{m.avatar}</span>
                  <span className="flex-1 font-body font-semibold text-cream">{m.username}</span>
                  <span className="font-display font-bold text-yellow">{m.total_points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Match History */}
          <div className="card">
            <h3 className="font-display text-2xl text-sky mb-4">Match History</h3>
            {history.length === 0 ? (
              <p className="font-body text-white/40 text-center py-8">No games played yet!</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((match) => (
                  <div key={match.id} className="flex items-center gap-3 bg-navy px-3 py-2.5 rounded-2xl">
                    <span className="text-xl">{match.winner_avatar}</span>
                    <div className="flex-1">
                      <span className="font-body font-semibold text-cream">{match.winner_username}</span>
                      <span className="font-body text-white/30 text-xs ml-2">won</span>
                    </div>
                    <span className="font-body text-white/30 text-xs">
                      {new Date(match.played_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
