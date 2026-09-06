const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 16, max: 100 },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  jobRole: { type: String, trim: true, default: '' },
  joiningDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  monthlySalary: { type: Number, default: 0, min: 0 },
  salaryType: { type: String, enum: ['Monthly'], default: 'Monthly' },
  salaryStatus: { type: String, enum: ['Active', 'Inactive', 'Pending', 'Configured'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
