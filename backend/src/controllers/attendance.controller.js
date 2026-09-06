const mongoose = require('mongoose');
const { Attendance, User } = require('../models');

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

function hoursBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`2000-01-01T${checkIn}`);
  const end = new Date(`2000-01-01T${checkOut}`);
  let hours = (end - start) / 3600000;
  if (hours < 0) hours += 24;
  return Number(hours.toFixed(2));
}

function attendanceRate(records) {
  const counted = records.filter(r => r.status !== 'leave');
  if (!counted.length) return 0;
  const good = counted.filter(r => ['present', 'late'].includes(r.status)).length;
  return Math.round((good / counted.length) * 100);
}

exports.checkInOut = async (req, res) => {
  try {
    const { action, notes } = req.body;
    if (!['check-in', 'check-out'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be check-in or check-out' });
    }

    const date = today();
    const time = nowTime();
    let record = await Attendance.findOne({ userId: req.user.id, date });

    if (action === 'check-in') {
      if (record?.checkInTime) {
        return res.status(400).json({ success: false, message: 'You are already checked in today.' });
      }
      record = await Attendance.findOneAndUpdate(
        { userId: req.user.id, date },
        { userId: req.user.id, date, status: 'present', checkInTime: time, markedBy: req.user.id, notes: notes || 'Employee check-in' },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
      return res.status(201).json({ success: true, message: 'Check-in successful', data: record });
    }

    if (!record?.checkInTime) {
      return res.status(400).json({ success: false, message: 'Please check in first.' });
    }
    if (record.checkOutTime) {
      return res.status(400).json({ success: false, message: 'You are already checked out today.' });
    }

    record.checkOutTime = time;
    record.workHours = hoursBetween(record.checkInTime, time);
    record.status = record.workHours < 4 ? 'half_day' : 'present';
    record.markedBy = req.user.id;
    if (notes) record.notes = notes;
    await record.save();

    return res.json({
      success: true,
      message: 'Check-out successful',
      data: record
    });
  } catch (err) {
    console.error('Check-in/out error:', err);
    return res.status(500).json({ success: false, message: 'Attendance update failed', error: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ userId: req.user.id }).sort({ date: -1 });
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const leave = records.filter(r => r.status === 'leave').length;
    const totalWorkHours = Number(records.reduce((sum, r) => sum + Number(r.workHours || 0), 0).toFixed(2));
    const todayRecord = records.find(r => r.date === today()) || null;

    return res.json({
      success: true,
      data: {
        attendance: records,
        todayRecord,
        statistics: {
          totalDays: records.length,
          presentDays: present,
          lateDays: late,
          absentDays: absent,
          leaveDays: leave,
          attendancePercentage: attendanceRate(records),
          totalWorkHours,
          leaveDeductionDays: leave
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: err.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('name email status createdAt').sort({ name: 1 });
    return res.json({ success: true, data: { employees } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch employees', error: err.message });
  }
};

exports.getHrDashboard = async (req, res) => {
  try {
    const date = req.query.date || today();
    const [employees, records] = await Promise.all([
      User.find({ role: 'employee' }).select('name email status'),
      Attendance.find({ date }).populate('userId', 'name email status').sort({ updatedAt: -1 })
    ]);

    const byUser = new Map(records.map(r => [String(r.userId?._id || r.userId), r]));
    const rows = employees.map(employee => {
      const record = byUser.get(String(employee._id));
      return {
        employee: { id: employee._id, name: employee.name, email: employee.email, status: employee.status },
        attendance: record || null,
        status: record?.status || 'absent',
        workHours: record?.workHours || 0
      };
    });

    const summary = {
      totalEmployees: employees.length,
      present: rows.filter(r => r.status === 'present').length,
      late: rows.filter(r => r.status === 'late').length,
      absent: rows.filter(r => r.status === 'absent').length,
      leave: rows.filter(r => r.status === 'leave').length,
      halfDay: rows.filter(r => r.status === 'half_day').length,
      totalWorkHours: Number(rows.reduce((sum, r) => sum + Number(r.workHours || 0), 0).toFixed(2))
    };

    return res.json({ success: true, data: { date, summary, rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch HR dashboard', error: err.message });
  }
};

exports.updateEmployeeAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { date, status, checkInTime, checkOutTime, notes } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid employee id' });
    }
    const employee = await User.findOne({ _id: userId, role: 'employee' });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (!['present', 'absent', 'late', 'leave', 'half_day'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance status' });
    }

    let workHours = 0;
    if (checkInTime && checkOutTime) workHours = hoursBetween(checkInTime, checkOutTime);

    const record = await Attendance.findOneAndUpdate(
      { userId, date: date || today() },
      {
        userId,
        date: date || today(),
        status,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        workHours,
        notes: notes || null,
        markedBy: req.user.id
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    return res.json({ success: true, message: 'Attendance updated', data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update attendance', error: err.message });
  }
};
