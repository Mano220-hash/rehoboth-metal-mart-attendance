const PermissionRequest = require('../models/PermissionRequest');
const Employee = require('../models/Employee');

const getTodayDate = () => {
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz });
  } catch (e) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
};
const getTimeString = () => {
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return new Date().toTimeString().split(' ')[0];
  }
};
const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).split(':').map(Number);
  return hours * 60 + minutes;
};
const durationLabel = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const formatTime12h = (timeStr) => {
  if (!timeStr || timeStr === '—' || timeStr === '-' || timeStr === 'null' || timeStr === 'undefined') return '—';
  if (/am|pm/i.test(timeStr)) return timeStr;
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';
  if (timeStr.includes('T') || timeStr.includes('Z')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }
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

const createPermission = async (req, res, next) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId || !String(employeeId).trim()) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const employee = await Employee.findOne({ employeeId: String(employeeId).trim().toUpperCase(), status: 'Active' });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found or inactive' });
    }

    let items = [];
    if (Array.isArray(req.body.permissions) && req.body.permissions.length > 0) {
      items = req.body.permissions;
    } else {
      items = [req.body];
    }

    const createdPermissions = [];
    for (const item of items) {
      const date = (item.date && String(item.date).trim()) || getTodayDate();
      const fromTime = (item.fromTime || item.from_time || item.from) ? String(item.fromTime || item.from_time || item.from).trim() : '';
      const toTime = (item.toTime || item.to_time || item.to) ? String(item.toTime || item.to_time || item.to).trim() : '';
      const reason = (item.reason && String(item.reason).trim()) ? String(item.reason).trim() : 'Permission Request';

      if (!fromTime || !toTime) {
        return res.status(400).json({ success: false, message: 'From time and To time are required for permission' });
      }

      if (timeToMinutes(toTime) <= timeToMinutes(fromTime)) {
        return res.status(400).json({ success: false, message: `To time (${toTime}) must be after From time (${fromTime})` });
      }

      const permission = await PermissionRequest.create({
        employeeId: employee.employeeId,
        employeeName: employee.name,
        date,
        fromTime,
        toTime,
        reason,
      });
      createdPermissions.push(permission);
    }

    res.status(201).json({
      success: true,
      message: createdPermissions.length === 1 
        ? 'Permission request submitted successfully' 
        : `${createdPermissions.length} permission requests submitted successfully`,
      permissions: createdPermissions,
      permission: createdPermissions[0],
    });
  } catch (error) { next(error); }
};

const getPermissions = async (req, res, next) => {
  try {
    const { status, employeeId, date, startDate, endDate, search, active, page = 1, limit = 100 } = req.query;
    const query = {};
    if (status === 'In Progress' || active === 'true') {
      query.$or = [
        { status: 'In Progress' },
        { status: 'Approved', permissionOutTime: { $ne: null }, permissionReturnTime: null }
      ];
    } else if (status) {
      query.status = status;
    }

    if (employeeId) query.employeeId = employeeId.toUpperCase();
    if (date) query.date = date;
    else if (startDate || endDate) query.date = { ...(startDate ? { $gte: startDate } : {}), ...(endDate ? { $lte: endDate } : {}) };
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchCond = [{ employeeId: searchRegex }, { employeeName: searchRegex }, { reason: searchRegex }];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCond }];
        delete query.$or;
      } else {
        query.$or = searchCond;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await PermissionRequest.countDocuments(query);
    const permissions = await PermissionRequest.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit));

    const today = getTodayDate();
    const currentlyInProgress = await PermissionRequest.countDocuments({
      date: today,
      $or: [
        { status: 'In Progress' },
        { status: 'Approved', permissionOutTime: { $ne: null }, permissionReturnTime: null }
      ]
    });

    res.json({ success: true, total, currentlyInProgress, permissions });
  } catch (error) { next(error); }
};

const getEmployeePermissions = async (req, res, next) => {
  try {
    const permissions = await PermissionRequest.find({ employeeId: req.params.employeeId.toUpperCase() }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, permissions });
  } catch (error) { next(error); }
};

