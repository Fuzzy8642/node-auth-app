const db       = require('../config/database');
const Task     = require('../models/taskModel');
const Project  = require('../models/projectModel');
const Activity = require('../models/activityModel');
const { can }  = require('../middleware/roles');

const VALID_STATUSES   = ['todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

// GET /api/tasks
exports.list = (req, res) => {
  const role   = req.session.role;
  const userId = req.session.userId;

  const canReadAll = can(role, 'task:read-all');
  const canReadOwn = can(role, 'task:read-own');

  if (!canReadAll && !canReadOwn) {
    return res.json([]);
  }

  const { q, status, priority, assignee_id } = req.query;

  const filters = {
    q:                typeof q === 'string' ? q : '',
    status:           VALID_STATUSES.includes(status) ? status : null,
    priority:         VALID_PRIORITIES.includes(priority) ? priority : null,
    assigneeId:       assignee_id && !isNaN(Number(assignee_id)) ? Number(assignee_id) : null,
    restrictToUserId: canReadAll ? null : userId
  };

  const tasks = Task.filter(filters);
  res.json(tasks);
};

// GET /api/tasks/assignees
exports.assignees = (req, res) => {
  const role   = req.session.role;
  const userId = req.session.userId;

  if (!can(role, 'task:read-all') && !can(role, 'task:read-own')) {
    return res.json([]);
  }

  if (can(role, 'task:read-all')) {
    const users = db.prepare('SELECT id, username FROM users WHERE deleted_at IS NULL ORDER BY username ASC').all();
    return res.json(users);
  } else {
    const me = db.prepare('SELECT id, username FROM users WHERE id = ? AND deleted_at IS NULL').all(userId);
    return res.json(me);
  }
};

// GET /api/tasks/:id
exports.get = (req, res) => {
  const task = Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Задача не найдена' });

  const isParticipant = task.assignee_id === req.session.userId
                     || task.author_id   === req.session.userId;
  if (!can(req.session.role, 'task:read-all') && !isParticipant) {
    return res.status(403).json({ error: 'Нет доступа к задаче' });
  }
  res.json(task);
};

// POST /api/tasks
exports.create = (req, res) => {
  const { project_id, title, description, priority, assignee_id, due_date } = req.body;
  if (!title || !project_id) {
    return res.status(400).json({ error: 'title и project_id обязательны' });
  }

  const project = Project.findById(Number(project_id));
  if (!project) {
    return res.status(400).json({ error: 'Проект не найден' });
  }

  const author = db.prepare('SELECT id FROM users WHERE id = ?').get(req.session.userId);
  if (!author) {
    return res.status(401).json({ error: 'Сессия устарела, перезайдите в систему' });
  }

  let finalAssignee = req.session.userId;

  if (can(req.session.role, 'task:assign')) {
    if (assignee_id === '' || assignee_id === null || assignee_id === undefined) {
      finalAssignee = null;
    } else {
      const parsedId = Number(assignee_id);
      const assigneeUser = !isNaN(parsedId)
        ? db.prepare('SELECT id FROM users WHERE id = ?').get(parsedId)
        : null;

      if (!assigneeUser) {
        return res.status(400).json({ error: 'Указанный исполнитель не найден' });
      }
      finalAssignee = parsedId;
    }
  }

  const result = Task.create({
    project_id:  Number(project_id),
    title:       title.trim(),
    description: description || null,
    priority:    VALID_PRIORITIES.includes(priority) ? priority : 'medium',
    author_id:   req.session.userId,
    assignee_id: finalAssignee,
    due_date:    due_date || null
  });

  Activity.log({
    user_id: req.session.userId,
    action: 'task.create',
    entity_type: 'task',
    entity_id: result.lastInsertRowid,
    details: title
  });

  res.status(201).json({ id: result.lastInsertRowid });
};

// PUT /api/tasks/:id
exports.update = (req, res) => {
  const task = Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Не найдено' });

  const canEditAny    = can(req.session.role, 'task:edit-any');
  const canEditOwn    = can(req.session.role, 'task:edit-own');
  const isParticipant = task.author_id === req.session.userId || task.assignee_id === req.session.userId;

  if (!canEditAny && !(canEditOwn && isParticipant)) {
    return res.status(403).json({ error: 'Нет прав на редактирование' });
  }

  Task.update({
    id:          task.id,
    title:       req.body.title       ?? task.title,
    description: req.body.description ?? task.description,
    status:      VALID_STATUSES.includes(req.body.status)     ? req.body.status   : task.status,
    priority:    VALID_PRIORITIES.includes(req.body.priority) ? req.body.priority : task.priority,
    assignee_id: canEditAny ? (req.body.assignee_id ?? task.assignee_id) : task.assignee_id,
    due_date:    req.body.due_date ?? task.due_date
  });

  Activity.log({
    user_id: req.session.userId,
    action: 'task.update',
    entity_type: 'task',
    entity_id: task.id,
    details: req.body.status ? `Статус: ${req.body.status}` : null
  });

  res.json({ ok: true });
};

// DELETE /api/tasks/:id
exports.remove = (req, res) => {
  const task = Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Не найдено' });

  Task.remove(task.id);
  Activity.log({ user_id: req.session.userId, action: 'task.delete',
                 entity_type: 'task', entity_id: task.id, details: task.title });
  res.json({ ok: true });
};
