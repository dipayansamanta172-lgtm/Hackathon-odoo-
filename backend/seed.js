const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function addColumnIfNotExists(connection, dbName, tableName, columnName, columnDefinition) {
  const [columns] = await connection.query(
    `SELECT * FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
     [dbName, tableName, columnName]
  );
  if (columns.length === 0) {
    console.log(`Migration: Adding column ${columnName} to table ${tableName}...`);
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
  }
}

async function runSeed() {
  const dbName = process.env.DB_NAME || 'hrms_db';

  // Validate environment variables first
  const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
  const missing = requiredEnv.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', `SEED ERROR: Missing required environment variables: ${missing.join(', ')}`);
    console.error('\x1b[33m%s\x1b[0m', 'Please configure these inside backend/.env before running the database seeder.');
    process.exit(1);
  }

  console.log('Connecting to MySQL host...');
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
    });
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', `CONNECTION FAILED: Could not connect to MySQL server at ${process.env.DB_HOST}:${process.env.DB_PORT}.`);
    console.error('\x1b[33m%s\x1b[0m', `Error Details: ${err.message}`);
    console.error('\x1b[33m%s\x1b[0m', 'Please ensure your database credentials in backend/.env are populated and correct.');
    process.exit(1);
  }

  try {
    console.log(`Creating database ${dbName} if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    console.log('Reading schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Split queries by semicolon
    const queries = schemaSql
      .split(/;\s*$/m)
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`Executing ${queries.length} schema creation queries...`);
    for (const query of queries) {
      if (query.startsWith('--')) continue;
      await connection.query(query);
    }
    console.log('Schema tables created/verified successfully.');

    // DB Migrations for existing tables (if any)
    console.log('Checking for database migrations...');
    
    // Company Table Payroll Budget Migration
    await addColumnIfNotExists(connection, dbName, 'company', 'payroll_budget', 'DECIMAL(15,2) DEFAULT 0.00');

    // Employees & Departments company_id Migrations
    await addColumnIfNotExists(connection, dbName, 'employees', 'company_id', 'INT NULL');
    await addColumnIfNotExists(connection, dbName, 'departments', 'company_id', 'INT NULL');

    // Employees Table Bank Details Migrations
    await addColumnIfNotExists(connection, dbName, 'employees', 'bank_name', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, dbName, 'employees', 'account_holder_name', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, dbName, 'employees', 'account_number', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, dbName, 'employees', 'ifsc_code', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, dbName, 'employees', 'upi_id', 'VARCHAR(255) NULL');

    // Security Clearances Migrations
    await addColumnIfNotExists(connection, dbName, 'employees', 'security_clearance', "VARCHAR(255) DEFAULT 'Level 1 (Standard Employee)'");
    await addColumnIfNotExists(connection, dbName, 'employees', 'role_clearance', "VARCHAR(255) DEFAULT 'Employee'");
    await addColumnIfNotExists(connection, dbName, 'employees', 'department_access', "VARCHAR(255) DEFAULT 'Own Department Only'");
    await addColumnIfNotExists(connection, dbName, 'employees', 'payroll_permission', "VARCHAR(255) DEFAULT 'View Only'");
    await addColumnIfNotExists(connection, dbName, 'employees', 'recruitment_permission', "VARCHAR(255) DEFAULT 'No Access'");
    await addColumnIfNotExists(connection, dbName, 'employees', 'leave_permission', "VARCHAR(255) DEFAULT 'Apply Only'");
    await addColumnIfNotExists(connection, dbName, 'employees', 'attendance_permission', "VARCHAR(255) DEFAULT 'Check-in/Check-out Only'");
    await addColumnIfNotExists(connection, dbName, 'employees', 'employee_management_permission', "VARCHAR(255) DEFAULT 'No Access'");

    // Salary Components & Payroll Allowances/Deductions Migrations
    const newSalColumns = [
      { name: 'standard_allowance', def: 'DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'leave_travel_allowance', def: 'DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'fixed_allowance', def: 'DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'income_tax', def: 'DECIMAL(10,2) DEFAULT 0.00' }
    ];

    for (const col of newSalColumns) {
      await addColumnIfNotExists(connection, dbName, 'salary_components', col.name, col.def);
      await addColumnIfNotExists(connection, dbName, 'payroll', col.name, col.def);
    }
    console.log('Database migrations completed.');

    // Seed default company
    const [companies] = await connection.query('SELECT * FROM company LIMIT 1');
    let companyId = 1;
    if (companies.length === 0) {
      console.log('Seeding company data...');
      const [compRes] = await connection.query(
        'INSERT INTO company (name, address, phone, email, website, logo_url) VALUES (?, ?, ?, ?, ?, ?)',
        [
          'Nexus HR Global',
          '100 Broadway Suite 24, New York, NY 10005',
          '+1 (212) 555-0199',
          'contact@nexushr.com',
          'www.nexushr.com',
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=128&h=128&q=80'
        ]
      );
      companyId = compRes.insertId;
    } else {
      companyId = companies[0].id;
    }

    // Seed default admin user
    const adminEmail = 'admin@company.com';
    const [users] = await connection.query('SELECT * FROM users WHERE email = ? LIMIT 1', [adminEmail]);
    let adminUserId = null;
    if (users.length === 0) {
      console.log('Seeding default Admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [adminEmail, hashedPassword, 'admin']
      );
      adminUserId = userResult.insertId;
    } else {
      adminUserId = users[0].id;
    }

    // Seed default admin employee profile
    const [employees] = await connection.query('SELECT * FROM employees WHERE user_id = ? LIMIT 1', [adminUserId]);
    let adminEmpId = null;
    if (employees.length === 0) {
      console.log('Seeding Admin employee profile...');
      const [empResult] = await connection.query(
        `INSERT INTO employees 
        (employee_code, user_id, name, role, status, personal_email, phone, location, join_date, bank_name, account_holder_name, account_number, ifsc_code, upi_id, security_clearance, role_clearance, department_access, payroll_permission, recruitment_permission, leave_permission, attendance_permission, employee_management_permission, company_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'EMP-001',
          adminUserId,
          'System Admin',
          'HR Manager',
          'Active',
          'admin@company.com',
          '+1 (555) 010-0001',
          'New York Office',
          '2024-01-01',
          'Chase Bank',
          'System Admin',
          '1234567890',
          'CHASUS33NY',
          'admin@upi',
          'Level 3 (Full Administration)',
          'HR Administrator',
          'All Departments',
          'Read & Write',
          'Full Access',
          'Read & Write',
          'Read & Write',
          'Full Access',
          companyId
        ]
      );
      adminEmpId = empResult.insertId;
    } else {
      adminEmpId = employees[0].id;
      // Make sure existing admin has admin permissions and company_id set in database
      await connection.query(
        `UPDATE employees SET 
          security_clearance = 'Level 3 (Full Administration)',
          role_clearance = 'HR Administrator',
          department_access = 'All Departments',
          payroll_permission = 'Read & Write',
          recruitment_permission = 'Full Access',
          leave_permission = 'Read & Write',
          attendance_permission = 'Read & Write',
          employee_management_permission = 'Full Access',
          company_id = ?
        WHERE id = ?`,
        [companyId, adminEmpId]
      );
    }

    // Seed Admin employee salary components (idempotent check)
    const [salaryRecords] = await connection.query('SELECT * FROM salary_components WHERE employee_id = ? LIMIT 1', [adminEmpId]);
    if (salaryRecords.length === 0) {
      console.log('Seeding Admin salary components...');
      await connection.query(
        `INSERT INTO salary_components 
        (employee_id, basic_salary, hra, travel_allowance, medical_allowance, 
         performance_bonus, other_allowances, standard_allowance, leave_travel_allowance,
         fixed_allowance, provident_fund, professional_tax, income_tax, 
         other_deductions, gross_salary, net_salary) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          adminEmpId,
          5000.00,  // basic_salary
          2000.00,  // hra
          500.00,   // travel_allowance
          300.00,   // medical_allowance
          1200.00,  // performance_bonus
          0.00,     // other_allowances
          500.00,   // standard_allowance
          500.00,   // leave_travel_allowance
          0.00,     // fixed_allowance
          600.00,   // provident_fund
          200.00,   // professional_tax
          400.00,   // income_tax
          0.00,     // other_deductions
          10000.00, // gross: basic+hra+travel+medical+performance+standard+LTA
          8800.00   // net: gross - PF - tax - income_tax
        ]
      );
    }

    // Seed departments
    const defaultDepts = [
      { name: 'ENGINEERING', code: 'ENG' },
      { name: 'PRODUCT', code: 'PRD' },
      { name: 'HUMAN RESOURCES', code: 'HR' },
      { name: 'FINANCE', code: 'FIN' },
      { name: 'SALES', code: 'SLS' },
      { name: 'MARKETING', code: 'MKT' },
    ];
    for (const d of defaultDepts) {
      const [existing] = await connection.query('SELECT * FROM departments WHERE name = ? LIMIT 1', [d.name]);
      if (existing.length === 0) {
        console.log(`Seeding department: ${d.name}...`);
        await connection.query(
          'INSERT INTO departments (name, department_code, created_by, company_id) VALUES (?, ?, ?, ?)',
          [d.name, d.code, adminUserId, companyId]
        );
      } else {
        await connection.query('UPDATE departments SET company_id = ? WHERE id = ?', [companyId, existing[0].id]);
      }
    }

    // Seed leave types
    const defaultLeaveTypes = ['Vacation', 'Sick Leave', 'Personal', 'Casual Leave'];
    for (const name of defaultLeaveTypes) {
      const [existing] = await connection.query('SELECT * FROM leave_types WHERE name = ? LIMIT 1', [name]);
      if (existing.length === 0) {
        console.log(`Seeding leave type: ${name}...`);
        await connection.query('INSERT INTO leave_types (name) VALUES (?)', [name]);
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Error during database initialization/seeding:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSeed();
