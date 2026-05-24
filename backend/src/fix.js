import Database from 'better-sqlite3'
const db = new Database('./drawzy.db')
db.prepare("UPDATE users SET avatar = '🎨' WHERE username = 'ayush'").run()
console.log('Fixed!')
db.close()