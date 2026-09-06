const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('../backend/src/config/db');
const seedAdmin = require('../backend/src/utils/seedAdmin');
const errorHandler = require('../backend/src/middleware/errorHandler');
const { apiLimiter } = require('../backend/src/middleware/rateLimiter');

const authRoutes = require('../backend/src/routes/authRoutes');
const employeeRoutes = require('../backend/src/routes/employeeRoutes');
const attendanceRoutes = require('../backend/src/routes/attendanceRoutes');
const permissionRoutes = require('../backend/src/routes/permissionRoutes');
const halfDayRoutes = require('../backend/src/routes/halfDayRoutes');
const leaveRoutes = require('../backend/src/routes/leaveRoutes');
const salaryRoutes = require('../backend/src/routes/salaryRoutes');
const reportRoutes = require('../backend/src/routes/reportRoutes');
const settingsRoutes = require('../backend/src/routes/settingsRoutes');
const cleanupRoutes = require('../backend/src/routes/cleanupRoutes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

let isInit = false;
app.use(async (req, res, next) => {
  if (!isInit) {
    try {
      await connectDB();
      await seedAdmin();
      isInit = true;
    } catch (err) {
      console.error('Serverless DB Init Error:', err);
    }
  }
  next();
});

app.use('/api/', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Rehobooth Metal Mart API running on Vercel', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/halfday', halfDayRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cleanup', cleanupRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
app.use(errorHandler);

module.exports = app;
