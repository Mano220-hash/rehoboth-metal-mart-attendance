const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, uppercase: true },
  date: { type: String, required: true },
  checkIn: { type: String, default: null },
  checkOut: { type: String, default: null },
  lunchIn: { type: String, default: null },
  lunchOut: { type: String, default: null },
  firstCheckIn: { type: String, default: null },
  afternoonCheckOut: { type: String, default: null },
  afternoonCheckIn: { type: String, default: null },
  finalCheckOut: { type: String, default: null },
  checkInTimestamp: { type: Date, default: null },
  checkOutTimestamp: { type: Date, default: null },
  lunchInTimestamp: { type: Date, default: null },
  lunchOutTimestamp: { type: Date, default: null },
  firstCheckInTimestamp: { type: Date, default: null },
  afternoonCheckOutTimestamp: { type: Date, default: null },
  afternoonCheckInTimestamp: { type: Date, default: null },
  finalCheckOutTimestamp: { type: Date, default: null },
  session1Hours: { type: Number, default: 0 },
  session2Hours: { type: Number, default: 0 },
  workingHours: { type: Number, default: 0 },
  status: { type: String, enum: ['Present', 'Absent', 'Half Day', 'Permission'], default: 'Present' },
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
