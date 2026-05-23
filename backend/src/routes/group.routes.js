import { Router } from 'express'
import { create, join, getMembers, getMyGroups, getMatchHistory } from '../controllers/group.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'


const router = Router()
router.use(verifyJWT)

router.post('/create', create)
router.post('/join', join)
router.get('/my-groups', getMyGroups)
router.get('/:groupId/members', getMembers)
router.get('/:groupId/history', getMatchHistory)

export default router