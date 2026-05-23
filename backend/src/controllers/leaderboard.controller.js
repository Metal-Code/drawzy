import { getTopUsers } from '../models/user.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const getLeaderBoard = asyncHandler(async(req, res) => {
    const users = getTopUsers(50)
    return res.status(200).json(new ApiResponse(200, users, "Leaderboard fetched successfully"))
})

