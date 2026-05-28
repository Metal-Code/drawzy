import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Game from './pages/Game'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import Leaderboard from './pages/Leaderboard'
import PostGame from './pages/PostGame'

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="blok px-8 py-6 inline-block bg-yolk animate-wiggle">
        <p className="display text-4xl">loading drawzy<span className="text-pink">!</span></p>
      </div>
    </div>
  </div>
)

const RegisteredRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user || user.isGuest) return <Navigate to="/" replace />
  return children
}

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<RegisteredRoute><Home /></RegisteredRoute>} />
      <Route path="/room/:roomId" element={<AuthRoute><Lobby /></AuthRoute>} />
      <Route path="/room/:roomId/game" element={<AuthRoute><Game /></AuthRoute>} />
      <Route path="/room/:roomId/postgame" element={<AuthRoute><PostGame /></AuthRoute>} />
      <Route path="/groups" element={<RegisteredRoute><Groups /></RegisteredRoute>} />
      <Route path="/groups/:groupId" element={<RegisteredRoute><GroupDetail /></RegisteredRoute>} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
