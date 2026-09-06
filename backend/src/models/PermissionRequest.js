const mongoose = require('mongoose');

const permissionRequestSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, uppercase: true },
  employeeName: { type: String, required: true },
  date: { type: String, required: true },
  fromTime: { type: String, required: true },
  toTime: { type: String, required: true },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Cancelled'], default: 'Pending' },
  adminRemarks: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  permissionOutTime: { type: String, default: null },
  permissionOutTimestamp: { type: Date, default: null },
  permissionReturnTime: { type: String, default: null },
  permissionReturnTimestamp: { type: Date, default: null },
  totalPermissionMinutes: { type: Number, default: 0 },
  cancelledBy: { type: String, enum: ['Employee', 'Admin'], default: null },
  cancelledAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('PermissionRequest', permissionRequestSchema);
