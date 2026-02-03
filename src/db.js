const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "data.sqlite");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS barbershops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image TEXT,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    opening_time TEXT NOT NULL,
    closing_time TEXT NOT NULL,
    owner_id INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barbershop_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id)
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS working_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barbershop_id INTEGER NOT NULL,
    day_of_week TEXT NOT NULL,
    opening_time TEXT,
    closing_time TEXT,
    is_day_off INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id)
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    barbershop_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  )
`
).run();

module.exports = db;
