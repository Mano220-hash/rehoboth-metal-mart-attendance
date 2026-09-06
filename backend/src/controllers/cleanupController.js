const XLSX = require('xlsx');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const PermissionRequest = require('../models/PermissionRequest');
const HalfDayLeave = require('../models/HalfDayLeave');
const LeaveRequest = require('../models/LeaveRequest');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

// Helper to calculate date range based on filter criteria
const resolveDateRange = ({ deleteType, startDate, endDate, month, year }) => {
  const now = new Date();
  const getFormatted = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (deleteType === 'today') {
    const t = getFormatted(now);
    return { start: t, end: t, label: `Today (${t})` };
  }

  if (deleteType === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yStr = getFormatted(y);
    return { start: yStr, end: yStr, label: `Yesterday (${yStr})` };
  }

  if (deleteType === 'this_week') {
    const d = new Date(now);
    const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mon = new Date(d);
    mon.setDate(d.getDate() + distanceToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { start: getFormatted(mon), end: getFormatted(sun), label: `This Week (${getFormatted(mon)} to ${getFormatted(sun)})` };
  }

  if (deleteType === 'this_month') {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start: startStr, end: endStr, label: `This Month (${y}-${String(m).padStart(2, '0')})` };
  }

  if (deleteType === 'by_month') {
    const targetY = parseInt(year, 10) || now.getFullYear();
    const targetM = parseInt(month, 10) || (now.getMonth() + 1);
    const startStr = `${targetY}-${String(targetM).padStart(2, '0')}-01`;
    const lastDay = new Date(targetY, targetM, 0).getDate();
    const endStr = `${targetY}-${String(targetM).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start: startStr, end: endStr, label: `Month ${targetM}/${targetY}` };
  }

  if (deleteType === 'by_week' || deleteType === 'by_date_range') {
    const startStr = startDate || getFormatted(now);
    const endStr = endDate || getFormatted(now);
    return { start: startStr, end: endStr, label: `Date Range (${startStr} to ${endStr})` };
  }

  return null;
};

// Build database queries for affected collections
const buildQueries = (filterCriteria) => {
  const { deleteType, employeeId } = filterCriteria;
  const cleanEmpId = employeeId ? String(employeeId).trim().toUpperCase() : null;

  if (deleteType === 'delete_all') {
    return {
      attendance: {},
      permissions: {},
      halfDays: {},
      leaves: {},
      employees: {},
      targetSummary: 'All System Records',
    };
  }

  if (deleteType === 'by_employee' || deleteType === 'delete_employee_completely') {
    if (!cleanEmpId) throw new Error('Employee ID required for employee deletion');
    return {
      attendance: { employeeId: cleanEmpId },
      permissions: { employeeId: cleanEmpId },
      halfDays: { employeeId: cleanEmpId },
      leaves: { employeeId: cleanEmpId },
      employees: deleteType === 'delete_employee_completely' ? { employeeId: cleanEmpId } : null,
      targetSummary: `Employee ${cleanEmpId}${deleteType === 'delete_employee_completely' ? ' (Permanent Profile + All Data)' : ' (All Activity Data)'}`,
    };
  }

  const range = resolveDateRange(filterCriteria);
  if (!range) throw new Error('Invalid deletion criteria specified');

  const { start, end, label } = range;
  const dateQuery = { $gte: start, $lte: end };

  return {
    attendance: { date: dateQuery },
    permissions: { date: dateQuery },
    halfDays: { date: dateQuery },
    leaves: { $or: [{ startDate: dateQuery }, { endDate: dateQuery }, { date: dateQuery }] },
    employees: null,
    targetSummary: label,
  };
};

// Preview affected records count
const previewCleanup = async (req, res, next) => {
  try {
    const queries = buildQueries(req.body);

    const [attCount, permCount, halfCount, leaveCount, empCount] = await Promise.all([
      Attendance.countDocuments(queries.attendance || {}),
      PermissionRequest.countDocuments(queries.permissions || {}),
      HalfDayLeave.countDocuments(queries.halfDays || {}),
      LeaveRequest.countDocuments(queries.leaves || {}),
      queries.employees ? Employee.countDocuments(queries.employees) : Promise.resolve(0),
    ]);

    const breakdown = {
      attendance: attCount,
      permissions: permCount,
      halfDays: halfCount,
      leaves: leaveCount,
      employees: empCount,
    };

    const totalRecords = Object.values(breakdown).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      targetSummary: queries.targetSummary,
      totalRecords,
      breakdown,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Download Excel Backup before deletion
const exportBackup = async (req, res, next) => {
  try {
    const queries = buildQueries(req.body);

    const [attRecords, permRecords, halfRecords, leaveRecords, empRecords] = await Promise.all([
      Attendance.find(queries.attendance || {}).lean(),
      PermissionRequest.find(queries.permissions || {}).lean(),
      HalfDayLeave.find(queries.halfDays || {}).lean(),
      LeaveRequest.find(queries.leaves || {}).lean(),
      queries.employees ? Employee.find(queries.employees).lean() : Promise.resolve([]),
    ]);

    const wb = XLSX.utils.book_new();

    // Sheet 1: Attendance
    const attData = attRecords.map(r => ({
      'Employee ID': r.employeeId,
      Date: r.date,
      'Check In': r.checkIn || r.firstCheckIn || '-',
      'Lunch Out': r.lunchOut || r.afternoonCheckOut || '-',
      'Lunch In': r.lunchIn || r.afternoonCheckIn || '-',
      'Check Out': r.checkOut || r.finalCheckOut || '-',
      'Working Hours': r.workingHours || 0,
      Status: r.status,
    }));
    const wsAtt = XLSX.utils.json_to_sheet(attData.length > 0 ? attData : [{ Note: 'No attendance records' }]);
    XLSX.utils.book_append_sheet(wb, wsAtt, 'Attendance');

    // Sheet 2: Permissions
    const permData = permRecords.map(r => ({
      'Employee ID': r.employeeId,
      Date: r.date,
      'Out Time': r.outTime || '-',
      'Return Time': r.returnTime || '-',
      Duration: r.durationMinutes || 0,
      Reason: r.reason || '',
      Status: r.status,
    }));
    const wsPerm = XLSX.utils.json_to_sheet(permData.length > 0 ? permData : [{ Note: 'No permission records' }]);
    XLSX.utils.book_append_sheet(wb, wsPerm, 'Permissions');

    // Sheet 3: Half Day Leaves
    const halfData = halfRecords.map(r => ({
      'Employee ID': r.employeeId,
      Date: r.date,
      'Half Type': r.halfType || 'First Half',
      Reason: r.reason || '',
      Status: r.status,
    }));
    const wsHalf = XLSX.utils.json_to_sheet(halfData.length > 0 ? halfData : [{ Note: 'No half-day records' }]);
    XLSX.utils.book_append_sheet(wb, wsHalf, 'Half-Day Leaves');

    // Sheet 4: Leave Requests
    const leaveData = leaveRecords.map(r => ({
      'Employee ID': r.employeeId,
      'Leave Type': r.leaveType,
      'Start Date': r.startDate,
      'End Date': r.endDate,
      Reason: r.reason || '',
      Status: r.status,
    }));
    const wsLeave = XLSX.utils.json_to_sheet(leaveData.length > 0 ? leaveData : [{ Note: 'No leave records' }]);
    XLSX.utils.book_append_sheet(wb, wsLeave, 'Leaves');

    // Sheet 5: Employees (if applicable)
    if (empRecords.length > 0) {
      const empData = empRecords.map(r => ({
        'Employee ID': r.employeeId,
        Name: r.name,
        Designation: r.designation || '',
        Department: r.department || '',
        'Monthly Salary': r.monthlySalary || 0,
        Status: r.status,
      }));
      const wsEmp = XLSX.utils.json_to_sheet(empData);
      XLSX.utils.book_append_sheet(wb, wsEmp, 'Employees');
    }

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Disposition', `attachment; filename="backup_before_delete_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Execute Cleanup with Admin Password Verification & Audit Logging
const executeCleanup = async (req, res, next) => {
  try {
    const { adminPassword } = req.body;
    if (!adminPassword) {
      return res.status(400).json({ success: false, message: 'Admin Password is required for confirmation' });
    }

    // Verify current logged in Admin password
    const admin = await Admin.findById(req.admin._id);
    if (!admin || !(await admin.comparePassword(adminPassword))) {
      return res.status(401).json({ success: false, message: 'Incorrect Admin Password. Deletion cancelled.' });
    }

    const queries = buildQueries(req.body);

    const [attRes, permRes, halfRes, leaveRes, empRes] = await Promise.all([
      Attendance.deleteMany(queries.attendance || {}),
      PermissionRequest.deleteMany(queries.permissions || {}),
      HalfDayLeave.deleteMany(queries.halfDays || {}),
      LeaveRequest.deleteMany(queries.leaves || {}),
      queries.employees ? Employee.deleteMany(queries.employees) : Promise.resolve({ deletedCount: 0 }),
    ]);

    const breakdown = {
      attendance: attRes.deletedCount || 0,
      permissions: permRes.deletedCount || 0,
      halfDays: halfRes.deletedCount || 0,
      leaves: leaveRes.deletedCount || 0,
      employees: empRes.deletedCount || 0,
    };

    const totalRecords = Object.values(breakdown).reduce((a, b) => a + b, 0);

    // Record Audit Log entry
    await AuditLog.create({
      adminName: admin.name || 'Administrator',
      adminUsername: admin.username,
      deleteType: req.body.deleteType || 'by_date_range',
      targetSummary: queries.targetSummary,
      recordsDeleted: totalRecords,
      collectionBreakdown: breakdown,
    });

    res.json({
      success: true,
      message: `Successfully deleted ${totalRecords} records!`,
      targetSummary: queries.targetSummary,
      totalRecords,
      breakdown,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch Audit Logs history
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

// Clear Audit Logs history
const clearAuditLogs = async (req, res, next) => {
  try {
    await AuditLog.deleteMany({});
    res.json({ success: true, message: 'Audit history cleared successfully!' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  previewCleanup,
  exportBackup,
  executeCleanup,
  getAuditLogs,
  clearAuditLogs,
};
