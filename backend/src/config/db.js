const mongoose = require('mongoose');
const { seedDatabase } = require('./seeder');
const { User, Attendance } = require('../models');

async function initDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing in backend/.env');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB Atlas connection established successfully.');

  // Migrate legacy roles from the original project into the two-role system.
  await User.updateMany({ role: 'admin' }, { $set: { role: 'hr' } });
  await User.updateMany({ role: { $in: ['manager', 'teacher', 'member'] } }, { $set: { role: 'employee' } });
  await Attendance.syncIndexes();

  const userCount = await User.countDocuments();
  if (userCount === 0) await seedDatabase();
  else console.log(`ℹ️ Database contains ${userCount} user(s).`);
}

module.exports = { initDatabase };
