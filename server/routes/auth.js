const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/send-code', authController.sendVerificationCode);
router.post('/login-code', authController.loginWithCode);
router.post('/login-password', authController.loginWithPassword);
router.get('/verify', authController.verifyToken);

module.exports = router;
