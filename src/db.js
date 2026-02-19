const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

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

function ensureDefaultUsers() {
  const defaults = [
    {
      phone: process.env.DEFAULT_ADMIN_PHONE || "+998900000000",
      name: process.env.DEFAULT_ADMIN_NAME || "Default Admin",
      password: process.env.DEFAULT_ADMIN_PASSWORD || "admin123",
      role: "admin",
    },
    {
      phone: process.env.DEFAULT_BARBER_PHONE || "+998900000001",
      name: process.env.DEFAULT_BARBER_NAME || "Default Barber",
      password: process.env.DEFAULT_BARBER_PASSWORD || "barber123",
      role: "barber",
    },
  ];

  const findUserByPhone = db.prepare(
    "SELECT id, password_hash, name, role FROM users WHERE phone = ?"
  );
  const createUser = db.prepare(
    "INSERT INTO users (phone, name, password_hash, role) VALUES (?, ?, ?, ?)"
  );
  const updateUser = db.prepare(
    "UPDATE users SET name = ?, password_hash = ?, role = ? WHERE id = ?"
  );

  for (const user of defaults) {
    const existing = findUserByPhone.get(user.phone);
    const passwordHash = bcrypt.hashSync(user.password, 10);

    if (!existing) {
      createUser.run(user.phone, user.name, passwordHash, user.role);
    } else {
      updateUser.run(user.name, passwordHash, user.role, existing.id);
    }

    console.log(
      `[default-${user.role}] phone: ${user.phone} | password: ${user.password}`
    );
  }
}

ensureDefaultUsers();

module.exports = db;
