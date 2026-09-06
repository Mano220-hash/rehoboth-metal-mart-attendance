require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./src/config/db');
const seedAdmin = require('./src/utils/seedAdmin');
const errorHandler = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

const authRoutes = require('./src/routes/authRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const permissionRoutes = require('./src/routes/permissionRoutes');
const halfDayRoutes = require('./src/routes/halfDayRoutes');
const leaveRoutes = require('./src/routes/leaveRoutes');
const salaryRoutes = require('./src/routes/salaryRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const cleanupRoutes = require('./src/routes/cleanupRoutes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Rehobooth Metal Mart API running', timestamp: new Date() });
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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();
    
    const server = app.listen(PORT, () => {
      console.log(`\u2705 MongoDB Connected`);
      console.log(`\u{1F680} Server running on port ${PORT}`);
      console.log(`\u{1F4E1} API Health Check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\u274C Port ${PORT} is already in use`);
      } else {
        console.error(`\u274C Server Error:`, err);
      }
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      server.close(() => { process.exit(0); });
    });
  } catch (error) {
    console.error(`\u274C Failed to start server:`, error.message);
    process.exit(1);
  }
};

startServer();
