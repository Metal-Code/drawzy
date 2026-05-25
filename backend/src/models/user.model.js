import { db } from '../db/index.js'

const createUser = (id, username, hashedPassword, avatar) => {
    const stmt = db.prepare(`
        INSERT INTO users (id, username, password, avatar)
        values (?, ?, ?, ?)
        `)

    return stmt.run(id, username, hashedPassword, avatar)
}


const findUserByUsername = (username) => {
    const stmt = db.prepare(`SELECT * FROM users where username = ?`)
    return stmt.get(username)
}

const findUserById = (id) => {
    const stmt = db.prepare(`SELECT * FROM users where id = ?`)
    return stmt.get(id)
}

const updateUserStats = (id, points, won) => {
    const stmt = db.prepare(`
        UPDATE users SET   
            total_points = total_points + ?,
            games_played = games_played + 1,
            games_won = games_won + ?
        WHERE id = ?
    `)
    return stmt.run(points, won ? 1 : 0, id)
}

const getTopUsers = (limit = 50) => {
    const stmt = db.prepare(`
        SELECT id, username, avatar, total_points, games_played, games_won
        FROM users
        ORDER BY total_points DESC
        LIMIT ?
        `)

    return stmt.all(limit)
}

export {createUser, findUserByUsername, findUserById, updateUserStats, getTopUsers}