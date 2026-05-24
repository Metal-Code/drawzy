import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
        try {
            const res = await api.get('/auth/me')
            setUser({ ...res.data, isGuest: false })
        } catch {
            // no session, stay on landing
        } finally {
            setLoading(false)
        }
    }
    restoreSession()
}, [])

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    setUser({ ...res.data, isGuest: false })
    localStorage.removeItem('drawzy_guest')
  }

  const register = async (username, password, avatar) => {
    await api.post('/auth/register', { username, password, avatar })
    await login(username, password)
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  const loginAsGuest = (username, id) => {
    const guest = { id, username, avatar: '🎨', isGuest: true }
    setUser(guest)
    // localStorage.setItem('drawzy_guest', JSON.stringify(guest))
  }
  const clearGuest = () => {
    setUser(null)
    localStorage.removeItem('drawzy_guest')
}

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginAsGuest, clearGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
