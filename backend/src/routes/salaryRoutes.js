const express = require('express');
const router = express.Router();
const { getSalaryList, getEmployeeSalary, updateSalary } = require('../controllers/salaryController');
const { protect } = require('../middleware/auth');

// Public route for employee portal
router.get('/employee/:employeeId', getEmployeeSalary);

// Admin protected routes
router.get('/', protect, getSalaryList);
router.put('/:employeeId', protect, updateSalary);

module.exports = router;
