import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import { createServer } from 'http'
import { Server } from 'socket.io'
import { app } from './app.js'
import { db } from './db/index.js'

const httpServer = createServer(app)

export const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
})

httpServer.listen(process.env.PORT || 8000, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})