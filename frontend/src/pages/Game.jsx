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
import { playSound } from '../utils/helpers'

export default function Game() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const { room, updateRoom, gameState, updateGameState, addMessage } = useRoom()
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

    socket.on('picking-phase', ({ drawerId, drawerName, currentRound }) => {
      if (currentRound === 1) {
        updateGameState({ status: 'picking', currentDrawerId: drawerId, hint: null, word: null, messages: [] })
      } else {
        updateGameState({ status: 'picking', currentDrawerId: drawerId, hint: null, word: null })
      }
      setStrokes([])
      setHasGuessed(false)
      setShowWordPicker(false)
      addMessage({ type: 'system', text: `${drawerName} is choosing a word...` })
    })

    socket.on('choose-word', ({ wordChoices }) => { setWordChoices(wordChoices); setShowWordPicker(true) })

    socket.on('drawing-phase', ({ hint, drawTime }) => {
      setShowWordPicker(false)
      updateGameState({ status: 'drawing', hint, drawTime })
      setStrokes([])
      playSound('roundStart')
    })

    socket.on('your-word', ({ word }) => updateGameState({ word, hint: null }))
    socket.on('draw', (stroke) => setStrokes(prev => [...prev, stroke]))
    socket.on('wrong-guess', ({ username, guess }) => addMessage({ type: 'wrong', username, text: guess }))

    socket.on('correct-guess', ({ userId, username, score }) => {
      addMessage({ type: 'correct', username, text: `guessed the word! (+${score})` })
      if (userId === user.id) { setHasGuessed(true); playSound('correct') }
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
      updateGameState(prev => ({ tabSwitches: { ...prev.tabSwitches, [username]: count } }))
    })

    socket.on('player-joined', ({ message }) => { addMessage({ type: 'system', text: message }); addToast(message, 'info') })
    socket.on('player-left', ({ message }) => { addMessage({ type: 'system', text: message }); addToast(message, 'warning') })
    socket.on('player-disconnected', ({ message }) => { addMessage({ type: 'system', text: message }); addToast(message, 'warning') })
    socket.on('player-reconnected', ({ message }) => { addMessage({ type: 'system', text: message }); addToast(message, 'success') })
    socket.on('host-changed', ({ newHost }) => { if (newHost.id === user.id) addToast('you are now the host!', 'success') })

    socket.on('game-over', ({ winner, finalScores }) => {
      navigate(`/room/${roomId}/postgame`, { state: { winner, finalScores, isCompetitive, tabSwitches: gameState.tabSwitches } })
    })

    socket.on('reconnected', ({ room: r, strokes: s }) => {
      updateRoom(r); setStrokes(s || []); addToast('reconnected!', 'success')
    })

    return () => {
      ['picking-phase','choose-word','drawing-phase','your-word','draw','wrong-guess',
       'correct-guess','turn-ended','tab-switched','player-joined','player-left',
       'player-disconnected','player-reconnected','host-changed','game-over','reconnected']
        .forEach(e => socket.off(e))
    }
  }, [socket, user, roomId])

  const handleGuess = (guess) => socket.emit('guess', { roomId, userId: user.id, username: user.username, guess })
  const handleWordPick = (word) => { socket.emit('word-chosen', { roomId, word }); setShowWordPicker(false) }
  const handleEnd = () => { socket.emit('leave-room', { roomId, userId: user.id }); navigate('/') }

  const players = room?.players || []
  const currentRound = gameState.currentRound || room?.gameState?.currentRound || 1
  const totalRounds = room?.settings?.rounds || 3

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-cream"
      style={{ boxShadow: isCompetitive ? 'inset 0 0 0 6px var(--pink)' : 'none' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b-[3px] border-ink bg-cream">
        <div className="display text-2xl">drawzy<span className="text-pink">!</span></div>
        <div className="flex items-center gap-3">
          <span className="chip bg-cream">round {currentRound}/{totalRounds}</span>
          {isCompetitive && (
            <span className="chip bg-pink text-cream gap-2">
              <span className="w-2 h-2 bg-cream inline-block animate-blink" />
              competitive
            </span>
          )}
          {gameState.status === 'picking' && <span className="chip bg-cyan">choosing word...</span>}
        </div>
        <button onClick={handleEnd} className="btn btn-sm btn-cream">end</button>
      </div>

      {/* Word + timer bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b-[3px] border-ink bg-cream min-h-[64px]">
        <div className="flex-1">
          {gameState.status === 'drawing' && (
            <Timer duration={room?.settings?.drawTime || 60} active={gameState.status === 'drawing'} />
          )}
        </div>
        <div className="display text-4xl text-pink" style={{ letterSpacing: '0.15em' }}>
          {gameState.status === 'drawing'
            ? (isDrawer ? gameState.word : gameState.hint)
            : (gameState.status === 'picking' ? '...' : '')}
        </div>
        <div className="flex-1 text-right font-body font-bold text-ink/70 text-sm uppercase tracking-wider">
          {user?.username} {user?.avatar}
        </div>
      </div>

      {/* Tab alert */}
      {tabAlert && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-pink text-cream text-center display text-2xl py-3 animate-pop-in">
          👀 {tabAlert.username} just left the tab! (×{tabAlert.count})
        </div>
      )}

      {/* Word picker */}
      {showWordPicker && isDrawer && <WordPicker words={wordChoices} onPick={handleWordPick} />}

      {/* Turn end */}
      {turnEndOverlay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: 'color-mix(in oklab, var(--ink) 70%, transparent)' }}>
          <div className="blok bg-cream p-8 max-w-sm w-full mx-4 animate-pop-in text-center">
            <p className="font-body font-bold text-ink/60 uppercase tracking-widest text-xs mb-1">the word was</p>
            <h2 className="display text-5xl text-pink mb-5">{turnEndOverlay.word}</h2>
            <div className="flex flex-col gap-1">
              {turnEndOverlay.scores.slice(0, 3).map(p => (
                <div key={p.id} className="flex justify-between font-body font-bold">
                  <span>{p.username}</span>
                  <span className="display text-xl">{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="flex-1 min-h-0 grid p-3 gap-3" style={{ gridTemplateColumns: '200px 1fr 240px' }}>
        <Scoreboard players={players} currentDrawerId={gameState.currentDrawerId} tabSwitches={gameState.tabSwitches} currentUserId={user?.id} />
        <Canvas isDrawer={isDrawer} socket={socket} roomId={roomId} strokes={strokes} />
        <Chat messages={gameState.messages} onGuess={handleGuess} isDrawer={isDrawer} disabled={hasGuessed} />
      </div>
    </div>
  )
}
