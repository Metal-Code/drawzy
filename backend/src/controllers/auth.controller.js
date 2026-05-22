import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { createUser, findUserByUsername } from '../models/user.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const register = asyncHandler( async(req, res, next) => {
    const {username, password, avatar} = req.body 

    if(!username || !password)
        throw new ApiError(400, "Username and password are needed")

    const existingUser = findUserByUsername(username)

    if(existingUser)
        throw new ApiError(409, "Username is already token")

    const hashedPassword = await bcrypt.hash(password, 10)
    const id = uuidv4()

    createUser(id, username, hashedPassword, avatar || 'default')
    
    return res.status(201).json(new ApiResponse(201, "User registered successfully"))
})


export const login = asyncHandler( async(req, res, next) => {
    const {username, password} = req.body
    if(!username)
        throw new ApiError(400, "Username is required")
    if(!password)
        throw new ApiError(400, "Password is required")

    const user = findUserByUsername(username)
    if(!user)
        throw new ApiError(404, "User doesn't exist")

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if(!isPasswordValid)
        throw new ApiError(401, "Invalid Credentials")

    const token = jwt.sign(
        {
            id :  user.id
        },
        process.env.JWT_SECRET,
        {
            expiresIn : '7d'
        }
    )

    return res
        .status(201)
        .cookie('token', token, {
            httpOnly : true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        .json(new ApiResponse(200, {
            id : user.id, username : user.username, avatar : user.avatar
        }))

})


export const logout = asyncHandler(async(req, res, next) => {
    return res
        .status(200)
        .clearCookie('token')
        .json(new ApiResponse(200, null, 'logout successfull'))
})
