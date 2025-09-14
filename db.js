const Database = require("better-sqlite3");

const db = new Database("expenses.sqlite");

// Create table if it doesn’t exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    paid_by TEXT NOT NULL
  )
`).run();

module.exports = db;