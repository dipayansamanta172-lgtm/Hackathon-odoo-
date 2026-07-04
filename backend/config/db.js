const mysql = require('mysql2/promise');
require('dotenv').config();

const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
const missing = requiredEnv.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', `CRITICAL CONFIG ERROR: Missing environment variables: ${missing.join(', ')}`);
  console.error('\x1b[33m%s\x1b[0m', 'Please configure these inside backend/.env before launching the server.');
  process.exit(1);
}

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
});

// Test DB connection immediately on load
pool.getConnection()
  .then((conn) => {
    console.log(`\x1b[32m%s\x1b[0m`, `Successfully connected to MySQL database: ${process.env.DB_NAME}`);
    conn.release();
  })
  .catch((err) => {
    console.error('\x1b[31m%s\x1b[0m', `DATABASE CONNECTION FAILED: Unable to connect to database "${process.env.DB_NAME}".`);
    console.error('\x1b[33m%s\x1b[0m', `Error Details: ${err.message}`);
    console.error('\x1b[33m%s\x1b[0m', `Please ensure MySQL is running and your backend/.env credentials are correct.`);
  });

module.exports = pool;
