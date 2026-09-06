const mongoose = require('mongoose');

const transform = (_, ret) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2, maxlength: 100, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['hr', 'employee'], default: 'employee' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  lastLoginAt: { type: Date, default: null }
}, { timestamps: true, toJSON: { transform }, toObject: { transform } });

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
