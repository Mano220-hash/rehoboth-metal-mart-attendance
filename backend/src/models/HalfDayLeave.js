const mongoose = require('mongoose');

const halfDayLeaveSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, uppercase: true },
  employeeName: { type: String, required: true },
  date: { type: String, required: true },
  session: { type: String, enum: ['Morning', 'Afternoon'], required: true },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
  adminRemarks: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  cancelledBy: { type: String, enum: ['Employee', 'Admin'], default: null },
  cancelledAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('HalfDayLeave', halfDayLeaveSchema);
