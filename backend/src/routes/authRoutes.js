const express = require('express');
const router = express.Router();
const { loginAdmin, getProfile, changePassword, changeCredentials, resetDefaultCredentials, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, loginAdmin);
router.get('/profile', protect, getProfile);
router.put('/change-password', protect, changePassword);
router.put('/credentials', protect, changeCredentials);
router.post('/credentials/reset', protect, resetDefaultCredentials);
router.put('/profile', protect, updateProfile);

module.exports = router;
