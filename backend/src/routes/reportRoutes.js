const express = require('express');
const router = express.Router();
const { exportReport, exportSalaryReport, getReport } = require('../controllers/reportController');
const { getPermissionReport, exportPermissionReport } = require('../controllers/permissionReportController');
const { protect } = require('../middleware/auth');

router.get('/export', protect, exportReport);
router.get('/export-salary', protect, exportSalaryReport);
router.get('/permissions', protect, getPermissionReport);
router.get('/permissions/export', protect, exportPermissionReport);
router.get('/', protect, getReport);

module.exports = router;
