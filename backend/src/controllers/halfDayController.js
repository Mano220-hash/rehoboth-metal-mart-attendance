const HalfDayLeave = require('../models/HalfDayLeave');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

const createHalfDay = async (req, res, next) => {
  try {
    const { employeeId, date, session, reason } = req.body;
    if (!employeeId || !date || !session || !reason) return res.status(400).json({ success: false, message: 'All fields required' });
    const employee = await Employee.findOne({ employeeId: employeeId.toUpperCase(), status: 'Active' });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found or inactive' });
    
    const halfDay = await HalfDayLeave.create({ employeeId: employee.employeeId, employeeName: employee.name, date, session, reason });

    // Sync status to Attendance model if record exists for this date
    const attendance = await Attendance.findOne({ employeeId: employee.employeeId, date });
    if (attendance) {
      attendance.status = 'Half Day';
      await attendance.save();
    }

    res.status(201).json({ success: true, message: 'Half day request submitted', halfDay });
  } catch (error) { next(error); }
};

const getHalfDays = async (req, res, next) => {
  try {
    const { status, employeeId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId.toUpperCase();
    const halfDays = await HalfDayLeave.find(query).sort({ createdAt: -1 });
    res.json({ success: true, total: halfDays.length, halfDays });
  } catch (error) { next(error); }
};

const getEmployeeHalfDays = async (req, res, next) => {
  try {
    const halfDays = await HalfDayLeave.find({ employeeId: req.params.employeeId.toUpperCase() }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, halfDays });
  } catch (error) { next(error); }
};

const reviewHalfDay = async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected' });
    const halfDay = await HalfDayLeave.findById(req.params.id);
    if (!halfDay) return res.status(404).json({ success: false, message: 'Half day request not found' });
    halfDay.status = status; halfDay.adminRemarks = adminRemarks || ''; halfDay.reviewedAt = new Date();
    await halfDay.save();

    // Sync status to Attendance model
    const attendance = await Attendance.findOne({ employeeId: halfDay.employeeId, date: halfDay.date });
    if (attendance) {
      if (status === 'Approved') {
        attendance.status = 'Half Day';
      } else if (status === 'Rejected') {
        if (attendance.checkIn) {
          attendance.status = 'Present';
        }
      }
      await attendance.save();
    }

    res.json({ success: true, message: `Half day ${status.toLowerCase()} successfully`, halfDay });
  } catch (error) { next(error); }
};

const cancelHalfDay = async (req, res, next) => {
  try {
    const employeeId = String(req.body.employeeId || '').toUpperCase();
    const halfDay = await HalfDayLeave.findOne({ _id: req.params.id, employeeId });
    if (!halfDay) return res.status(404).json({ success: false, message: 'Half day request not found' });
    if (halfDay.status !== 'Pending') return res.status(400).json({ success: false, message: 'Only pending half day requests can be cancelled' });
    halfDay.status = 'Cancelled'; halfDay.cancelledBy = 'Employee'; halfDay.cancelledAt = new Date();
    await halfDay.save();

    const attendance = await Attendance.findOne({ employeeId: halfDay.employeeId, date: halfDay.date });
    if (attendance && attendance.checkIn) {
      attendance.status = 'Present';
      await attendance.save();
    }

    res.json({ success: true, message: 'Half day request cancelled', halfDay });
  } catch (error) { next(error); }
};

const adminCancelHalfDay = async (req, res, next) => {
  try {
    const halfDay = await HalfDayLeave.findById(req.params.id);
    if (!halfDay) return res.status(404).json({ success: false, message: 'Half day request not found' });
    if (halfDay.status === 'Cancelled') return res.status(400).json({ success: false, message: 'Request is already cancelled' });
    halfDay.status = 'Cancelled'; halfDay.cancelledBy = 'Admin'; halfDay.cancelledAt = new Date();
    await halfDay.save();

    const attendance = await Attendance.findOne({ employeeId: halfDay.employeeId, date: halfDay.date });
    if (attendance && attendance.checkIn) {
      attendance.status = 'Present';
      await attendance.save();
    }

    res.json({ success: true, message: 'Half day cancelled by admin', halfDay });
  } catch (error) { next(error); }
};

module.exports = { createHalfDay, getHalfDays, getEmployeeHalfDays, reviewHalfDay, cancelHalfDay, adminCancelHalfDay };
