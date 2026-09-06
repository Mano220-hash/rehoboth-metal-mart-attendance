const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'rehoboth_metal_mart_super_secret_jwt_key_2026', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });
    
    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();

    // Case-insensitive username search
    const admin = await Admin.findOne({ username: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const isMatch = await admin.comparePassword(cleanPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const token = generateToken(admin._id);
    res.json({
      success: true,
      token,
      admin: { id: admin._id, username: admin.username, name: admin.name, email: admin.email, companyName: admin.companyName }
    });
  } catch (error) { next(error); }
};

const getProfile = async (req, res, next) => {
  try { res.json({ success: true, admin: req.admin }); } catch (error) { next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' });
    if (newPassword.length < 4) return res.status(400).json({ success: false, message: 'New password must be at least 4 characters' });
    const admin = await Admin.findById(req.admin._id);
    if (!(await admin.comparePassword(currentPassword))) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) { next(error); }
};

const changeCredentials = async (req, res, next) => {
  try {
    const { currentPassword, newUsername, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newUsername || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password, new username, and new password are required' });
    }
    const cleanUsername = String(newUsername).trim();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters' });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin || !(await admin.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    // Check if newUsername is already taken by another admin
    if (cleanUsername.toLowerCase() !== admin.username.toLowerCase()) {
      const existing = await Admin.findOne({ username: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      if (existing && existing._id.toString() !== admin._id.toString()) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
    }

    admin.username = cleanUsername;
    admin.password = newPassword;
    await admin.save();

    // Log to AuditLog
    try {
      await AuditLog.create({
        adminName: admin.name || 'Administrator',
        adminUsername: cleanUsername,
        deleteType: 'credential_update',
        targetSummary: `Updated Admin Credentials (Username: ${cleanUsername})`,
        recordsDeleted: 0,
      });
    } catch {}

    res.json({
      success: true,
      message: 'Admin credentials updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const resetDefaultCredentials = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    admin.username = 'Rehoboth';
    admin.password = 'Reho@123';
    await admin.save();

    try {
      await AuditLog.create({
        adminName: admin.name || 'Administrator',
        adminUsername: 'Rehoboth',
        deleteType: 'credential_reset',
        targetSummary: 'Reset Admin Credentials to Default (Rehoboth / Reho@123)',
        recordsDeleted: 0,
      });
    } catch {}

    res.json({
      success: true,
      message: 'Admin credentials reset to default successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, companyName } = req.body;
    const admin = await Admin.findById(req.admin._id);
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (companyName) admin.companyName = companyName;
    await admin.save();
    res.json({ success: true, message: 'Profile updated', admin: { id: admin._id, username: admin.username, name: admin.name, email: admin.email, companyName: admin.companyName } });
  } catch (error) { next(error); }
};

module.exports = {
  loginAdmin,
  getProfile,
  changePassword,
  changeCredentials,
  resetDefaultCredentials,
  updateProfile,
};
