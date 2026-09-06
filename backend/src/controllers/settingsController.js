const Settings = require('../models/Settings');

const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        companyName: 'REHOBOTH Metal Mart',
        workingHoursPerDay: 8,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      });
    } else {
      let updated = false;
      if (settings.companyName.includes('Rehobooth')) {
        settings.companyName = settings.companyName.replace(/Rehobooth/gi, 'REHOBOTH');
        updated = true;
      }
      if (!settings.workingDays || settings.workingDays.length === 0) {
        settings.workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        updated = true;
      }
      if (updated) await settings.save();
    }
    res.json({ success: true, settings });
  } catch (error) { next(error); }
};

const updateSettings = async (req, res, next) => {
  try {
    const { companyName, workingHoursPerDay, workingDays } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    if (companyName) settings.companyName = companyName;
    if (workingHoursPerDay) settings.workingHoursPerDay = workingHoursPerDay;
    if (workingDays) settings.workingDays = workingDays;
    await settings.save();
    res.json({ success: true, message: 'Settings updated', settings });
  } catch (error) { next(error); }
};

module.exports = { getSettings, updateSettings };
