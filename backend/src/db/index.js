import Database from 'better-sqlite3'
import { createTables } from './schema.js'

export const db = new Database('drawzy.db')
createTables()