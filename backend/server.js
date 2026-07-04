const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize database pool connection to trigger connection test early
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Setup CORS
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy block: Origin not allowed.'));
    }
  },
  credentials: true
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads directory for development fallbacks
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Route modules
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Mount REST API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HRMS REST Backend API is online and operational.',
    version: '1.0.0'
  });
});

// 404 Fallback Router
app.use((req, res, next) => {
  res.status(404).json({ message: `API Endpoint not found: [${req.method}] ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('\x1b[31m%s\x1b[0m', `[Server Error] ${err.stack || err.message}`);
  
  // Safe generic response. Stack trace is hidden as per security request.
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`\x1b[36m%s\x1b[0m`, `HRMS Server running on port ${PORT}...`);
  console.log(`\x1b[35m%s\x1b[0m`, `REST Root URL: http://localhost:${PORT}`);
});
