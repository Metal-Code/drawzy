import { createContext, useContext, useState } from 'react'

const RoomContext = createContext(null)

export const RoomProvider = ({ children }) => {
  const [room, setRoom] = useState(null)
  const [gameState, setGameState] = useState({
    status: 'waiting',
    currentDrawerId: null,
    hint: null,
    timeLeft: 60,
    messages: [],
    tabSwitches: {},
    currentRound: 0,
    totalRounds: 0,
    wordChoices: [],
    myTurn: false,
    word: null,
  })

  const updateRoom = (roomData) => {
    if (roomData) setRoom(roomData)
  }

  const updateGameState = (partial) =>
    setGameState(prev => ({ ...prev, ...partial }))

  const addMessage = (msg) =>
    setGameState(prev => ({ ...prev, messages: [...prev.messages, msg] }))

  const resetRoom = () => {
    setRoom(null)
    setGameState({
      status: 'waiting',
      currentDrawerId: null,
      hint: null,
      timeLeft: 60,
      messages: [],
      tabSwitches: {},
      currentRound: 0,
      totalRounds: 0,
      wordChoices: [],
      myTurn: false,
      word: null,
    })
  }

  return (
    <RoomContext.Provider value={{ room, gameState, updateRoom, updateGameState, addMessage, resetRoom }}>
      {children}
    </RoomContext.Provider>
  )
}

export const useRoom = () => useContext(RoomContext)
