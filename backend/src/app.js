import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js'
import groupRoutes from './routes/group.routes.js'
import leaderboardRoutes from './routes/leaderboard.routes.js'
import { errorMiddleware } from './middlewares/error.middleware.js'
import { allowedOrigins } from './config/constants.js'


const app = express();

app.use(cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true
}))


app.use(express.json({
    limit : "16kb"
}))


app.use(express.urlencoded({ 
    extended: true, limit: "16kb" 
}))


app.use(cookieParser())
app.use('/api/auth', authRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use(errorMiddleware)

export {app}
