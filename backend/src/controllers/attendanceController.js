const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

const getServerDate = async (req, res, next) => {
  try {
    const tz = process.env.TIMEZONE || 'Asia/Kolkata';
    const now = new Date();
    const today = getTodayDate();
    const [y, m, d] = today.split('-');
    const formattedDate = `${d}-${m}-${y}`;

    let msUntilMidnight = 86400000;
    try {
      const nowTzStr = now.toLocaleString('en-US', { timeZone: tz });
      const nowTz = new Date(nowTzStr);
      const tomorrowTz = new Date(nowTz.getFullYear(), nowTz.getMonth(), nowTz.getDate() + 1, 0, 0, 0, 0);
      msUntilMidnight = Math.max(1000, tomorrowTz.getTime() - nowTz.getTime());
    } catch (e) {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      msUntilMidnight = Math.max(1000, tomorrow.getTime() - now.getTime());
    }

    res.json({
      success: true,
      serverDate: today,
      formattedDate,
      timestamp: now.getTime(),
      msUntilMidnight,
    });
  } catch (error) {
    next(error);
  }
};

const getTodayDate = () => {
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz });
  } catch (e) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

const getTimeString = () => {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

// Automatic data migration for existing attendance records to ensure Lunch Out < Lunch In mapping
const migrateExistingAttendanceRecords = async () => {
  try {
    const records = await Attendance.find({
      $or: [
        { lunchIn: { $ne: null } },
        { lunchOut: { $ne: null } },
        { afternoonCheckIn: { $ne: null } },
        { afternoonCheckOut: { $ne: null } }
      ]
    });

    const getMinutes = (val, ts) => {
      if (ts instanceof Date && !isNaN(ts.getTime())) {
        return ts.getHours() * 60 + ts.getMinutes();
      }
      if (typeof val === 'string' && val.includes(':')) {
        const match = val.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const ampm = match[3] ? match[3].toUpperCase() : '';
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        }
      }
      return null;
    };

    for (const r of records) {
      let changed = false;

      const val1 = r.lunchOut || r.afternoonCheckOut;
      const ts1 = r.lunchOutTimestamp || r.afternoonCheckOutTimestamp;
      const m1 = getMinutes(val1, ts1);

      const val2 = r.lunchIn || r.afternoonCheckIn;
      const ts2 = r.lunchInTimestamp || r.afternoonCheckInTimestamp;
      const m2 = getMinutes(val2, ts2);

      // If lunchOut was saved with a LATER time than lunchIn, swap them
      if (m1 !== null && m2 !== null && m1 > m2) {
        r.lunchOut = val2;
        r.afternoonCheckOut = val2;
        r.lunchOutTimestamp = ts2;
        r.afternoonCheckOutTimestamp = ts2;

        r.lunchIn = val1;
        r.afternoonCheckIn = val1;
        r.lunchInTimestamp = ts1;
        r.afternoonCheckInTimestamp = ts1;
        changed = true;
      }

      // Ensure total working hours exclude lunch break
      const inTs = r.firstCheckInTimestamp || r.checkInTimestamp;
      const outTs = r.finalCheckOutTimestamp || r.checkOutTimestamp;
      const lOutTs = r.lunchOutTimestamp || r.afternoonCheckOutTimestamp;
      const lInTs = r.lunchInTimestamp || r.afternoonCheckInTimestamp;

      if (inTs && lOutTs && lInTs && outTs) {
        const s1 = Math.max(0, (lOutTs - inTs) / (1000 * 60 * 60));
        const s2 = Math.max(0, (outTs - lInTs) / (1000 * 60 * 60));
        r.session1Hours = parseFloat(s1.toFixed(2));
        r.session2Hours = parseFloat(s2.toFixed(2));
        r.workingHours = parseFloat((s1 + s2).toFixed(2));
        if (r.workingHours < 7.5) {
          r.status = 'Half Day';
        } else {
          r.status = 'Present';
        }
        changed = true;
      }

      if (changed) {
        await r.save();
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
};

// Run migration asynchronously
migrateExistingAttendanceRecords();

// Shared helper: single source of truth for daily attendance calculations
const getDailyAttendanceSummary = async (date) => {
  const PermissionRequest = require('../models/PermissionRequest');
  const HalfDayLeave = require('../models/HalfDayLeave');
  const employees = await Employee.find({ status: 'Active' }).select('employeeId name').sort({ employeeId: 1 });
  
  const presentAttendanceIds = await Attendance.distinct('employeeId', { date, status: 'Present' });
  const halfDayAttendanceIds = await Attendance.distinct('employeeId', { date, status: 'Half Day' });
  const permissionEmployeeIds = await PermissionRequest.distinct('employeeId', { date, status: 'Approved' });
  const halfDayLeaveIds = await HalfDayLeave.distinct('employeeId', { date, status: { $in: ['Pending', 'Approved'] } });

  const halfDayIds = new Set([...halfDayAttendanceIds, ...halfDayLeaveIds]);
  const presentIds = new Set([...presentAttendanceIds]);
  const totalPresentOrHalfDay = new Set([...presentIds, ...halfDayIds]);

  return {
    employees,
    total: employees.length,
    present: employees.filter(e => presentIds.has(e.employeeId) && !halfDayIds.has(e.employeeId)).length,
    halfDay: employees.filter(e => halfDayIds.has(e.employeeId)).length,
    absent: employees.filter(e => !totalPresentOrHalfDay.has(e.employeeId)).length,
    presentIds,
    halfDayIds,
    permissionIds: new Set(permissionEmployeeIds),
  };
};

const getRangeAttendanceRows = async (startDate, endDate, employeeId) => {
  const PermissionRequest = require('../models/PermissionRequest');
  const HalfDayLeave = require('../models/HalfDayLeave');
  const employeeQuery = { status: 'Active' };
  if (employeeId) employeeQuery.employeeId = employeeId.toUpperCase();
  const employees = await Employee.find(employeeQuery).select('employeeId name').sort({ employeeId: 1 });
  const employeeIds = employees.map(employee => employee.employeeId);
  const attendance = await Attendance.find({ employeeId: { $in: employeeIds }, date: { $gte: startDate, $lte: endDate } });
  const permissions = await PermissionRequest.find({ employeeId: { $in: employeeIds }, date: { $gte: startDate, $lte: endDate }, status: 'Approved' }).select('employeeId date');
  const halfDays = await HalfDayLeave.find({ employeeId: { $in: employeeIds }, date: { $gte: startDate, $lte: endDate }, status: { $in: ['Pending', 'Approved'] } }).select('employeeId date');
  const attendanceByKey = new Map(attendance.map(record => [`${record.date}:${record.employeeId}`, record]));
  const permissionKeys = new Set(permissions.map(permission => `${permission.date}:${permission.employeeId}`));
  const halfDayKeys = new Set(halfDays.map(halfDay => `${halfDay.date}:${halfDay.employeeId}`));
  const records = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    employees.forEach(employee => {
      const key = `${dateString}:${employee.employeeId}`;
      const record = attendanceByKey.get(key);
      if (record) {
        records.push({ ...record.toObject(), employeeName: employee.name, status: halfDayKeys.has(key) ? 'Half Day' : record.status });
      } else {
        records.push({
          _id: `${halfDayKeys.has(key) ? 'halfday' : permissionKeys.has(key) ? 'permission' : 'absent'}-${key}`,
          employeeId: employee.employeeId,
          employeeName: employee.name,
          date: dateString,
          checkIn: null,
          checkOut: null,
          lunchIn: null,
          lunchOut: null,
          firstCheckIn: null,
          afternoonCheckOut: null,
          afternoonCheckIn: null,
          finalCheckOut: null,
          workingHours: 0,
          status: halfDayKeys.has(key) ? 'Half Day' : permissionKeys.has(key) ? 'Permission' : 'Absent',
        });
      }
    });
  }
  return records;
};

const checkIn = async (req, res, next) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: 'Employee ID required' });
    const employee = await Employee.findOne({ employeeId: employeeId.toUpperCase(), status: 'Active' });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found or inactive' });
    const today = getTodayDate();
    let existing = await Attendance.findOne({ employeeId: employee.employeeId, date: today });

    const HalfDayLeave = require('../models/HalfDayLeave');
    const halfDayReq = await HalfDayLeave.findOne({ employeeId: employee.employeeId, date: today, status: { $in: ['Pending', 'Approved'] } });
    const statusToSet = halfDayReq ? 'Half Day' : 'Present';

    const now = new Date();
    const timeString = getTimeString();

    if (!existing || (!existing.checkIn && !existing.firstCheckIn)) {
      // First Check In of the day (Session 1)
      if (existing) {
        existing.checkIn = timeString;
        existing.firstCheckIn = timeString;
        existing.checkInTimestamp = now;
        existing.firstCheckInTimestamp = now;
        existing.status = statusToSet;
        await existing.save();
      } else {
        existing = await Attendance.create({
          employeeId: employee.employeeId,
          date: today,
          checkIn: timeString,
          firstCheckIn: timeString,
          checkInTimestamp: now,
          firstCheckInTimestamp: now,
          status: statusToSet,
        });
      }
      return res.json({
        success: true,
        message: `Morning Check-in successful at ${timeString}`,
        attendance: existing,
        employee: { name: employee.name, employeeId: employee.employeeId },
      });
    }

    // Existing checkIn present. Check if employee is eligible for Afternoon / Lunch In
    const session1Completed = existing.lunchOut || existing.afternoonCheckOut || existing.checkOut;
    const session2Started = existing.lunchIn || existing.afternoonCheckIn;

    if (session1Completed && !session2Started) {
      // Lunch In / Session 2 Check In
      existing.lunchIn = timeString;
      existing.afternoonCheckIn = timeString;
      existing.lunchInTimestamp = now;
      existing.afternoonCheckInTimestamp = now;
      existing.finalCheckOut = null;
      existing.checkOut = null; // Clear checkOut to indicate session 2 is active
      await existing.save();
      return res.json({
        success: true,
        message: `Lunch In successful at ${timeString}`,
        attendance: existing,
        employee: { name: employee.name, employeeId: employee.employeeId },
      });
    }

    if (!session1Completed) {
      return res.status(400).json({ success: false, message: 'Already checked in. Please record Lunch Out or Check Out first.' });
    }

    if (existing.finalCheckOut || (session2Started && existing.checkOut)) {
      return res.status(400).json({ success: false, message: 'All check-ins and check-outs for today have been completed.' });
    }

    return res.status(400).json({ success: false, message: 'Already checked in today' });
  } catch (error) { next(error); }
};

