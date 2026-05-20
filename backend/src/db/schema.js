import { db } from './index.js'

const createTables = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT DEFAULT 'default',
            total_points INTEGER DEFAULT 0,
            games_played INTEGER DEFAULT 0,
            games_won INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            invite_code TEXT UNIQUE NOT NULL,
            created_by TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS group_members (
            group_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (group_id, user_id),
            FOREIGN KEY (group_id) REFERENCES groups(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS group_match_history (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            winner_id TEXT NOT NULL,
            played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES groups(id),
            FOREIGN KEY (winner_id) REFERENCES users(id)
        );
    `)
}

export { createTables }