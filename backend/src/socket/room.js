import { v4 as uuidv4 } from 'uuid'
// import { reconnectTokens } from './room.js'

export const rooms = {}
export const reconnectTokens = {}

export const createRoom = (socket, { userId, username, avatar, isGuest }, settings) => {
    const roomId = uuidv4().slice(0, 6).toUpperCase()

    rooms[roomId] = {
        id: roomId,
        host: userId,
        players: [
            {
                id: userId,
                username,
                avatar: avatar || 'default',
                score: 0,
                isReady: false,
                socketId: socket.id,
                isConnected: true,
                isGuest: isGuest || false
            }
        ],
        settings: {
            rounds: settings?.rounds || 3,
            drawTime: settings?.drawTime || 60,
            difficulty: settings?.difficulty || 'easy',
            isCompetitive: settings?.isCompetitive || false,
            isGroupRoom: settings?.isGroupRoom || false,
            groupId: settings?.groupId || null,
            maxPlayers: 10
        },
        gameState: {
            status: 'waiting',
            currentRound: 0,
            currentDrawerIndex: 0,
            currentWord: null,
            wordChoices: [],
            wordSets: [],
            pickingTimer: null,
            drawingTimer: null,
            strokes: [],
            tabSwitches: {}
        }
    }

    socket.join(roomId)
    socket.emit('room-created', { roomId, room: rooms[roomId] })
}

export const joinRoom = (socket, { roomId, userId, username, avatar, isGuest }) => {
    const room = rooms[roomId]

    if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
    }

    if (room.players.length >= room.settings.maxPlayers) {
        socket.emit('error', { message: 'Room is full' })
        return
    }

    if (room.settings.isGroupRoom && room.settings.groupId) {
        socket.join(`group:${room.settings.groupId}`)
    }

    const existingPlayer = room.players.find(p => p.id === userId)
    if (existingPlayer) {
        existingPlayer.socketId = socket.id
        socket.join(roomId)
        socket.emit('room-joined', { roomId, room })
        return
    }

    const player = {
        id: userId,
        username,
        avatar: avatar || 'default',
        score: 0,
        isReady: false,
        socketId: socket.id,
        isConnected: true,
        isGuest: isGuest || false,
        hasGuessedCorrect: false
    }


    room.players.push(player)
    socket.join(roomId)

    socket.emit('room-joined', { roomId, room })
    socket.to(roomId).emit('player-joined', { player, room, message: `${username} joined the game` })
}

export const playerReady = (socket, { roomId, userId }) => {
    const room = rooms[roomId]
    if (!room) return

    const player = room.players.find(p => p.id === userId)
    if (!player) return

    player.isReady = !player.isReady
    socket.to(roomId).emit('player-ready', { userId, isReady: player.isReady })
}

export const leaveRoom = (socket, { roomId, userId }) => {
    const room = rooms[roomId]
    if (!room) return

    const player = room.players.find(p => p.id === userId)
    if (!player) return

    room.players = room.players.filter(p => p.id !== userId)
    socket.leave(roomId)

    if (room.players.length === 0) {
        delete rooms[roomId]
        return
    }

    if (room.host === userId) {
        room.host = room.players[0].id
        socket.to(roomId).emit('host-changed', { newHost: room.players[0] })
    }

    socket.to(roomId).emit('player-left', {
        userId,
        message: `${player.username} left the game`
    })
}

export const handleDisconnect = (socket, io) => {
    for (const roomId in rooms) {
        const room = rooms[roomId]
        const player = room.players.find(p => p.socketId === socket.id)

        if (!player) continue

        if (room.settings.isGroupRoom) {
            player.isConnected = false

            const token = uuidv4()
            reconnectTokens[token] = {
                roomId,
                userId: player.id,
                expiresAt: Date.now() + 60 * 60 * 1000
            }

            socket.emit('reconnect-token', { token })

            socket.to(roomId).emit('player-disconnected', {
                userId: player.id,
                username: player.username,
                message: `${player.username} disconnected`
            })

            if (room.gameState.status === 'drawing') {
                const isDrawer = room.players[room.gameState.currentDrawerIndex]?.id === player.id

                if (isDrawer) {
                    socket.to(roomId).emit('drawer-disconnected', {
                        message: `${player.username} disconnected. Waiting 15 seconds...`
                    })

                    room.gameState.disconnectTimer = setTimeout(() => {
                        const stillDisconnected = room.players.find(p => p.id === player.id && !p.isConnected)
                        if (stillDisconnected) {
                            room.players = room.players.filter(p => p.id !== player.id)
                            io.to(roomId).emit('drawer-skipped', {
                                message: `${player.username} was skipped`
                            })
                            import('./game.js').then(({ nextTurn }) => nextTurn(io, roomId))
                        }
                    }, 15000)
                } else {
                    room.players = room.players.filter(p => p.id !== player.id)
                }
            }
        } else {
            room.players = room.players.filter(p => p.id !== player.id)

            if (room.players.length === 0) {
                delete rooms[roomId]
                return
            }

            if (room.host === player.id) {
                room.host = room.players[0].id
                io.to(roomId).emit('host-changed', { newHost: room.players[0] })
            }

            socket.to(roomId).emit('player-left', {
                userId: player.id,
                message: `${player.username} left the game`
            })

            if (room.gameState.status === 'drawing') {
                const isDrawer = room.players[room.gameState.currentDrawerIndex]?.id === player.id
                if (isDrawer) {
                    import('./game.js').then(({ nextTurn }) => nextTurn(io, roomId))
                }
            }
        }

        break
    }
}

export const reconnectToRoom = (socket, { token, userId }) => {
    const reconnectData = reconnectTokens[token]

    if (!reconnectData) {
        socket.emit('error', { message: 'Invalid or expired reconnect token' })
        return
    }

    if (Date.now() > reconnectData.expiresAt) {
        delete reconnectTokens[token]
        socket.emit('error', { message: 'Reconnect token expired' })
        return
    }

    const { roomId } = reconnectData
    const room = rooms[roomId]

    if (!room) {
        socket.emit('error', { message: 'Room no longer exists' })
        return
    }

    const player = room.players.find(p => p.id === userId)
    if (!player) {
        socket.emit('error', { message: 'Player not found in room' })
        return
    }

    player.socketId = socket.id
    player.isConnected = true
    delete reconnectTokens[token]

    if (room.gameState.disconnectTimer) {
        clearTimeout(room.gameState.disconnectTimer)
        room.gameState.disconnectTimer = null
    }

    socket.join(roomId)
    socket.emit('reconnected', { room, strokes: room.gameState.strokes })
    socket.to(roomId).emit('player-reconnected', {
        userId,
        message: `${player.username} reconnected`
    })
}