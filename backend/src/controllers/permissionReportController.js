const XLSX = require('xlsx');
const PermissionRequest = require('../models/PermissionRequest');

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const addDays = (date, days) => {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().split('T')[0];
};
const buildQuery = (params) => {
  const { type, date, startDate, endDate, month, year, employeeId, status } = params;
  const query = {};
  if (status) query.status = status;
  if (employeeId) query.employeeId = employeeId.toUpperCase();
  if (type === 'daily') query.date = date || today();
  else if (type === 'weekly') {
    const end = date || today();
    query.date = { $gte: addDays(end, -6), $lte: end };
  } else if (type === 'monthly') {
    const selectedYear = parseInt(year) || new Date().getFullYear();
    const selectedMonth = parseInt(month) || new Date().getMonth() + 1;
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const nextMonth = new Date(`${start}T00:00:00`);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    query.date = { $gte: start, $lt: nextMonth.toISOString().split('T')[0] };
  } else {
    if (startDate) query.date = { $gte: startDate };
    if (endDate) query.date = { ...(query.date || {}), $lte: endDate };
  }
  return query;
};
const shape = (permission) => ({
  ...permission.toObject(),
  totalPermissionDuration: permission.totalPermissionMinutes ? `${Math.floor(permission.totalPermissionMinutes / 60)}h ${permission.totalPermissionMinutes % 60}m` : '-',
});

const getPermissionReport = async (req, res, next) => {
  try {
    const query = buildQuery(req.query);
    const permissions = await PermissionRequest.find(query).sort({ date: -1, employeeId: 1 });
    res.json({ success: true, total: permissions.length, permissions: permissions.map(shape) });
  } catch (error) { next(error); }
};

const exportPermissionReport = async (req, res, next) => {
  try {
    const query = buildQuery(req.query);
    const permissions = await PermissionRequest.find(query).sort({ date: 1, employeeId: 1 });
    if (!permissions.length) return res.status(404).json({ success: false, message: 'No permission records found for selected filters' });
    const data = permissions.map((permission) => {
      const record = shape(permission);
      return {
        'Employee ID': record.employeeId,
        'Employee Name': record.employeeName,
        Date: record.date,
        Reason: record.reason,
        'Permission Out Time': record.permissionOutTime || '-',
        'Permission Return Time': record.permissionReturnTime || '-',
        'Total Permission Duration': record.totalPermissionDuration,
        Status: record.status,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = Object.keys(data[0]).map((key) => ({ wch: Math.min(Math.max(key.length, 16), 34) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Permission Report');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Disposition', `attachment; filename="permission_report_${today()}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) { next(error); }
};

module.exports = { getPermissionReport, exportPermissionReport };
