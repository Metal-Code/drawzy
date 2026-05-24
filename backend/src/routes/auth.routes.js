import { Router } from 'express'
import { register, login, logout, me } from '../controllers/auth.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', verifyJWT, logout)
router.get('/me', verifyJWT, me)

export default router