import { createContext, useContext, useEffect, useRef } from 'react'
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    if (user) {
      socketRef.current = connectSocket()
    } else {
      disconnectSocket()
    }
  }, [user])

  const getSocketInstance = () => getSocket()

  return (
    <SocketContext.Provider value={{ getSocket: getSocketInstance }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
