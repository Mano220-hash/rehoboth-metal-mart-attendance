const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, uppercase: true },
  employeeName: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  noOfDays: { type: Number, required: true },
  leaveType: { type: String, enum: ['Casual', 'Sick', 'Earned', 'Unpaid', 'Maternity', 'Paternity'], default: 'Casual' },
  reason: { type: String, default: 'Leave Application', trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
  adminRemarks: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  cancelledBy: { type: String, enum: ['Employee', 'Admin'], default: null },
  cancelledAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