const reviewPermission = async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected' });
    const permission = await PermissionRequest.findById(req.params.id);
    if (!permission) return res.status(404).json({ success: false, message: 'Permission request not found' });
    permission.status = status; permission.adminRemarks = adminRemarks || ''; permission.reviewedAt = new Date();
    await permission.save();
    res.json({ success: true, message: `Permission ${status.toLowerCase()} successfully`, permission });
  } catch (error) { next(error); }
};

const recordPermissionOut = async (req, res, next) => {
  try {
    const employeeId = String(req.body.employeeId || '').toUpperCase();
    const today = getTodayDate();

    // 1. Check if employee is ALREADY out on permission right now:
    const activeOut = await PermissionRequest.findOne({
      employeeId,
      date: today,
      $or: [
        { status: 'In Progress' },
        { permissionOutTime: { $ne: null }, permissionReturnTime: null }
      ]
    });

    if (activeOut) {
      const formattedOutTime = formatTime12h(activeOut.permissionOutTime);
      return res.status(400).json({
        success: false,
        message: `Permission out already recorded at ${formattedOutTime}. Please record Permission In when you return.`
      });
    }

    // 2. Find next approved permission for today that has not been used yet:
    const permission = await PermissionRequest.findOne({
      employeeId,
      date: today,
      status: 'Approved',
      permissionOutTime: null
    }).sort({ fromTime: 1 });

    if (!permission) {
      // Check if employee has completed permissions today or pending ones
      const completedCount = await PermissionRequest.countDocuments({ employeeId, date: today, status: 'Completed' });
      if (completedCount > 0) {
        return res.status(400).json({ success: false, message: 'All approved permissions for today have already been used & completed' });
      }
      const pendingCount = await PermissionRequest.countDocuments({ employeeId, date: today, status: 'Pending' });
      if (pendingCount > 0) {
        return res.status(400).json({ success: false, message: 'Your permission request is still Pending admin approval' });
      }
      return res.status(404).json({ success: false, message: 'No approved permission found for today' });
    }

    const now = new Date();
    permission.permissionOutTime = getTimeString();
    permission.permissionOutTimestamp = now;
    permission.status = 'In Progress';
    await permission.save();

    res.json({
      success: true,
      message: `Permission out recorded successfully at ${formatTime12h(permission.permissionOutTime)}`,
      permission
    });
  } catch (error) { next(error); }
};

