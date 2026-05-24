import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useRoom } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import Canvas from '../components/Canvas'
import Chat from '../components/Chat'
import Scoreboard from '../components/Scoreboard'
import Timer from '../components/Timer'
import WordPicker from '../components/WordPicker'
import { playSound, generateWordHint } from '../utils/helpers'

export default function Game() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const { room, updateRoom, gameState, updateGameState, addMessage, resetRoom } = useRoom()
  const { addToast } = useToast()

  const socket = getSocket()
  const [showWordPicker, setShowWordPicker] = useState(false)
  const [wordChoices, setWordChoices] = useState([])
  const [tabAlert, setTabAlert] = useState(null)
  const [turnEndOverlay, setTurnEndOverlay] = useState(null)
  const [hasGuessed, setHasGuessed] = useState(false)
  const [strokes, setStrokes] = useState([])
  const tabAlertTimer = useRef(null)

  const isDrawer = gameState.currentDrawerId === user?.id
  const isCompetitive = room?.settings?.isCompetitive

  // Competitive mode — fullscreen + tab detection
  useEffect(() => {
    if (!isCompetitive) return

    const handleVisibility = () => {
      if (document.hidden) {
        setTimeout(() => {
          if (document.hidden) socket.emit('tab-switch', { roomId, userId: user.id, username: user.username })
        }, 1500)
      }
    }
    const handleBlur = () => socket.emit('tab-switch', { roomId, userId: user.id, username: user.username })
    const handleFullscreen = () => {
      if (!document.fullscreenElement) socket.emit('tab-switch', { roomId, userId: user.id, username: user.username })
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreen)

    document.documentElement.requestFullscreen?.().catch(() => {})

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreen)
    }
  }, [isCompetitive, roomId, user])

  useEffect(() => {
    if (!socket || !user) return

    socket.on('picking-phase', ({ drawerId, drawerName }) => {
      updateGameState({ status: 'picking', currentDrawerId: drawerId, hint: null, word: null })
      setStrokes([])  // clear here
      setHasGuessed(false)
      setShowWordPicker(false)
      addMessage({ type: 'system', text: `${drawerName} is choosing a word...` })
  })

    socket.on('choose-word', ({ wordChoices }) => {
      setWordChoices(wordChoices)
      setShowWordPicker(true)
    })

    socket.on('drawing-phase', ({ hint, wordLength, drawTime }) => {
      setShowWordPicker(false)
      updateGameState({ status: 'drawing', hint, drawTime })
      setStrokes([])
      playSound('roundStart')
    })

    socket.on('your-word', ({ word }) => {
      updateGameState({ word, hint: null })
    })

    socket.on('draw', (stroke) => {
      setStrokes(prev => [...prev, stroke])
    })

    socket.on('wrong-guess', ({ username, guess }) => {
      addMessage({ type: 'wrong', username, text: guess })
    })

    socket.on('correct-guess', ({ userId, username, score, message }) => {
      addMessage({ type: 'correct', username, text: `guessed the word! (+${score})` })
      if (userId === user.id) {
        setHasGuessed(true)
        playSound('correct')
      }
      updateRoom(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === userId ? { ...p, score: p.score + score, hasGuessedCorrect: true } : p)
      }))
    })

    socket.on('turn-ended', ({ word, scores }) => {
      setTurnEndOverlay({ word, scores })
      setTimeout(() => setTurnEndOverlay(null), 5000)
      updateGameState({ status: 'roundEnd' })
    })

    socket.on('tab-switched', ({ username, count }) => {
      if (tabAlertTimer.current) clearTimeout(tabAlertTimer.current)
      setTabAlert({ username, count })
      tabAlertTimer.current = setTimeout(() => setTabAlert(null), 4000)
      updateGameState(prev => ({
        tabSwitches: { ...prev.tabSwitches, [username]: count }
      }))
    })

    socket.on('player-joined', ({ player, message }) => {
      addMessage({ type: 'system', text: message })
      addToast(message, 'info')
    })

    socket.on('player-left', ({ message }) => {
      addMessage({ type: 'system', text: message })
      addToast(message, 'warning')
    })

    socket.on('player-disconnected', ({ message }) => {
      addMessage({ type: 'system', text: message })
      addToast(message, 'warning')
    })

    socket.on('player-reconnected', ({ message }) => {
      addMessage({ type: 'system', text: message })
      addToast(message, 'success')
    })

    socket.on('host-changed', ({ newHost }) => {
      if (newHost.id === user.id) addToast('You are now the host!', 'success')
    })

    socket.on('game-over', ({ winner, finalScores }) => {
      navigate(`/room/${roomId}/postgame`, { state: { winner, finalScores, isCompetitive, tabSwitches: gameState.tabSwitches } })
    })

    socket.on('reconnected', ({ room: r, strokes: s }) => {
      updateRoom(r)
      setStrokes(s || [])
      addToast('Reconnected!', 'success')
    })

    return () => {
      ['picking-phase','choose-word','drawing-phase','your-word','draw','wrong-guess',
       'correct-guess','turn-ended','tab-switched','player-joined','player-left',
       'player-disconnected','player-reconnected','host-changed','game-over','reconnected']
        .forEach(e => socket.off(e))
    }
  }, [socket, user, roomId])

  const handleGuess = (guess) => {
    socket.emit('guess', { roomId, userId: user.id, username: user.username, guess })
  }

  const handleWordPick = (word) => {
    socket.emit('word-chosen', { roomId, word })
    setShowWordPicker(false)
  }

  const players = room?.players || []
  const currentRound = room?.gameState?.currentRound || 1
  const totalRounds = room?.settings?.rounds || 3

  return (
    <div className={`min-h-screen doodle-bg flex flex-col ${isCompetitive ? 'ring-4 ring-red-500 ring-inset' : ''}`}>
      {/* Competitive badge */}
      {isCompetitive && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-red-600 text-white font-display font-bold px-4 py-1.5 rounded-full text-sm animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white inline-block" />
          COMPETITIVE
        </div>
      )}

      {/* Tab switch alert */}
      {tabAlert && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center font-display text-xl font-bold py-4 animate-slide-down shadow-2xl">
          👀 {tabAlert.username} just left the tab! (×{tabAlert.count})
        </div>
      )}

      {/* Word picker */}
      {showWordPicker && isDrawer && (
        <WordPicker words={wordChoices} onPick={handleWordPick} />
      )}

      {/* Turn end overlay */}
      {turnEndOverlay && (
        <div className="fixed inset-0 bg-navy/80 flex items-center justify-center z-40 backdrop-blur-sm">
          <div className="card animate-bounce-in text-center max-w-sm w-full mx-4">
            <p className="font-body text-white/50 mb-2">The word was</p>
            <h2 className="font-display text-5xl font-bold text-yellow mb-6">{turnEndOverlay.word}</h2>
            <div className="flex flex-col gap-2">
              {turnEndOverlay.scores.slice(0, 3).map((p, i) => (
                <div key={p.id} className="flex justify-between font-body text-cream">
                  <span>{p.username}</span>
                  <span className="font-bold text-yellow">{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <span className="font-display text-2xl text-yellow font-bold">Drawzy!</span>
        <div className="flex items-center gap-4">
          <span className="font-body text-white/50 text-sm">Round <span className="text-cream font-bold">{currentRound}/{totalRounds}</span></span>
          {gameState.status === 'picking' && (
            <span className="pill bg-sky/20 text-sky">✏️ Choosing word...</span>
          )}
          {gameState.status === 'drawing' && (
            <div className="w-48">
              <Timer duration={room?.settings?.drawTime || 60} active={gameState.status === 'drawing'} />
            </div>
          )}
        </div>
        <div className="font-body text-white/50 text-sm">
          {user?.username} {user?.avatar}
        </div>
      </div>

      {/* Hint bar */}
      {gameState.status === 'drawing' && (
        <div className="text-center py-3 border-b border-white/10">
          {isDrawer ? (
            <span className="font-display text-3xl font-bold text-yellow tracking-widest">{gameState.word}</span>
          ) : (
            <span className="font-display text-3xl font-bold text-cream tracking-widest">
              {gameState.hint}
            </span>
          )}
        </div>
      )}

      {/* Main game area */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left — Scoreboard */}
        <div className="w-48 flex-shrink-0">
          <Scoreboard
            players={players}
            currentDrawerId={gameState.currentDrawerId}
            tabSwitches={gameState.tabSwitches}
          />
        </div>

        {/* Center — Canvas */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <Canvas
            isDrawer={isDrawer}
            socket={socket}
            roomId={roomId}
            strokes={strokes}
          />
        </div>

        {/* Right — Chat */}
        <div className="w-56 flex-shrink-0 flex flex-col">
          <Chat
            messages={gameState.messages}
            onGuess={handleGuess}
            isDrawer={isDrawer}
            disabled={hasGuessed}
          />
        </div>
      </div>
    </div>
  )
}
