const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: true,
  },
  adminUsername: {
    type: String,
    required: true,
  },
  deleteType: {
    type: String,
    required: true,
    enum: ['by_employee', 'by_date_range', 'by_week', 'by_month', 'delete_all', 'delete_employee_completely', 'today', 'yesterday', 'this_week', 'this_month', 'credential_update', 'credential_reset'],
  },
  targetSummary: {
    type: String,
    required: true,
  },
  recordsDeleted: {
    type: Number,
    required: true,
    default: 0,
  },
  collectionBreakdown: {
    attendance: { type: Number, default: 0 },
    permissions: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    leaves: { type: Number, default: 0 },
    salaries: { type: Number, default: 0 },
    employees: { type: Number, default: 0 },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
