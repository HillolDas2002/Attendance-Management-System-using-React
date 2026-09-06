const mongoose = require('mongoose');

const transform = (_, ret) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave', 'half_day'],
    default: 'absent'
  },
  checkInTime: { type: String, default: null },
  checkOutTime: { type: String, default: null },
  workHours: { type: Number, default: 0 },
  notes: { type: String, default: null },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, toJSON: { transform }, toObject: { transform } });

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
