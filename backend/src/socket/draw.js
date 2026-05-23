import { rooms } from './room.js'

export const handleDraw = (socket, { roomId, stroke }) => {
    const room = rooms[roomId]
    if (!room) return

    room.gameState.strokes.push(stroke)
    socket.to(roomId).emit('draw', stroke)
}

export const handleClearCanvas = (socket, io, { roomId, userId }) => {
    const room = rooms[roomId]
    if (!room) return

    const drawer = room.players[room.gameState.currentDrawerIndex]
    if (drawer?.id !== userId) return

    room.gameState.strokes = []
    io.to(roomId).emit('canvas-cleared')
}

export const handleUndo = (socket, io, { roomId, userId }) => {
    const room = rooms[roomId]
    if (!room) return

    const drawer = room.players[room.gameState.currentDrawerIndex]
    if (drawer?.id !== userId) return

    room.gameState.strokes.pop()
    io.to(roomId).emit('undo', { strokes: room.gameState.strokes })
}