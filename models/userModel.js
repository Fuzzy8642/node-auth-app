const db = require('../config/database');

const insertUser = db.prepare(`
  INSERT INTO users (username, password_hash)
  VALUES (?, ?)
`);

const findUserByUsername = db.prepare(`
  SELECT id, username, password_hash, role FROM users WHERE username = ? AND deleted_at IS NULL
`);

const findUserById = db.prepare(`
  SELECT id, username, email, role, created_at FROM users WHERE id = ? AND deleted_at IS NULL
`);

const listAllStmt = db.prepare(`
  SELECT id, username, email, role, created_at FROM users WHERE deleted_at IS NULL ORDER BY id
`);

const listDeletedStmt = db.prepare(`
  SELECT id, username, email, role, deleted_at FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC
`);

const updateRoleStmt = db.prepare(`UPDATE users SET role = ? WHERE id = ?`);
const removeStmt     = db.prepare(`UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`);
const restoreStmt    = db.prepare(`UPDATE users SET deleted_at = NULL WHERE id = ?`);

module.exports = {
  createUser(username, passwordHash) {
    return insertUser.run(username, passwordHash);
  },
  findByUsername(username) {
    return findUserByUsername.get(username);
  },
  findById(id) {
    return findUserById.get(id);
  },
  listAll() {
    return listAllStmt.all();
  },
  listDeleted() {
    return listDeletedStmt.all();
  },
  updateRole(id, role) {
    return updateRoleStmt.run(role, id);
  },
  remove(id) {
    return removeStmt.run(id);
  },
  restore(id) {
    return restoreStmt.run(id);
  }
};
