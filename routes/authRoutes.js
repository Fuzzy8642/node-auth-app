const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// ВОТ ЭТА СТРОКА БЫЛА ПОТЕРЯНА:
router.get('/me', authController.me); 

module.exports = router;