import { db } from '../db/index.js'

const createGroup = (id, name, inviteCode, createdBy) => {
    const stmt = db.prepare(`
        INSERT into groups(id, name, invite_code, created_by)
        VALUES (?, ?, ?, ?)
        `)
    return stmt.run(id, name, inviteCode, createdBy)
}

const findGroupById = (id) => {
    const stmt = db.prepare(`
        SELECT * FROM groups WHERE id = ?
        `)
    return stmt.get(id)
}

const findGroupByInviteCode = (inviteCode) => {
    const stmt = db.prepare(`
        SELECT * FROM groups WHERE invite_code = ?
        `)

    return stmt.get(inviteCode)
}

const addGroupMember = (groupId, userId) => {
    const stmt = db.prepare(`
        INSERT INTO group_members (group_id, user_id)
        VALUES (?, ?)
        `)
    return stmt.run(groupId, userId)
}

const getGroupMembers = (groupId) => {
    const stmt = db.prepare(`
        SELECET users.id, users.username, users.avatar, users.total_points
        FROM group_members
        JOIN users ON group_members.user_id = users.id
        WHERE group_members.group_id = ?
        `)
    return stmt.all(groupId)
}

const isGroupMember = (groupId, userId) => {
    const stmt = db.prepare(`
        SELECT * FROM group_members 
        where group_id = ? AND user_id = ?
        `)
    return stmt.get(groupId, userId)
}

const getUserGroups = (userId) => {
    const stmt = db.prepare(`
        SELECT groups.id, groups.name, groups.invite_code, groups.created_by, groups.created_at
        FROM group_members
        JOIN groups ON group_members.group_id = groups.id
        WHERE group_members.user_id = ?
        `)
    return stmt.all(userId)
}

const addMatchHistory = (id, groupId, winnerId) => {
    const stmt = db.prepare(`
        INSERT INTO group_match_history (id, group_id, winner_id)
        VALUES (?, ?, ?)
    `)
    return stmt.run(id, groupId, winnerId)
}

const getGroupMatchHistory = (groupId) => {
    const stmt = db.prepare(`
        SELECT group_match_history.id, group_match_history.played_at,
        users.username as winner_username, users.avatar as winner_avatar
        FROM group_match_history
        JOIN users ON group_match_history.winner_id = users.id
        WHERE group_match_history.group_id = ?
        ORDER BY group_match_history.played_at DESC
    `)
    return stmt.all(groupId)
}

export {
    createGroup,
    findGroupById,
    findGroupByInviteCode,
    addGroupMember,
    getGroupMembers,
    isGroupMember,
    getUserGroups,
    addMatchHistory,
    getGroupMatchHistory
}