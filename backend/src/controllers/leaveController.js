const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');

const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

const createLeave = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate, leaveType, reason } = req.body;
    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Employee ID, start date, and end date are required' });
    }
    
    const employee = await Employee.findOne({ employeeId: employeeId.toUpperCase(), status: 'Active' });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found or inactive' });
    }

    const noOfDays = calculateDays(startDate, endDate);
    
    const leave = await LeaveRequest.create({
      employeeId: employee.employeeId,
      employeeName: employee.name,
      startDate,
      endDate,
      noOfDays,
      leaveType,
      reason,
    });

    res.status(201).json({ success: true, message: 'Leave request submitted', leave });
  } catch (error) {
    next(error);
  }
};

const getLeaves = async (req, res, next) => {
  try {
    const { status, employeeId, leaveType } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId.toUpperCase();
    if (leaveType) query.leaveType = leaveType;
    
    const leaves = await LeaveRequest.find(query).sort({ createdAt: -1 });
    res.json({ success: true, total: leaves.length, leaves });
  } catch (error) {
    next(error);
  }
};

const getEmployeeLeaves = async (req, res, next) => {
  try {
    const leaves = await LeaveRequest.find({ employeeId: req.params.employeeId.toUpperCase() })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, leaves });
  } catch (error) {
    next(error);
  }
};

const reviewLeave = async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;
    
    if (!['Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leave.status = status;
    leave.adminRemarks = adminRemarks || '';
    leave.reviewedAt = new Date();
    await leave.save();

    res.json({ success: true, message: `Leave ${status.toLowerCase()} successfully`, leave });
  } catch (error) {
    next(error);
  }
};

const updateLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Can only update pending leaves' });
    }

    const { startDate, endDate, leaveType, reason } = req.body;
    
    if (startDate) leave.startDate = startDate;
    if (endDate) leave.endDate = endDate;
    if (leaveType) leave.leaveType = leaveType;
    if (reason) leave.reason = reason;

    if (startDate || endDate) {
      leave.noOfDays = calculateDays(leave.startDate, leave.endDate);
    }

    await leave.save();
    res.json({ success: true, message: 'Leave updated successfully', leave });
  } catch (error) {
    next(error);
  }
};

const deleteLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Can only delete pending leaves' });
    }

    await LeaveRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Leave request deleted' });
  } catch (error) {
    next(error);
  }
};

const cancelLeave = async (req, res, next) => {
  try {
    const employeeId = String(req.body.employeeId || '').toUpperCase();
    const leave = await LeaveRequest.findOne({ _id: req.params.id, employeeId });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
    if (leave.status !== 'Pending') return res.status(400).json({ success: false, message: 'Only pending leave requests can be cancelled' });
    leave.status = 'Cancelled'; leave.cancelledBy = 'Employee'; leave.cancelledAt = new Date();
    await leave.save();
    res.json({ success: true, message: 'Leave request cancelled', leave });
  } catch (error) { next(error); }
};

const adminCancelLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
    if (leave.status === 'Cancelled') return res.status(400).json({ success: false, message: 'Request is already cancelled' });
    leave.status = 'Cancelled'; leave.cancelledBy = 'Admin'; leave.cancelledAt = new Date();
    await leave.save();
    res.json({ success: true, message: 'Leave cancelled by admin', leave });
  } catch (error) { next(error); }
};

module.exports = { createLeave, getLeaves, getEmployeeLeaves, reviewLeave, updateLeave, deleteLeave, cancelLeave, adminCancelLeave };
