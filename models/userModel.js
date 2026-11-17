const db = require('../config/database');

// Подготовленные выражения
const insertUser = db.prepare(`
  INSERT INTO users (username, password_hash)
  VALUES (?, ?)
`);

// ВОТ ТУТ МЫ ДОБАВИЛИ role
const findUserByUsername = db.prepare(`
  SELECT id, username, password_hash, role FROM users WHERE username = ? AND deleted_at IS NULL
`);

module.exports = {
  createUser(username, passwordHash) {
    return insertUser.run(username, passwordHash);
  },
  findByUsername(username) {
    return findUserByUsername.get(username);
  }
};

// Добавьте в модуль:
const listALL = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE deleted_at IS NULL ORDER BY id');
const listDeleted = db.prepare('SELECT id, username, email, role, deleted_at FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DWSC');

const updateRole = db.prepare('UPDATE users SET role = ? WHERE id = ?');
const remove = db.prepare('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
const restore = db.prepare('UPDATE users SET deleted_at = NULL WHERE id = ?');
