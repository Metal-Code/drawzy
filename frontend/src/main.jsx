import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { RoomProvider } from './context/RoomContext'
import { ToastProvider } from './context/ToastContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <RoomProvider>
            <App />
          </RoomProvider>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
)
