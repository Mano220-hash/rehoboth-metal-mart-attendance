const express = require('express');
const router = express.Router();
const { getServerDate, checkIn, checkOut, recordLunch, getTodayStatus, getAttendance, getDashboardStats, getAttendancePercentage } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

router.get('/server-date', getServerDate);
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.post('/lunch', recordLunch);
router.get('/today/:employeeId', getTodayStatus);
router.get('/stats/dashboard', protect, getDashboardStats);
router.get('/percentage', protect, getAttendancePercentage);
router.get('/', protect, getAttendance);
module.exports = router;
