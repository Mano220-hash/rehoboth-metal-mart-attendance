const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// Helper to get total days in a month
const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

// Calculate salary for an employee for a specific month and year
const calculateEmployeeSalary = async (employee, month, year) => {
  const m = parseInt(month) || (new Date().getMonth() + 1);
  const y = parseInt(year) || new Date().getFullYear();
  const totalDaysInMonth = getDaysInMonth(m, y);

  const monthStr = String(m).padStart(2, '0');
  const startDate = `${y}-${monthStr}-01`;
  const endDate = `${y}-${monthStr}-${String(totalDaysInMonth).padStart(2, '0')}`;

  // Find attendance records for this month
  const attendanceRecords = await Attendance.find({
    employeeId: employee.employeeId,
    date: { $gte: startDate, $lte: endDate },
  });

  let fullPresentDays = 0;
  let halfDays = 0;

  attendanceRecords.forEach((r) => {
    if (r.status === 'Present') fullPresentDays += 1;
    else if (r.status === 'Half Day') halfDays += 1;
  });

  const presentDays = fullPresentDays + halfDays * 0.5;
  const absentDays = Math.max(0, parseFloat((totalDaysInMonth - presentDays).toFixed(2)));
  const attendancePercentage = parseFloat(((presentDays / totalDaysInMonth) * 100).toFixed(2));

  const monthlySalary = employee.monthlySalary || 0;
  const dailySalary = totalDaysInMonth > 0 ? monthlySalary / totalDaysInMonth : 0;
  const finalSalary = parseFloat((dailySalary * presentDays).toFixed(2));

  return {
    employeeId: employee.employeeId,
    name: employee.name,
    monthlySalary,
    salaryType: employee.salaryType || 'Monthly',
    salaryStatus: employee.salaryStatus || 'Active',
    month: m,
    year: y,
    totalDaysInMonth,
    presentDays,
    absentDays,
    attendancePercentage,
    dailySalary: parseFloat(dailySalary.toFixed(2)),
    finalSalary,
  };
};

// @desc  Get salary list & summary for admin
// @route GET /api/salary
const getSalaryList = async (req, res, next) => {
  try {
    const { month, year, search, employeeId } = req.query;
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();

    const query = { status: 'Active' };
    if (employeeId) {
      query.employeeId = employeeId.toUpperCase();
    } else if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(query).sort({ employeeId: 1 });
    const empIds = employees.map((e) => e.employeeId);

    const totalDaysInMonth = getDaysInMonth(m, y);
    const monthStr = String(m).padStart(2, '0');
    const startDate = `${y}-${monthStr}-01`;
    const endDate = `${y}-${monthStr}-${String(totalDaysInMonth).padStart(2, '0')}`;

    const allAttendance = await Attendance.find({
      employeeId: { $in: empIds },
      date: { $gte: startDate, $lte: endDate },
    }).select('employeeId status');

    const attendanceByEmp = new Map();
    allAttendance.forEach((r) => {
      if (!attendanceByEmp.has(r.employeeId)) attendanceByEmp.set(r.employeeId, []);
      attendanceByEmp.get(r.employeeId).push(r);
    });

    const salaryDetails = employees.map((employee) => {
      const attendanceRecords = attendanceByEmp.get(employee.employeeId) || [];
      let fullPresentDays = 0;
      let halfDays = 0;

      attendanceRecords.forEach((r) => {
        if (r.status === 'Present') fullPresentDays += 1;
        else if (r.status === 'Half Day') halfDays += 1;
      });

      const presentDays = fullPresentDays + halfDays * 0.5;
      const absentDays = Math.max(0, parseFloat((totalDaysInMonth - presentDays).toFixed(2)));
      const attendancePercentage = parseFloat(((presentDays / totalDaysInMonth) * 100).toFixed(2));

      const monthlySalary = employee.monthlySalary || 0;
      const dailySalary = totalDaysInMonth > 0 ? monthlySalary / totalDaysInMonth : 0;
      const finalSalary = parseFloat((dailySalary * presentDays).toFixed(2));

      return {
        employeeId: employee.employeeId,
        name: employee.name,
        monthlySalary,
        salaryType: employee.salaryType || 'Monthly',
        salaryStatus: employee.salaryStatus || 'Active',
        month: m,
        year: y,
        totalDaysInMonth,
        presentDays,
        absentDays,
        attendancePercentage,
        dailySalary: parseFloat(dailySalary.toFixed(2)),
        finalSalary,
      };
    });

    const totalMonthlySalary = salaryDetails.reduce((acc, curr) => acc + curr.monthlySalary, 0);
    const totalFinalPayroll = salaryDetails.reduce((acc, curr) => acc + curr.finalSalary, 0);
    const avgAttendance = salaryDetails.length > 0
      ? parseFloat((salaryDetails.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / salaryDetails.length).toFixed(2))
      : 0;

    res.json({
      success: true,
      month: m,
      year: y,
      summary: {
        totalEmployees: salaryDetails.length,
        totalMonthlySalary,
        totalFinalPayroll: parseFloat(totalFinalPayroll.toFixed(2)),
        avgAttendance,
      },
      salaryList: salaryDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single employee salary details (for Employee Portal)
// @route GET /api/salary/employee/:employeeId
const getEmployeeSalary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const employee = await Employee.findOne({
      employeeId: req.params.employeeId.toUpperCase(),
      status: 'Active',
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found or inactive' });
    }

    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();

    const salaryData = await calculateEmployeeSalary(employee, m, y);
    res.json({ success: true, salary: salaryData });
  } catch (error) {
    next(error);
  }
};

// @desc  Update employee monthly salary & salary status (Admin)
// @route PUT /api/salary/:employeeId
const updateSalary = async (req, res, next) => {
  try {
    const { monthlySalary, salaryType, salaryStatus } = req.body;
    const employee = await Employee.findOne({
      employeeId: req.params.employeeId.toUpperCase(),
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (monthlySalary !== undefined) employee.monthlySalary = Number(monthlySalary);
    if (salaryType !== undefined) employee.salaryType = salaryType;
    if (salaryStatus !== undefined) employee.salaryStatus = salaryStatus;

    await employee.save();

    res.json({
      success: true,
      message: 'Salary setup updated successfully',
      employee: {
        employeeId: employee.employeeId,
        name: employee.name,
        monthlySalary: employee.monthlySalary,
        salaryType: employee.salaryType,
        salaryStatus: employee.salaryStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSalaryList, getEmployeeSalary, updateSalary, calculateEmployeeSalary };
