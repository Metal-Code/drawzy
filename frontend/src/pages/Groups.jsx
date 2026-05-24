import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../utils/api'

export default function Groups() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups/my-groups')
      setGroups(res.data)
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!groupName.trim()) return addToast('Enter a group name', 'warning')
    try {
      const res = await api.post('/groups/create', { name: groupName.trim() })
      addToast(`Group created! Code: ${res.data.inviteCode}`, 'success', 5000)
      setGroupName('')
      setMode(null)
      fetchGroups()
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) return addToast('Enter an invite code', 'warning')
    try {
      await api.post('/groups/join', { inviteCode: inviteCode.trim() })
      addToast('Joined group!', 'success')
      setInviteCode('')
      setMode(null)
      fetchGroups()
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  return (
    <div className="min-h-screen doodle-bg flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <button onClick={() => navigate('/home')} className="font-display text-4xl text-yellow font-bold">Drawzy!</button>
        <h2 className="font-display text-2xl text-cream">My Groups</h2>
        <div className="flex gap-3">
          <button onClick={() => setMode('join')} className="btn-secondary text-sm py-2 px-4">Join Group</button>
          <button onClick={() => setMode('create')} className="btn-primary text-sm py-2 px-4">+ Create</button>
        </div>
      </nav>

      <div className="flex-1 px-8 py-6 max-w-4xl mx-auto w-full">
        {/* Create / Join modals */}
        {mode === 'create' && (
          <div className="card mb-6 animate-slide-down">
            <h3 className="font-display text-2xl text-mint mb-4">Create a Group</h3>
            <input className="input mb-4" placeholder="Group name" value={groupName}
              onChange={e => setGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            <div className="flex gap-3">
              <button onClick={handleCreate} className="btn-mint flex-1">Create 🚀</button>
              <button onClick={() => setMode(null)} className="btn-secondary px-4">Cancel</button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="card mb-6 animate-slide-down">
            <h3 className="font-display text-2xl text-sky mb-4">Join a Group</h3>
            <input className="input mb-4 uppercase tracking-widest font-display font-bold" placeholder="Invite Code"
              value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            <div className="flex gap-3">
              <button onClick={handleJoin} className="btn-primary flex-1">Join 🎯</button>
              <button onClick={() => setMode(null)} className="btn-secondary px-4">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-white/40 font-body">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <p className="font-display text-2xl text-white/40">No groups yet</p>
            <p className="font-body text-white/30 mt-2">Create one or join with an invite code</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group, i) => {
              const colors = ['border-coral', 'border-sky', 'border-mint', 'border-purple', 'border-yellow']
              return (
                <button key={group.id} onClick={() => navigate(`/groups/${group.id}`)}
                  className={`card border-2 ${colors[i % colors.length]} text-left hover:brightness-110 transition-all active:scale-95`}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-display text-2xl text-cream font-bold">{group.name}</h3>
                    <span className="font-display text-xs bg-navy px-2 py-1 rounded-lg text-white/40 font-semibold tracking-widest">{group.invite_code}</span>
                  </div>
                  <p className="font-body text-white/40 text-sm">Click to view →</p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
