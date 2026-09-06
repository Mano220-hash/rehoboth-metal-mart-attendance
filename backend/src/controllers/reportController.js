const XLSX = require('xlsx');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const PermissionRequest = require('../models/PermissionRequest');
const HalfDayLeave = require('../models/HalfDayLeave');
const { calculateEmployeeSalary } = require('./salaryController');

const getTodayDate = () => {
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz });
  } catch (e) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
};

const formatTime12h = (timeStr) => {
  if (!timeStr || timeStr === '-' || timeStr === '—' || timeStr === 'null') return '-';
  if (/am|pm/i.test(timeStr)) return timeStr;
  const parts = String(timeStr).split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
  }
  return timeStr;
};

const getDailyReportRows = async (date, employeeId) => {
  const employeeQuery = { status: 'Active' };
  if (employeeId) employeeQuery.employeeId = employeeId.toUpperCase();
  const employees = await Employee.find(employeeQuery).sort({ employeeId: 1 });
  const attendance = await Attendance.find({ date, employeeId: { $in: employees.map(employee => employee.employeeId) } });
  const approvedPermissions = await PermissionRequest.distinct('employeeId', { date, status: 'Approved' });
  const approvedHalfDays = await HalfDayLeave.distinct('employeeId', { date, status: { $in: ['Pending', 'Approved'] } });
  const permissionIds = new Set(approvedPermissions);
  const halfDayIds = new Set(approvedHalfDays);
  const attendanceByEmployee = new Map(attendance.map(record => [record.employeeId, record]));
  
  const dateParts = date.split('-');
  const yr = parseInt(dateParts[0], 10) || new Date().getFullYear();
  const mo = parseInt(dateParts[1], 10) || (new Date().getMonth() + 1);
  const daysInMonth = new Date(yr, mo, 0).getDate();

  const records = employees.map(employee => {
    const record = attendanceByEmployee.get(employee.employeeId);
    const mSalary = employee.monthlySalary || 0;
    const dSalary = parseFloat((mSalary / daysInMonth).toFixed(2));

    if (record) return { 
      ...record.toObject(), 
      employeeName: employee.name, 
      monthlySalary: mSalary, 
      dailySalary: dSalary,
      status: halfDayIds.has(employee.employeeId) ? 'Half Day' : record.status 
    };

    if (halfDayIds.has(employee.employeeId)) return {
      _id: `halfday-${date}-${employee.employeeId}`,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      monthlySalary: mSalary,
      dailySalary: dSalary,
      date,
      checkIn: null,
      checkOut: null,
      workingHours: 0,
      status: 'Half Day',
    };
    if (permissionIds.has(employee.employeeId)) return {
      _id: `permission-${date}-${employee.employeeId}`,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      monthlySalary: mSalary,
      dailySalary: dSalary,
      date,
      checkIn: null,
      checkOut: null,
      workingHours: 0,
      status: 'Permission',
    };
    return {
      _id: `absent-${date}-${employee.employeeId}`,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      monthlySalary: mSalary,
      dailySalary: dSalary,
      date,
      checkIn: null,
      checkOut: null,
      workingHours: 0,
      status: 'Absent',
    };
  });

  return {
    records,
    summary: {
      total: records.length,
      present: records.filter(record => record.status === 'Present').length,
      halfDay: records.filter(record => record.status === 'Half Day').length,
      absent: records.filter(record => record.status === 'Absent').length,
    },
  };
};