const checkOut = async (req, res, next) => {
  try {
    const PermissionRequest = require('../models/PermissionRequest');
    const HalfDayLeave = require('../models/HalfDayLeave');
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: 'Employee ID required' });
    const employee = await Employee.findOne({ employeeId: employeeId.toUpperCase(), status: 'Active' });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found or inactive' });
    const today = getTodayDate();
    let attendance = await Attendance.findOne({ employeeId: employee.employeeId, date: today });

    const openPermission = await PermissionRequest.findOne({ employeeId: employee.employeeId, date: today, status: 'Approved', permissionOutTime: { $ne: null }, permissionReturnTime: null });
    if (openPermission) return res.status(400).json({ success: false, message: 'Record Permission In before final check-out' });

    const now = new Date();
    const timeString = getTimeString();

    const halfDayReq = await HalfDayLeave.findOne({ employeeId: employee.employeeId, date: today, status: { $in: ['Pending', 'Approved'] } });
    const statusToSet = halfDayReq ? 'Half Day' : 'Present';

    if (!attendance) {
      attendance = new Attendance({
        employeeId: employee.employeeId,
        date: today,
        checkIn: timeString,
        firstCheckIn: timeString,
        checkInTimestamp: now,
        firstCheckInTimestamp: now,
        status: statusToSet,
      });
    } else if (!attendance.checkIn && !attendance.firstCheckIn) {
      attendance.checkIn = timeString;
      attendance.firstCheckIn = timeString;
      attendance.checkInTimestamp = now;
      attendance.firstCheckInTimestamp = now;
      attendance.status = statusToSet;
    }

    const isSession2Active = (attendance.lunchIn || attendance.afternoonCheckIn) && !attendance.finalCheckOut;
    const isSession1Active = (attendance.firstCheckIn || attendance.checkIn) && !attendance.lunchOut && !attendance.afternoonCheckOut && !attendance.checkOut;

    if (!isSession1Active && !isSession2Active && (attendance.finalCheckOut || attendance.checkOut)) {
      return res.status(400).json({ success: false, message: 'Already checked out today' });
    }

    if (isSession2Active) {
      // Final Check Out after Session 2 (Lunch In -> Check Out)
      attendance.finalCheckOut = timeString;
      attendance.checkOut = timeString;
      attendance.finalCheckOutTimestamp = now;
      attendance.checkOutTimestamp = now;

      const s2Start = attendance.lunchInTimestamp || attendance.afternoonCheckInTimestamp || now;
      const s2Hours = parseFloat(((now - s2Start) / (1000 * 60 * 60)).toFixed(2));
      attendance.session2Hours = s2Hours;

      let s1Hours = attendance.session1Hours || 0;
      const s1End = attendance.lunchOutTimestamp || attendance.afternoonCheckOutTimestamp;
      const s1Start = attendance.firstCheckInTimestamp || attendance.checkInTimestamp;
      if (s1Start && s1End) {
        s1Hours = parseFloat(((s1End - s1Start) / (1000 * 60 * 60)).toFixed(2));
        attendance.session1Hours = s1Hours;
      }

      // Total Working Hours excludes lunch break
      const totalHours = parseFloat((s1Hours + s2Hours).toFixed(2));
      attendance.workingHours = totalHours;

      // 7.5 Hours Rule Engine
      if (totalHours < 7.5 || halfDayReq) {
        attendance.status = 'Half Day';
      } else {
        attendance.status = 'Present';
      }
    } else {
      // Session 1 Check Out (Lunch Out)
      attendance.lunchOut = timeString;
      attendance.afternoonCheckOut = timeString;
      attendance.checkOut = timeString;
      attendance.lunchOutTimestamp = now;
      attendance.afternoonCheckOutTimestamp = now;
      attendance.checkOutTimestamp = now;

      const s1Start = attendance.firstCheckInTimestamp || attendance.checkInTimestamp || now;
      const s1Hours = parseFloat(((now - s1Start) / (1000 * 60 * 60)).toFixed(2));
      attendance.session1Hours = s1Hours;
      attendance.workingHours = s1Hours;

      // 7.5 Hours Rule Engine
      if (s1Hours < 7.5 || halfDayReq) {
        attendance.status = 'Half Day';
      } else {
        attendance.status = 'Present';
      }
    }

    await attendance.save();

    const statusMsg = attendance.status === 'Half Day' ? 'Marked as Half Day.' : 'Marked as Present.';
    const message = `Check-out successful at ${timeString}. Worked: ${attendance.workingHours} hrs (${statusMsg})`;

    res.json({ success: true, message, workingHours: attendance.workingHours, attendance, employee: { name: employee.name, employeeId: employee.employeeId } });
  } catch (error) { next(error); }
};

