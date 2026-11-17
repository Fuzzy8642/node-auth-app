const express = require('express');
const router = express.Router({ mergeParams: true }); // Важно для получения :taskId из пути задач
const commentController = require('../controllers/commentController');
const { requirePermission } = require('../middleware/roles');

router.get('/', requirePermission('task:read-own'), commentController.listByTask);
router.post('/', requirePermission('comment:create'), commentController.create);

module.exports = router;