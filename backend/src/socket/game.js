import { generateWordsForGame } from '../services/words.service.js'
import { rooms } from './room.js'
import { updateUserStats } from '../models/user.model.js'
import { addMatchHistory } from '../models/group.model.js'
import { v4 as uuidv4 } from 'uuid'

export const startGame = async (io, socket, { roomId, userId }) => {
    const room = rooms[roomId]
    if (!room) return

    if (room.host !== userId) {
        socket.emit('error', { message: 'Only host can start the game' })
        return
    }

    if (room.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' })
        return
    }

    // const allReady = room.players.every(p => p.isReady || p.id === userId)
    // if (!allReady) {
    //     socket.emit('error', { message: 'Not all players are ready' })
    //     return
    // }

    const wordSets = await generateWordsForGame(
        room.settings.rounds,
        room.players.length,
        room.settings.difficulty
    )

    room.gameState.wordSets = wordSets
    room.gameState.status = 'playing'
    room.gameState.currentRound = 1
    room.gameState.currentDrawerIndex = 0

    io.to(roomId).emit('game-started', { room })

    startTurn(io, roomId)
}

export const startTurn = (io, roomId) => {
    const room = rooms[roomId]
    if (!room) return

    room.gameState.strokes = []
    room.gameState.currentWord = null
    room.gameState.status = 'picking'

    room.players.forEach(p => p.hasGuessedCorrect = false)

    const drawer = room.players[room.gameState.currentDrawerIndex]
    const turnIndex = (room.gameState.currentRound - 1) * room.players.length + room.gameState.currentDrawerIndex
    const wordChoices = room.gameState.wordSets[turnIndex]

    room.gameState.wordChoices = wordChoices

    io.to(roomId).emit('picking-phase', {
        drawerId: drawer.id,
        drawerName: drawer.username
    })

    io.to(drawer.socketId).emit('choose-word', { wordChoices })

    room.gameState.pickingTimer = setTimeout(() => {
        if (!room.gameState.currentWord) {
            const randomWord = wordChoices[Math.floor(Math.random() * wordChoices.length)]
            wordChosen(io, roomId, randomWord)
        }
    }, 20000)
}

export const wordChosen = (io, roomId, word) => {
    const room = rooms[roomId]
    if (!room) return

    clearTimeout(room.gameState.pickingTimer)

    room.gameState.currentWord = word
    room.gameState.status = 'drawing'
    room.gameState.roundStartTime = Date.now()

    const wordHint = '_'.repeat(word.length)

    io.to(roomId).emit('drawing-phase', {
        hint: wordHint,
        wordLength: word.length,
        drawTime: room.settings.drawTime
    })

    const drawer = room.players[room.gameState.currentDrawerIndex]
    io.to(drawer.socketId).emit('your-word', { word })

    room.gameState.drawingTimer = setTimeout(() => {
        endTurn(io, roomId)
    }, room.settings.drawTime * 1000)
}

export const nextTurn = (io, roomId) => {
    const room = rooms[roomId]
    if (!room) return

    clearTimeout(room.gameState.drawingTimer)
    clearTimeout(room.gameState.pickingTimer)

    endTurn(io, roomId)
}

export const endTurn = (io, roomId) => {
    const room = rooms[roomId]
    if (!room) return

    clearTimeout(room.gameState.drawingTimer)
    clearTimeout(room.gameState.pickingTimer)

    io.to(roomId).emit('turn-ended', {
        word: room.gameState.currentWord,
        scores: room.players.map(p => ({ id: p.id, username: p.username, score: p.score }))
    })

    room.gameState.currentDrawerIndex++

    if (room.gameState.currentDrawerIndex >= room.players.length) {
        room.gameState.currentDrawerIndex = 0
        room.gameState.currentRound++

        if (room.gameState.currentRound > room.settings.rounds) {
            endGame(io, roomId)
            return
        }
    }

    setTimeout(() => startTurn(io, roomId), 5000)
}

export const endGame = async (io, roomId) => {
    const room = rooms[roomId]
    if (!room) return

    const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
    const winner = sortedPlayers[0]

    io.to(roomId).emit('game-over', {
        winner,
        finalScores: sortedPlayers
    })

    try {
        for (const player of room.players) {
            if (player.isGuest) continue
            const won = player.id === winner.id
            await updateUserStats(player.id, player.score, won)
        }

        if (room.settings.isGroupRoom && room.settings.groupId) {
            await addMatchHistory(uuidv4(), room.settings.groupId, winner.id)
        }
    } catch (error) {
        console.error('Failed to save game results:', error.message)
    }

    room.gameState = {
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

    room.players.forEach(p => {
        p.score = 0
        p.isReady = false
        p.hasGuessedCorrect = false
    })

    io.to(roomId).emit('back-to-lobby', { room })
}