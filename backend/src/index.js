import './config/env.js'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { app } from './app.js'
import { db } from './db/index.js'
import { initSocket } from './socket/index.js'
import { allowedOrigins } from './config/constants.js'

const httpServer = createServer(app)

export const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    },
    maxHttpBufferSize: 1e7,
})

initSocket(io)

httpServer.listen(process.env.PORT || 8000, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})