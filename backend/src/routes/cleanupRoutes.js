const express = require('express');
const router = express.Router();
const { previewCleanup, exportBackup, executeCleanup, getAuditLogs, clearAuditLogs } = require('../controllers/cleanupController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/preview', previewCleanup);
router.post('/backup-export', exportBackup);
router.post('/execute', executeCleanup);
router.get('/audit-logs', getAuditLogs);
router.delete('/audit-logs', clearAuditLogs);

module.exports = router;
