const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { requirePermission } = require('../middleware/roles');

router.get('/users',            requirePermission('user:manage'), ctrl.listUsers);
router.patch('/users/:id/role', requirePermission('role:change'), ctrl.changeRole);
router.delete('/users/:id',     requirePermission('user:manage'), ctrl.deleteUser);
router.get('/activity',         requirePermission('log:read'),    ctrl.activityLog);

// Вкладка «Корзина» (только для админа с правом user:manage)
router.get('/trash',               requirePermission('user:manage'), ctrl.trash);
router.post('/users/:id/restore',  requirePermission('user:manage'), ctrl.restoreUser);
router.post('/tasks/:id/restore',  requirePermission('user:manage'), ctrl.restoreTask);

module.exports = router;
6