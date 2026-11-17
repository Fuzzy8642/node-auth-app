const db = require('../config/database');

const SELECT_BASE = `
  SELECT t.*, 
         COALESCE(a.username, 'Удалён') AS author_name,
         s.username AS assignee_name,
         p.title    AS project_title
  FROM tasks t
  LEFT JOIN users a ON a.id = t.author_id
  LEFT JOIN users s ON s.id = t.assignee_id
  JOIN projects p ON p.id = t.project_id
`;


const stmts = {
  all:            db.prepare(`${SELECT_BASE} WHERE t.deleted_at IS NULL ORDER BY t.created_at DESC`),
  byAssignee:     db.prepare(`${SELECT_BASE} WHERE t.assignee_id = ? AND t.deleted_at IS NULL ORDER BY t.created_at DESC`),
  byProject:      db.prepare(`${SELECT_BASE} WHERE t.project_id = ? AND t.deleted_at IS NULL ORDER BY t.created_at DESC`),
  findById:       db.prepare(`${SELECT_BASE} WHERE t.id = ? AND t.deleted_at IS NULL`),
  deletedALL:     db.prepare('${SELECT_BASE} WHERE t.deleted_at IS NOT NULL ORDER BY t.deleted_at DESC'),
  remove:         db.prepare('UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?'),
  restore:        db.prepare('UPDATE tasks SET dleted_at = NULL WHERE id = ?'),
  insert: db.prepare(`
    INSERT INTO tasks (project_id, title, description, priority, author_id, assignee_id, due_date)
    VALUES (@project_id, @title, @description, @priority, @author_id, @assignee_id, @due_date)
  `),
  update: db.prepare(`
    UPDATE tasks
    SET title = @title, description = @description, status = @status,
        priority = @priority, assignee_id = @assignee_id, due_date = @due_date,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),
  remove: db.prepare(`DELETE FROM tasks WHERE id = ?`)
};

function filter({ q, status, priority, assigneeId, restrictToUserId } = {}) {
  const conditions = ['t.deleted_at IS NULL'];
  const params = [];

  if (restrictToUserId !== undefined && restrictToUserId !== null) {
    conditions.push('(t.assignee_id = ? OR t.author_id = ?)');
    params.push(restrictToUserId, restrictToUserId);
  }

  if (q && q.trim()) {
    conditions.push('t.title LIKE ?');
    params.push(`%${q.trim()}%`);
  }

  if (status) {
    conditions.push('t.status = ?');
    params.push(status);
  }

  if (priority) {
    conditions.push('t.priority = ?');
    params.push(priority);
  }

  if (assigneeId) {
    conditions.push('t.assignee_id = ?');
    params.push(assigneeId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `${SELECT_BASE} ${whereClause} ORDER BY t.created_at DESC`;

  return db.prepare(sql).all(...params);
}

module.exports = {
  all:         () => stmts.all.all(),
  byAssignee:  (uid) => stmts.byAssignee.all(uid),
  byProject:   (pid) => stmts.byProject.all(pid),
  findById:    (id) => stmts.findById.get(id),
  create:      (d) => stmts.insert.run(d),
  update:      (d) => stmts.update.run(d),
  remove:      (id) => stmts.remove.run(id),
  deletedALL:  ()=> stmts.deletedALL(),
  restore:     (id)=>stmts.restore.run(id),
  filter
};
