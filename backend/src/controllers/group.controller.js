import { v4 as uuidv4 } from 'uuid'
import { createGroup, findGroupByInviteCode, addGroupMember, getGroupMembers, isGroupMember, getUserGroups, getGroupMatchHistory } from '../models/group.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const create = asyncHandler( async(req, res, next) => {
    const {name} = req.body
    if(!name)
        throw new ApiError(400, "Group name is required")

    const id = uuidv4()
    const inviteCode = uuidv4().slice(0,8).toUpperCase()
    createGroup(id, name, inviteCode, req.user.id)
    addGroupMember(id, req.user.id)

    return res.status(201).json(new ApiResponse(201, {id, name, inviteCode}, "Group created successfully"))
})

export const join = asyncHandler(async(req, res, next) => {
    const {inviteCode} = req.body
    if(!inviteCode)
        throw new ApiError(400, "Invite code is needed")
    const group = findGroupByInviteCode(inviteCode)
    if(!group)
        throw new ApiError(404, "The invite code is invalid")
    const alreadyMember = isGroupMember(group.id, req.user.id)
    if(alreadyMember)
        throw new ApiError(409, "Already a part of this group")

    addGroupMember(group.id, req.user.id)

    return res.status(200).json(new ApiResponse(200, {id: group.id, name: group.name}, "Group joined Successfully"))
})


export const getMembers = asyncHandler(async(req, res) => {
    const {groupId} = req.params
    const member = isGroupMember(groupId, req.user.id)
    if(!member)
        throw new ApiError(403, "You are not a member of this group")

    const groupMembers = getGroupMembers(groupId)
    return res.status(200).json(new ApiResponse(200, groupMembers, "Group members fetched successfully"))
})


export const getMyGroups = asyncHandler(async(req, res) => {
    const groups = getUserGroups(req.user.id)
    return res.status(200).json(new ApiResponse(200, groups, "User's group fetched successfully"))
})

export const getMatchHistory = asyncHandler(async(req, res) => {
    const {groupId} = req.params
    const member = isGroupMember(groupId, req.user.id)
    if(!member)
        throw new ApiError(403, "You are not a member of this group")

    const history = getGroupMatchHistory(groupId)
    return res.status(200).json(new ApiResponse(200, history, "Group's match history fetched successfully"))
})

