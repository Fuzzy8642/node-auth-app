const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const commentRoutes = require('./commentRoutes');
const { requireAuth, requirePermission } = require('../middleware/roles');

router.get('/',          requireAuth, taskController.list);
router.get('/assignees', requireAuth, taskController.assignees);
router.get('/:id',       requireAuth, taskController.get);
router.post('/',         requirePermission('task:create'), taskController.create);
router.put('/:id',       requireAuth, taskController.update);
router.delete('/:id',    requirePermission('task:delete'), taskController.remove);

// Подключаем маршруты комментариев к конкретной задаче
router.use('/:taskId/comments', commentRoutes);

module.exports = router;
