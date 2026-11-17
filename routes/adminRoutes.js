const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { requirePermission } = require('../middleware/roles');

router.get('/users',      requirePermission('user:manage'), ctrl.listUsers);
router.patch('/users/:id/role', requirePermission('role:change'), ctrl.changeRole);
router.delete('/users/:id',     requirePermission('user:manage'), ctrl.deleteUser);
router.get('/activity',         requirePermission('log:read'),   ctrl.activityLog);

router.get('/trash', adminController.trash);
router.post('/users/:id/restore', admin);
router.post('/tasks/:id/restore', adminController.restoreTask);
module.exports = router;