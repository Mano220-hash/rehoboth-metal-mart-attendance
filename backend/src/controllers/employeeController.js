const Employee = require('../models/Employee');

const getEmployees = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 100 } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { employeeId: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    if (status) query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query).sort({ employeeId: 1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, total, employees });
  } catch (error) { next(error); }
};

const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId.toUpperCase() });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (error) { next(error); }
};

const createEmployee = async (req, res, next) => {
  try {
    const { employeeId, name, age, gender, phone, email, jobRole, joiningDate, status, monthlySalary, salaryType, salaryStatus } = req.body;
    const exists = await Employee.findOne({ employeeId: employeeId?.toUpperCase() });
    if (exists) return res.status(400).json({ success: false, message: 'Employee ID already exists' });
    const employee = await Employee.create({
      employeeId: employeeId?.toUpperCase(),
      name,
      age,
      gender,
      phone,
      email: email || '',
      jobRole,
      joiningDate,
      status: status || 'Active',
      monthlySalary: monthlySalary !== undefined ? Number(monthlySalary) : 0,
      salaryType: salaryType || 'Monthly',
      salaryStatus: salaryStatus || 'Active',
    });
    res.status(201).json({ success: true, message: 'Employee created successfully', employee });
  } catch (error) { next(error); }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId.toUpperCase() });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const { name, age, gender, phone, email, jobRole, joiningDate, status, monthlySalary, salaryType, salaryStatus } = req.body;
    if (name !== undefined) employee.name = name;
    if (age !== undefined) employee.age = age;
    if (gender !== undefined) employee.gender = gender;
    if (phone !== undefined) employee.phone = phone;
    if (email !== undefined) employee.email = email;
    if (jobRole !== undefined) employee.jobRole = jobRole;
    if (joiningDate !== undefined) employee.joiningDate = joiningDate;
    if (status !== undefined) employee.status = status;
    if (monthlySalary !== undefined) employee.monthlySalary = Number(monthlySalary);
    if (salaryType !== undefined) employee.salaryType = salaryType;
    if (salaryStatus !== undefined) employee.salaryStatus = salaryStatus;
    await employee.save();
    res.json({ success: true, message: 'Employee updated successfully', employee });
  } catch (error) { next(error); }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId.toUpperCase() });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    await employee.deleteOne();
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) { next(error); }
};

const validateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId.toUpperCase() });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee ID not found' });
    res.json({ success: true, employee });
  } catch (error) { next(error); }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, validateEmployee };
