const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { requirePermission } = require('../middleware/roles');

router.get('/', requirePermission('project:read'), projectController.list);
router.get('/:id', requirePermission('project:read'), projectController.get);
router.post('/', requirePermission('project:create'), projectController.create);
router.put('/:id', requirePermission('project:edit'), projectController.update);

module.exports = router;