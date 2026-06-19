const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/send-code', authController.sendVerificationCode);
router.post('/login-code', authController.loginWithCode);
router.post('/login-password', authController.loginWithPassword);
router.post('/refresh', authController.refreshToken);
router.get('/verify', authMiddleware.authMiddleware, authController.verifyToken);
router.post('/logout', authMiddleware.authMiddleware, authController.logout);

module.exports = router;
