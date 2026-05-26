import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../utils/api'
import Logo from '../components/Logo'

const TONES = ['bg-pink', 'bg-cyan', 'bg-lime', 'bg-yolk']

export default function Groups() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(null)
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => { fetchGroups() }, [])

  const fetchGroups = async () => {
    try { const res = await api.get('/groups/my-groups'); setGroups(res.data) }
    catch (e) { addToast(e.message, 'error') }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!groupName.trim()) return addToast('enter a group name', 'warning')
    try {
      const res = await api.post('/groups/create', { name: groupName.trim() })
      addToast(`group created! code: ${res.data.inviteCode}`, 'success', 5000)
      setGroupName(''); setMode(null); fetchGroups()
    } catch (e) { addToast(e.message, 'error') }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) return addToast('enter an invite code', 'warning')
    try {
      await api.post('/groups/join', { inviteCode: inviteCode.trim() })
      addToast('joined group!', 'success')
      setInviteCode(''); setMode(null); fetchGroups()
    } catch (e) { addToast(e.message, 'error') }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <Logo />
        <h2 className="display text-3xl">groups</h2>
        <div className="flex gap-2">
          <button onClick={() => setMode('join')} className="btn btn-sm btn-cyan">join</button>
          <button onClick={() => setMode('create')} className="btn btn-sm btn-pink">+ create</button>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-4">
        {mode === 'create' && (
          <div className="blok bg-lime p-5 mb-6 animate-pop-in">
            <h3 className="display text-2xl mb-3">create a group</h3>
            <input className="field mb-3" placeholder="group name" value={groupName}
              onChange={e => setGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            <div className="flex gap-3">
              <button onClick={handleCreate} className="btn btn-pink flex-1">create</button>
              <button onClick={() => setMode(null)} className="btn btn-cream">cancel</button>
            </div>
          </div>
        )}
        {mode === 'join' && (
          <div className="blok bg-cyan p-5 mb-6 animate-pop-in">
            <h3 className="display text-2xl mb-3">join a group</h3>
            <input className="field mb-3 display text-xl uppercase tracking-widest" placeholder="INVITE CODE" value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            <div className="flex gap-3">
              <button onClick={handleJoin} className="btn btn-pink flex-1">join</button>
              <button onClick={() => setMode(null)} className="btn btn-cream">cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 display text-2xl text-ink/50">loading...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="display text-7xl mb-2 animate-bob">◆</div>
            <p className="display text-3xl text-ink/60">no groups yet</p>
            <p className="font-body font-bold text-ink/60 uppercase tracking-wider text-sm mt-2">create one or join with a code</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groups.map((g, i) => (
              <button key={g.id} onClick={() => navigate(`/groups/${g.id}`, { state: { group: g } })}
                className={`blok ${TONES[i % TONES.length]} press p-5 text-left`}>
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className={`display text-3xl ${TONES[i % TONES.length] === 'bg-pink' ? 'text-cream' : 'text-ink'}`}>{g.name}</h3>
                  <span className="chip bg-cream text-xs">{g.invite_code}</span>
                </div>
                <p className={`font-body font-bold uppercase tracking-wider text-xs ${TONES[i % TONES.length] === 'bg-pink' ? 'text-cream/80' : 'text-ink/70'}`}>view →</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
