import jwt from 'jsonwebtoken'
import {findUserById} from '../models/user.model.js'
import {ApiError} from '../utils/ApiError.js'
import {asyncHandler} from '../utils/asyncHandler.js'

export const verifyJWT = asyncHandler( async(req, res, next) => {
    const token = req.cookies?.token
    if(!token)
        throw new ApiError(401, "Unauthorized Access")

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = findUserById(decoded.id)

    if(!user)
        throw new ApiError(401, "Invalid Token")

    req.user = user
    next()
})