const recordPermissionReturn = async (req, res, next) => {
  try {
    const employeeId = String(req.body.employeeId || '').toUpperCase();
    const permissionId = req.body.permissionId || req.body.id;
    const today = getTodayDate();

    let permission = null;

    if (permissionId) {
      permission = await PermissionRequest.findById(permissionId);
      if (!permission) {
        console.error(`[PermissionIn Error] Permission record not found for ID: ${permissionId}`);
        return res.status(404).json({ success: false, message: 'Permission record not found.' });
      }
    } else {
      permission = (await PermissionRequest.findOne({ employeeId, date: today, status: 'In Progress' }).sort({ permissionOutTimestamp: -1 })) ||
                       (await PermissionRequest.findOne({ employeeId, date: today, status: 'Approved', permissionOutTime: { $ne: null }, permissionReturnTime: null }).sort({ permissionOutTimestamp: -1 }));
    }

    if (!permission) {
      const anyPermToday = await PermissionRequest.findOne({ employeeId, date: today }).sort({ createdAt: -1 });

      if (!anyPermToday) {
        console.error(`[PermissionIn Error] No approved permission found for ${employeeId} on ${today}`);
        return res.status(404).json({ success: false, message: 'No approved permission found.' });
      }

      if (anyPermToday.status === 'Pending') {
        console.error(`[PermissionIn Error] Permission for ${employeeId} is still pending approval`);
        return res.status(400).json({ success: false, message: 'No approved permission found.' });
      }

      if (anyPermToday.status === 'Completed' || (anyPermToday.permissionOutTime && anyPermToday.permissionReturnTime)) {
        console.error(`[PermissionIn Error] Permission for ${employeeId} is already completed`);
        return res.status(400).json({ success: false, message: 'Permission already completed.' });
      }

      if (!anyPermToday.permissionOutTime) {
        console.error(`[PermissionIn Error] Permission Out not recorded yet for ${employeeId}`);
        return res.status(400).json({ success: false, message: 'Please complete Permission Out first.' });
      }

      console.error(`[PermissionIn Error] No active permission found for ${employeeId}`);
      return res.status(404).json({ success: false, message: 'No approved permission found.' });
    }

    // Check specific conditions on the found permission:
    if (permission.status === 'Completed' || permission.permissionReturnTime) {
      console.error(`[PermissionIn Error] Permission ID ${permission._id} is already completed`);
      return res.status(400).json({ success: false, message: 'Permission already completed.' });
    }

    if (!permission.permissionOutTime) {
      console.error(`[PermissionIn Error] Permission Out has not been recorded for ID ${permission._id}`);
      return res.status(400).json({ success: false, message: 'Please complete Permission Out first.' });
    }

    const now = new Date();
    permission.permissionReturnTime = getTimeString();
    permission.permissionReturnTimestamp = now;
    permission.totalPermissionMinutes = Math.max(0, Math.round((now - (permission.permissionOutTimestamp || now)) / 60000));
    permission.status = 'Completed';
    await permission.save();

    console.log(`[PermissionIn Success] Employee ${permission.employeeId} permission ${permission._id} marked Completed at ${permission.permissionReturnTime}`);

    res.json({
      success: true,
      message: 'Permission completed successfully.',
      permission
    });
  } catch (error) {
    console.error('[PermissionIn Exception]', error);
    next(error);
  }
};

const getPermissionStats = async (req, res, next) => {
  try {
    const date = req.query.date || getTodayDate();
    const [total, pending, approved, inProgress, completed, currentlyOnPermission] = await Promise.all([
      PermissionRequest.countDocuments({ date }),
      PermissionRequest.countDocuments({ date, status: 'Pending' }),
      PermissionRequest.countDocuments({ date, status: 'Approved' }),
      PermissionRequest.countDocuments({ date, status: 'In Progress' }),
      PermissionRequest.countDocuments({ date, status: 'Completed' }),
      PermissionRequest.countDocuments({ date, status: 'In Progress' }),
    ]);
    res.json({ success: true, stats: { total, pending, approved, inProgress, completed, currentlyOnPermission } });
  } catch (error) { next(error); }
};

const cancelPermission = async (req, res, next) => {
  try {
    const employeeId = String(req.body.employeeId || '').toUpperCase();
    const permission = await PermissionRequest.findOne({ _id: req.params.id, employeeId });
    if (!permission) return res.status(404).json({ success: false, message: 'Permission request not found' });
    if (permission.status !== 'Pending') return res.status(400).json({ success: false, message: 'Only pending permission requests can be cancelled' });
    permission.status = 'Cancelled';
    permission.cancelledBy = 'Employee';
    permission.cancelledAt = new Date();
    await permission.save();
    res.json({ success: true, message: 'Permission request cancelled', permission });
  } catch (error) { next(error); }
};

const adminCancelPermission = async (req, res, next) => {
  try {
    const permission = await PermissionRequest.findById(req.params.id);
    if (!permission) return res.status(404).json({ success: false, message: 'Permission request not found' });
    if (permission.permissionOutTime && !permission.permissionReturnTime) return res.status(400).json({ success: false, message: 'Cannot cancel an active permission' });
    if (permission.status === 'Cancelled') return res.status(400).json({ success: false, message: 'Request is already cancelled' });
    permission.status = 'Cancelled'; permission.cancelledBy = 'Admin'; permission.cancelledAt = new Date();
    await permission.save();
    res.json({ success: true, message: 'Permission cancelled by admin', permission });
  } catch (error) { next(error); }
};

module.exports = { createPermission, getPermissions, getEmployeePermissions, reviewPermission, recordPermissionOut, recordPermissionReturn, getPermissionStats, cancelPermission, adminCancelPermission };
