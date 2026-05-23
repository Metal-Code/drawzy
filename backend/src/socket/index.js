import { io } from '../index.js'
import {
    createRoom,
    joinRoom,
    playerReady,
    leaveRoom,
    handleDisconnect,
    reconnectToRoom
} from './room.js'
import { handleDraw, handleClearCanvas, handleUndo } from './draw.js'
import { handleGuess, handleTabSwitch } from './chat.js'
import { startGame, wordChosen } from './game.js'

export const initSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`)

        socket.on('create-room', (data) => {
    if (!data || !data.user) {
        socket.emit('error', { message: 'User data is required' })
        return
    }
    createRoom(socket, data.user, data.settings)
})
        socket.on('join-room', (data) => joinRoom(socket, data))
        socket.on('player-ready', (data) => playerReady(socket, data))
        socket.on('leave-room', (data) => leaveRoom(socket, data))
        socket.on('reconnect-to-room', (data) => reconnectToRoom(socket, data))

        socket.on('start-game', (data) => startGame(io, socket, data))
        socket.on('word-chosen', (data) => wordChosen(io, data.roomId, data.word))

        socket.on('draw', (data) => handleDraw(socket, data))
        socket.on('clear-canvas', (data) => handleClearCanvas(socket, io, data))
        socket.on('undo', (data) => handleUndo(socket, io, data))

        socket.on('guess', (data) => handleGuess(socket, io, data))
        socket.on('tab-switch', (data) => handleTabSwitch(socket, io, data))

        socket.on('disconnect', () => handleDisconnect(socket, io))

        socket.on('error', (error) => {
            console.error(`Socket error: ${error.message}`)
        })
    })
}