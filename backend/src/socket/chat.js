import { rooms } from './room.js'

export const handleGuess = (socket, io, { roomId, userId, username, guess }) => {
    const room = rooms[roomId]
    if (!room) return

    if (room.gameState.status !== 'drawing') return

    const drawer = room.players[room.gameState.currentDrawerIndex]
    if (drawer?.id === userId) return

    const currentWord = room.gameState.currentWord?.toLowerCase().trim()
    const playerGuess = guess?.toLowerCase().trim()

    if (playerGuess === currentWord) {
        const timeElapsed = (Date.now() - room.gameState.roundStartTime) / 1000
        const timeLimit = room.settings.drawTime
        const score = Math.max(100, Math.round(500 * (1 - timeElapsed / timeLimit)))

        const player = room.players.find(p => p.id === userId)
        if (player) player.score += score

        io.to(roomId).emit('correct-guess', {
            userId,
            username,
            score,
            message: `${username} guessed the word!`
        })

        const allGuessed = room.players
            .filter(p => p.id !== drawer.id && p.isConnected)
            .every(p => p.hasGuessedCorrect)

        if (allGuessed) {
            import('./game.js').then(({ nextTurn }) => nextTurn(io, roomId))
        }
    } else {
        socket.to(roomId).emit('wrong-guess', { userId, username, guess })
    }
}

export const handleTabSwitch = (socket, io, { roomId, userId, username }) => {
    const room = rooms[roomId]
    if (!room || !room.settings.isCompetitive) return

    if (!room.gameState.tabSwitches[userId]) {
        room.gameState.tabSwitches[userId] = 0
    }

    room.gameState.tabSwitches[userId]++

    io.to(roomId).emit('tab-switched', {
        userId,
        username,
        count: room.gameState.tabSwitches[userId],
        message: `${username} switched tabs!`
    })
}