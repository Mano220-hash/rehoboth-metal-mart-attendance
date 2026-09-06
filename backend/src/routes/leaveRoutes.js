const express = require('express');
const router = express.Router();
const { createLeave, getLeaves, getEmployeeLeaves, reviewLeave, updateLeave, deleteLeave, cancelLeave, adminCancelLeave } = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');

router.post('/', createLeave);
router.get('/employee/:employeeId', getEmployeeLeaves);
router.put('/:id/cancel', cancelLeave);
router.put('/:id/admin-cancel', protect, adminCancelLeave);
router.get('/', protect, getLeaves);
router.put('/:id/review', protect, reviewLeave);
router.put('/:id', updateLeave);
router.delete('/:id', deleteLeave);

module.exports = router;
