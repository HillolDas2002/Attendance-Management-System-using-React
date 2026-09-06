const bcrypt = require('bcrypt');
const { User } = require('../models');

async function seedDatabase() {
  const hrPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('password123', 10);

  await User.create([
    {
      name: 'HR Administrator',
      email: 'hr@attendance.com',
      passwordHash: hrPassword,
      role: 'hr',
      status: 'active'
    },
    {
      name: 'Demo Employee',
      email: 'employee@attendance.com',
      passwordHash: employeePassword,
      role: 'employee',
      status: 'active'
    }
  ]);

  console.log('🎉 Database seeding completed successfully!');
  console.log('HR: hr@attendance.com / admin123');
  console.log('Employee: employee@attendance.com / password123');
}

module.exports = { seedDatabase };
