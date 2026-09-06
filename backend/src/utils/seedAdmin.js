const Admin = require('../models/Admin');
const Settings = require('../models/Settings');

const seedAdmin = async () => {
  try {
    let admin = await Admin.findOne({ username: { $regex: /^rehoboth$/i } });
    if (!admin) {
      // Check if old admin username exists and update it
      admin = await Admin.findOne({ username: { $regex: /^rehobooth26$/i } });
    }

    if (!admin) {
      admin = new Admin({
        username: 'Rehoboth',
        password: 'Reho@123',
        name: 'Administrator',
        email: 'admin@rehoboth.com',
        companyName: 'REHOBOTH Metal Mart',
      });
      await admin.save();
      console.log('✅ Default admin created: Rehoboth / Reho@123');
    } else {
      let changed = false;
      if (admin.username !== 'Rehoboth') {
        admin.username = 'Rehoboth';
        changed = true;
      }
      const isPasswordValid = await admin.comparePassword('Reho@123');
      if (!isPasswordValid) {
        admin.password = 'Reho@123';
        changed = true;
      }
      if (changed) {
        await admin.save();
        console.log('✅ Admin credentials set to default: Rehoboth / Reho@123');
      } else {
        console.log('ℹ️  Default admin verified (Rehoboth / Reho@123)');
      }
    }

    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({
        companyName: 'REHOBOTH Metal Mart',
        workingHoursPerDay: 8,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      });
      console.log('✅ Default settings created');
    }
  } catch (error) {
    console.error('❌ Seed error:', error.message);
  }
};

module.exports = seedAdmin;