const getMonthlyReportRows = async (month, year, employeeId) => {
  const employeeQuery = { status: 'Active' };
  if (employeeId) employeeQuery.employeeId = employeeId.toUpperCase();
  const employees = await Employee.find(employeeQuery).sort({ employeeId: 1 });
  const monthString = String(month).padStart(2, '0');
  const startDate = `${year}-${monthString}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  const isCurrentMonth = Number(year) === now.getFullYear() && Number(month) === now.getMonth() + 1;
  const datesShown = isCurrentMonth ? now.getDate() : daysInMonth;
  const endDate = `${year}-${monthString}-${String(datesShown).padStart(2, '0')}`;
  const attendance = await Attendance.find({ employeeId: { $in: employees.map(employee => employee.employeeId) }, date: { $gte: startDate, $lte: endDate } });
  const permissions = await PermissionRequest.find({ date: { $gte: startDate, $lte: endDate }, status: 'Approved' }).select('employeeId date');
  const halfDays = await HalfDayLeave.find({ date: { $gte: startDate, $lte: endDate }, status: { $in: ['Pending', 'Approved'] } }).select('employeeId date');
  const attendanceByDateEmployee = new Map(attendance.map(record => [`${record.date}:${record.employeeId}`, record]));
  const permissionKeys = new Set(permissions.map(permission => `${permission.date}:${permission.employeeId}`));
  const halfDayKeys = new Set(halfDays.map(halfDay => `${halfDay.date}:${halfDay.employeeId}`));
  const records = [];
  for (let day = 1; day <= datesShown; day += 1) {
    const date = `${year}-${monthString}-${String(day).padStart(2, '0')}`;
    employees.forEach(employee => {
      const key = `${date}:${employee.employeeId}`;
      const record = attendanceByDateEmployee.get(key);
      const mSalary = employee.monthlySalary || 0;
      const dSalary = parseFloat((mSalary / daysInMonth).toFixed(2));

      if (record) {
        records.push({ 
          ...record.toObject(), 
          employeeName: employee.name, 
          monthlySalary: mSalary,
          dailySalary: dSalary,
          status: halfDayKeys.has(key) ? 'Half Day' : record.status 
        });
      } else {
        records.push({
          _id: `${halfDayKeys.has(key) ? 'halfday' : permissionKeys.has(key) ? 'permission' : 'absent'}-${date}-${employee.employeeId}`,
          employeeId: employee.employeeId,
          employeeName: employee.name,
          monthlySalary: mSalary,
          dailySalary: dSalary,
          date,
          checkIn: null,
          checkOut: null,
          workingHours: 0,
          status: halfDayKeys.has(key) ? 'Half Day' : permissionKeys.has(key) ? 'Permission' : 'Absent',
        });
      }
    });
  }
  return { 
    records, 
    summary: { 
      total: records.length, 
      present: records.filter(record => record.status === 'Present').length,
      halfDay: records.filter(record => record.status === 'Half Day').length,
      absent: records.filter(record => record.status === 'Absent').length, 
      datesShown 
    } 
  };
};

const exportReport = async (req, res, next) => {
  try {
    const { type, startDate, endDate, employeeId, month, year } = req.query;
    const today = getTodayDate();
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();

    let query = {};
    if (type === 'daily') {
      query.date = startDate || today;
    } else if (type === 'monthly') {
      const monthStr = String(m).padStart(2, '0');
      query.date = { $gte: `${y}-${monthStr}-01`, $lte: `${y}-${monthStr}-31` };
    } else if (type === 'employee' && employeeId) {
      query.employeeId = employeeId.toUpperCase();
      if (startDate) query.date = { $gte: startDate };
      if (endDate) query.date = { ...query.date, $lte: endDate };
    } else {
      if (startDate) query.date = { $gte: startDate };
      if (endDate) query.date = { ...query.date, $lte: endDate };
    }

    const dailyRows = type === 'daily' ? await getDailyReportRows(query.date, employeeId) : null;
    const monthlyRows = type === 'monthly' ? await getMonthlyReportRows(m, y, employeeId) : null;
    const records = dailyRows ? dailyRows.records : monthlyRows ? monthlyRows.records : await Attendance.find(query).sort({ date: 1, employeeId: 1 });
    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'No records found for selected period' });
    }

    const empIds = [...new Set(records.map((r) => r.employeeId))];
    const employees = await Employee.find({ employeeId: { $in: empIds } });
    const empMap = {};
    employees.forEach((e) => (empMap[e.employeeId] = e));

    const salaryMap = {};
    for (const emp of employees) {
      const sal = await calculateEmployeeSalary(emp, m, y);
      salaryMap[emp.employeeId] = sal;
    }

    const daysInMonth = new Date(y, m, 0).getDate();

    const data = records.map((r) => {
      const emp = empMap[r.employeeId];
      const sal = salaryMap[r.employeeId] || {};
      const mSalary = emp?.monthlySalary || r.monthlySalary || 0;
      const dSalary = r.dailySalary !== undefined ? r.dailySalary : (sal.dailySalary || parseFloat((mSalary / daysInMonth).toFixed(2)));
      return {
        'Employee ID': r.employeeId,
        'Employee Name': emp?.name || r.employeeName || 'Unknown',
        Date: r.date,
        'Check-In': formatTime12h(r.firstCheckIn || r.checkIn),
        'Lunch Out': formatTime12h(r.lunchOut || r.afternoonCheckOut),
        'Lunch In': formatTime12h(r.lunchIn || r.afternoonCheckIn),
        'Check-Out': formatTime12h(r.finalCheckOut || r.checkOut),
        'Total Working Hours': r.workingHours ? `${r.workingHours} hrs` : '0 hrs',
        'Attendance Status': r.status,
        'Present Days': sal.presentDays ?? '-',
        'Absent Days': sal.absentDays ?? '-',
        'Monthly Salary Amount': `₹${mSalary}`,
        'Daily Salary Amount': `₹${dSalary}`,
        'Final Salary': `₹${sal.finalSalary ?? 0}`,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance & Salary Report');

    ws['!cols'] = Object.keys(data[0]).map((k) => ({
      wch: Math.min(Math.max(k.length, 12), 30),
    }));

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Disposition', `attachment; filename="attendance_salary_${type || 'report'}_${today}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const exportSalaryReport = async (req, res, next) => {
  try {
    const { month, year, employeeId } = req.query;
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();

    const query = { status: 'Active' };
    if (employeeId) query.employeeId = employeeId.toUpperCase();

    const employees = await Employee.find(query).sort({ employeeId: 1 });
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'No employees found for salary report' });
    }

    const salaryList = await Promise.all(
      employees.map((emp) => calculateEmployeeSalary(emp, m, y))
    );

    const data = salaryList.map((s) => ({
      'Employee ID': s.employeeId,
      'Employee Name': s.name,
      Month: `${s.month}/${s.year}`,
      'Total Days In Month': s.totalDaysInMonth,
      'Present Days': s.presentDays,
      'Absent Days': s.absentDays,
      'Attendance %': `${s.attendancePercentage}%`,
      'Monthly Salary': `₹${s.monthlySalary}`,
      'Daily Salary': `₹${s.dailySalary}`,
      'Final Calculated Salary': `₹${s.finalSalary}`,
      'Salary Status': s.salaryStatus,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Salary Report');

    ws['!cols'] = Object.keys(data[0]).map((k) => ({
      wch: Math.min(Math.max(k.length, 14), 30),
    }));

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Disposition', `attachment; filename="salary_report_${m}_${y}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const getReport = async (req, res, next) => {
  try {
    const { type, startDate, endDate, employeeId, month, year, page = 1, limit = 100 } = req.query;
    const today = getTodayDate();
    let query = {};
    if (type === 'daily') {
      query.date = startDate || today;
    } else if (type === 'monthly') {
      const y = year || new Date().getFullYear();
      const m = String(month || new Date().getMonth() + 1).padStart(2, '0');
      query.date = { $gte: `${y}-${m}-01`, $lte: `${y}-${m}-31` };
    } else if (type === 'employee' && employeeId) {
      query.employeeId = employeeId.toUpperCase();
      if (startDate) query.date = { $gte: startDate };
      if (endDate) query.date = { ...query.date, $lte: endDate };
    } else {
      if (startDate) query.date = { $gte: startDate };
      if (endDate) query.date = { ...query.date, $lte: endDate };
    }

    if (type === 'daily') {
      const dailyRows = await getDailyReportRows(query.date, employeeId);
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const recordsFormatted = dailyRows.records.slice(skip, skip + parseInt(limit)).map(r => ({
        ...r,
        firstCheckIn: formatTime12h(r.firstCheckIn || r.checkIn),
        afternoonCheckOut: formatTime12h(r.lunchOut || r.afternoonCheckOut),
        afternoonCheckIn: formatTime12h(r.lunchIn || r.afternoonCheckIn),
        finalCheckOut: formatTime12h(r.finalCheckOut || r.checkOut),
        checkIn: formatTime12h(r.firstCheckIn || r.checkIn),
        lunchOut: formatTime12h(r.lunchOut || r.afternoonCheckOut),
        lunchIn: formatTime12h(r.lunchIn || r.afternoonCheckIn),
        checkOut: formatTime12h(r.finalCheckOut || r.checkOut),
      }));
      return res.json({
        success: true,
        total: dailyRows.records.length,
        summary: dailyRows.summary,
        records: recordsFormatted,
      });
    }

    if (type === 'monthly') {
      const monthlyRows = await getMonthlyReportRows(parseInt(month) || new Date().getMonth() + 1, parseInt(year) || new Date().getFullYear(), employeeId);
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const recordsFormatted = monthlyRows.records.slice(skip, skip + parseInt(limit)).map(r => ({
        ...r,
        firstCheckIn: formatTime12h(r.firstCheckIn || r.checkIn),
        afternoonCheckOut: formatTime12h(r.lunchOut || r.afternoonCheckOut),
        afternoonCheckIn: formatTime12h(r.lunchIn || r.afternoonCheckIn),
        finalCheckOut: formatTime12h(r.finalCheckOut || r.checkOut),
        checkIn: formatTime12h(r.firstCheckIn || r.checkIn),
        lunchOut: formatTime12h(r.lunchOut || r.afternoonCheckOut),
        lunchIn: formatTime12h(r.lunchIn || r.afternoonCheckIn),
        checkOut: formatTime12h(r.finalCheckOut || r.checkOut),
      }));
      return res.json({
        success: true,
        total: monthlyRows.records.length,
        summary: monthlyRows.summary,
        records: recordsFormatted,
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit));

    const empIds = [...new Set(records.map((r) => r.employeeId))];
    const employees = await Employee.find({ employeeId: { $in: empIds } });
    const empMap = {};
    employees.forEach((e) => (empMap[e.employeeId] = e));

    const enriched = records.map((r) => {
      const emp = empMap[r.employeeId];
      const mSalary = emp?.monthlySalary || 0;
      const dParts = (r.date || '').split('-');
      const yr = parseInt(dParts[0], 10) || new Date().getFullYear();
      const mo = parseInt(dParts[1], 10) || (new Date().getMonth() + 1);
      const daysInMonth = new Date(yr, mo, 0).getDate();
      const dSalary = parseFloat((mSalary / daysInMonth).toFixed(2));
      return {
        ...r.toObject(),
        employeeName: emp?.name || 'Unknown',
        monthlySalary: mSalary,
        dailySalary: dSalary,
        firstCheckIn: formatTime12h(r.firstCheckIn || r.checkIn),
        afternoonCheckOut: formatTime12h(r.lunchOut || r.afternoonCheckOut),
        afternoonCheckIn: formatTime12h(r.lunchIn || r.afternoonCheckIn),
        finalCheckOut: formatTime12h(r.finalCheckOut || r.checkOut),
        checkIn: formatTime12h(r.firstCheckIn || r.checkIn),
        lunchOut: formatTime12h(r.lunchOut || r.afternoonCheckOut),
        lunchIn: formatTime12h(r.lunchIn || r.afternoonCheckIn),
        checkOut: formatTime12h(r.finalCheckOut || r.checkOut),
      };
    });

    res.json({ success: true, total, summary: null, records: enriched });
  } catch (error) {
    next(error);
  }
};

module.exports = { exportReport, exportSalaryReport, getReport };
