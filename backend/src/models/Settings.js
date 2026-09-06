const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'REHOBOTH Metal Mart' },
  workingHoursPerDay: { type: Number, default: 8 },
  workingDays: { type: [String], default: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