const recordLunch = async (req, res, next) => {
  try {
    const { employeeId, type } = req.body;
    if (!employeeId || !['in', 'out'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Employee ID and lunch type are required' });
    }
    const employee = await Employee.findOne({ employeeId: employeeId.toUpperCase(), status: 'Active' });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found or inactive' });
    const today = getTodayDate();
    let attendance = await Attendance.findOne({ employeeId: employee.employeeId, date: today });

    const now = new Date();
    const timeString = getTimeString();

    const HalfDayLeave = require('../models/HalfDayLeave');
    const halfDayReq = await HalfDayLeave.findOne({ employeeId: employee.employeeId, date: today, status: { $in: ['Pending', 'Approved'] } });
    const statusToSet = halfDayReq ? 'Half Day' : 'Present';

    // Auto initialize attendance record and morning checkIn if not present so Lunch action never fails
    if (!attendance) {
      attendance = new Attendance({
        employeeId: employee.employeeId,
        date: today,
        checkIn: timeString,
        firstCheckIn: timeString,
        checkInTimestamp: now,
        firstCheckInTimestamp: now,
        status: statusToSet,
      });
    } else if (!attendance.checkIn && !attendance.firstCheckIn) {
      attendance.checkIn = timeString;
      attendance.firstCheckIn = timeString;
      attendance.checkInTimestamp = now;
      attendance.firstCheckInTimestamp = now;
      attendance.status = statusToSet;
    }

    if (type === 'out') {
      // Employee goes OUT for lunch
      if (attendance.lunchOut || attendance.afternoonCheckOut) {
        return res.status(400).json({ success: false, message: 'Lunch Out already recorded today' });
      }
      attendance.lunchOut = timeString;
      attendance.afternoonCheckOut = timeString;
      attendance.lunchOutTimestamp = now;
      attendance.afternoonCheckOutTimestamp = now;

      const s1Start = attendance.firstCheckInTimestamp || attendance.checkInTimestamp || now;
      const s1Hours = parseFloat(((now - s1Start) / (1000 * 60 * 60)).toFixed(2));
      attendance.session1Hours = s1Hours;
      attendance.workingHours = s1Hours;
      await attendance.save();

      return res.json({ success: true, message: `Lunch Out recorded at ${timeString}`, attendance, employee: { name: employee.name, employeeId: employee.employeeId } });
    } else {
      // Employee returns IN from lunch
      if (!attendance.lunchOut && !attendance.afternoonCheckOut) {
        // Auto set lunchOut if Lunch Out was not manually clicked
        attendance.lunchOut = timeString;
        attendance.afternoonCheckOut = timeString;
        attendance.lunchOutTimestamp = now;
        attendance.afternoonCheckOutTimestamp = now;
      }
      if (attendance.lunchIn || attendance.afternoonCheckIn) {
        return res.status(400).json({ success: false, message: 'Lunch In already recorded today' });
      }
      attendance.lunchIn = timeString;
      attendance.afternoonCheckIn = timeString;
      attendance.lunchInTimestamp = now;
      attendance.afternoonCheckInTimestamp = now;
      await attendance.save();

      return res.json({ success: true, message: `Lunch In recorded at ${timeString}`, attendance, employee: { name: employee.name, employeeId: employee.employeeId } });
    }
  } catch (error) { next(error); }
};

const getTodayStatus = async (req, res, next) => {
  try {
    const today = getTodayDate();
    const attendance = await Attendance.findOne({ employeeId: req.params.employeeId.toUpperCase(), date: today });
    res.json({ success: true, attendance: attendance || null });
  } catch (error) { next(error); }
};

const getAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, startDate, endDate, status, page = 1, limit = 100 } = req.query;
    await migrateExistingAttendanceRecords();

    if (startDate && endDate) {
      const records = await getRangeAttendanceRows(startDate, endDate, employeeId);
      const filteredRecords = status ? records.filter(record => record.status === status) : records;
      const summary = {
        total: filteredRecords.length,
        present: filteredRecords.filter(r => r.status === 'Present').length,
        halfDay: filteredRecords.filter(r => r.status === 'Half Day').length,
        absent: filteredRecords.filter(r => r.status === 'Absent').length,
      };
      return res.json({ success: true, total: filteredRecords.length, summary, records: filteredRecords });
    }

    if (date) {
      const dailySummary = await getDailyAttendanceSummary(date);
      const attendance = await Attendance.find({ date });
      const attendanceMap = new Map(attendance.map(record => [record.employeeId, record]));
      const employeesFiltered = employeeId ? dailySummary.employees.filter(employee => employee.employeeId === employeeId.toUpperCase()) : dailySummary.employees;
      let records = employeesFiltered.map(employee => {
        const record = attendanceMap.get(employee.employeeId);
        if (record) return { ...record.toObject(), employeeName: employee.name, status: dailySummary.halfDayIds.has(employee.employeeId) ? 'Half Day' : record.status };
        if (dailySummary.halfDayIds.has(employee.employeeId)) return {
          _id: `halfday-${date}-${employee.employeeId}`, employeeId: employee.employeeId, employeeName: employee.name, date, checkIn: null, checkOut: null, lunchIn: null, lunchOut: null, workingHours: 0, status: 'Half Day',
        };
        if (dailySummary.permissionIds.has(employee.employeeId)) return {
          _id: `permission-${date}-${employee.employeeId}`, employeeId: employee.employeeId, employeeName: employee.name, date, checkIn: null, checkOut: null, lunchIn: null, lunchOut: null, workingHours: 0, status: 'Permission',
        };
        return {
          _id: `absent-${date}-${employee.employeeId}`, employeeId: employee.employeeId, employeeName: employee.name, date, checkIn: null, checkOut: null, lunchIn: null, lunchOut: null, workingHours: 0, status: 'Absent',
        };
      });

      if (status) records = records.filter(record => record.status === status);

      return res.json({
        success: true,
        total: records.length,
        summary: { total: records.length, present: records.filter(record => record.status === 'Present').length, halfDay: records.filter(record => record.status === 'Half Day').length, absent: records.filter(record => record.status === 'Absent').length },
        records,
      });
    }

    const query = {};
    if (employeeId) query.employeeId = employeeId.toUpperCase();
    if (status) query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit));
    const empIds = [...new Set(records.map(r => r.employeeId))];
    const employees = await Employee.find({ employeeId: { $in: empIds } });
    const empMap = {};
    employees.forEach(e => empMap[e.employeeId] = e);
    const enriched = records.map(r => ({ ...r.toObject(), employeeName: empMap[r.employeeId]?.name || 'Unknown' }));

    res.json({ success: true, total, summary: null, records: enriched });
  } catch (error) { next(error); }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const today = getTodayDate();
    const now = new Date();

    const d14Ago = new Date(now);
    d14Ago.setDate(d14Ago.getDate() - 13);
    const startDate = `${d14Ago.getFullYear()}-${String(d14Ago.getMonth() + 1).padStart(2, '0')}-${String(d14Ago.getDate()).padStart(2, '0')}`;

    const PermissionRequest = require('../models/PermissionRequest');
    const HalfDayLeave = require('../models/HalfDayLeave');
    const LeaveRequest = require('../models/LeaveRequest');

    const [
      totalEmployees,
      dailySummary,
      currentlyOnPermission,
      pendingPermissions,
      pendingHalfDay,
      pendingLeave,
      recentActivityRecords,
      all14DaysAttendance,
      all14DaysPermissions,
      all14DaysHalfDays,
      leaveStats,
      activeEmployees
    ] = await Promise.all([
      Employee.countDocuments({ status: 'Active' }),
      getDailyAttendanceSummary(today),
      PermissionRequest.countDocuments({ date: today, status: 'In Progress' }),
      PermissionRequest.countDocuments({ status: 'Pending' }),
      HalfDayLeave.countDocuments({ status: 'Pending' }),
      LeaveRequest.countDocuments({ status: 'Pending' }),
      Attendance.find({ date: today }).sort({ updatedAt: -1 }).limit(5),
      Attendance.find({ date: { $gte: startDate, $lte: today } }).select('employeeId date status'),
      PermissionRequest.find({ date: { $gte: startDate, $lte: today }, status: 'Approved' }).select('employeeId date'),
      HalfDayLeave.find({ date: { $gte: startDate, $lte: today }, status: { $in: ['Pending', 'Approved'] } }).select('employeeId date'),
      LeaveRequest.aggregate([{ $group: { _id: '$leaveType', count: { $sum: 1 } } }]),
      Employee.find({ status: 'Active' }).select('employeeId name')
    ]);

    const empIds = [...new Set(recentActivityRecords.map(r => r.employeeId))];
    const recentEmployees = await Employee.find({ employeeId: { $in: empIds } }).select('employeeId name');
    const empMap = {};
    recentEmployees.forEach(e => empMap[e.employeeId] = e.name);
    const enrichedActivity = recentActivityRecords.map(r => ({ ...r.toObject(), employeeName: empMap[r.employeeId] || 'Unknown' }));

    const attendanceMap = new Map();
    all14DaysAttendance.forEach(a => attendanceMap.set(`${a.date}:${a.employeeId}`, a.status));

    const permissionSet = new Set(all14DaysPermissions.map(p => `${p.date}:${p.employeeId}`));
    const halfDaySet = new Set(all14DaysHalfDays.map(h => `${h.date}:${h.employeeId}`));

    const monthlyData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      let present = 0;
      let halfDay = 0;
      let absent = 0;

      activeEmployees.forEach(e => {
        const key = `${dateStr}:${e.employeeId}`;
        const attStatus = attendanceMap.get(key);

        if (halfDaySet.has(key) || attStatus === 'Half Day') {
          halfDay++;
        } else if (attStatus === 'Present') {
          present++;
        } else {
          absent++;
        }
      });

      monthlyData.push({ _id: dateStr, present, halfDay, absent });
    }

    res.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday: dailySummary.present,
        halfDayToday: dailySummary.halfDay,
        absentToday: dailySummary.absent,
        currentlyOnPermission,
        pendingPermissions,
        pendingHalfDay,
        pendingLeave,
      },
      monthlyData,
      recentActivity: enrichedActivity,
      leaveStats,
    });
  } catch (error) { next(error); }
};

const getPercentage = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const employees = await Employee.find({ status: 'Active' });
    let dateQuery = {};
    if (startDate && endDate) dateQuery = { $gte: startDate, $lte: endDate };

    const data = await Promise.all(employees.map(async (emp) => {
      const query = { employeeId: emp.employeeId };
      if (startDate && endDate) query.date = dateQuery;
      const attendance = await Attendance.find(query);
      
      let fullPresent = 0;
      let halfDays = 0;
      attendance.forEach(r => {
        if (r.status === 'Present') fullPresent += 1;
        else if (r.status === 'Half Day') halfDays += 1;
      });

      const totalDays = attendance.length || 1;
      const presentDays = fullPresent + (halfDays * 0.5);
      const percentage = parseFloat(((presentDays / totalDays) * 100).toFixed(2));

      return {
        employeeId: emp.employeeId,
        name: emp.name,
        presentDays,
        totalWorkingDays: totalDays,
        percentage,
      };
    }));

    res.json({ success: true, data });
  } catch (error) { next(error); }
};

module.exports = {
  getServerDate,
  checkIn,
  checkOut,
  recordLunch,
  getTodayStatus,
  getAttendance,
  getDashboardStats,
  getPercentage,
  getAttendancePercentage: getPercentage,
};
