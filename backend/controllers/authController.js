const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');

const authController = {
  login: async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required fields.' });
    }

    try {
      // Find user
      const [users] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid email credentials or user does not exist.' });
      }

      const user = users[0];

      // Validate password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Incorrect password verification.' });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('CRITICAL ERROR: JWT_SECRET is not configured in environment.');
        return res.status(500).json({ message: 'Internal server token signing configuration error.' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // Record Session
      const device = req.headers['user-agent'] || 'Unknown Device';
      const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
      
      await db.query(
        'INSERT INTO user_sessions (user_id, jwt_token, device, ip_address) VALUES (?, ?, ?, ?)',
        [user.id, token, device, ip]
      );

      // Log Audit Entry
      await logAction(user.id, 'User Login', 'users', user.id);

      return res.status(200).json({
        success: true,
        message: 'Successfully authenticated.',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server database error. Please try again.' });
    }
  },

  register: async (req, res) => {
    const { companyName, name, email, phone, password, role } = req.body;

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ message: 'Company Name, Name, Email, and Password are required fields.' });
    }

    const userRole = role === 'admin' ? 'admin' : 'employee';

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Check if email already registered
      const [existing] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (existing.length > 0) {
        await conn.rollback();
        return res.status(400).json({ message: 'An account with this email address already exists.' });
      }

      // 1. Create User
      const hashedPassword = await bcrypt.hash(password, 10);
      const [userResult] = await conn.query(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, userRole]
      );
      const newUserId = userResult.insertId;

      // 2. Find or Create Company record
      let companyId;
      const [existingComp] = await conn.query('SELECT id FROM company WHERE name = ? LIMIT 1', [companyName]);
      if (existingComp.length > 0) {
        companyId = existingComp[0].id;
      } else {
        const [companyResult] = await conn.query(
          'INSERT INTO company (name, phone, email) VALUES (?, ?, ?)',
          [companyName, phone || null, email]
        );
        companyId = companyResult.insertId;
      }

      // 3. Generate sequential employee code
      const [lastEmployee] = await conn.query('SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1');
      let nextNumber = 1;
      if (lastEmployee.length > 0) {
        const lastCode = lastEmployee[0].employee_code;
        const match = lastCode.match(/EMP-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const employeeCode = `EMP-${String(nextNumber).padStart(3, '0')}`;

      // 4. Create Employee Profile record with default clearances and company_id
      const isEmployer = (userRole === 'admin');
      const empDesignation = isEmployer ? 'HR Manager' : 'Employee';
      const securityClearance = isEmployer ? 'Level 3 (Full Administration)' : 'Level 1 (Standard Employee)';
      const roleClearance = isEmployer ? 'HR Administrator' : 'Employee';
      const departmentAccess = isEmployer ? 'All Departments' : 'Own Department Only';
      const payrollPermission = isEmployer ? 'Read & Write' : 'View Only';
      const recruitmentPermission = isEmployer ? 'Full Access' : 'No Access';
      const leavePermission = isEmployer ? 'Read & Write' : 'Apply Only';
      const attendancePermission = isEmployer ? 'Read & Write' : 'Check-in/Check-out Only';
      const employeeManagementPermission = isEmployer ? 'Full Access' : 'No Access';

      const [empResult] = await conn.query(
        `INSERT INTO employees 
        (employee_code, user_id, name, role, status, personal_email, phone, join_date,
         security_clearance, role_clearance, department_access, payroll_permission,
         recruitment_permission, leave_permission, attendance_permission, employee_management_permission, company_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeCode, 
          newUserId, 
          name, 
          empDesignation, 
          'Active', 
          email, 
          phone || null,
          securityClearance,
          roleClearance,
          departmentAccess,
          payrollPermission,
          recruitmentPermission,
          leavePermission,
          attendancePermission,
          employeeManagementPermission,
          companyId
        ]
      );
      const newEmpId = empResult.insertId;

      // 5. Initialize Salary Components for the Employee
      await conn.query(
        `INSERT INTO salary_components 
        (employee_id, basic_salary, hra, travel_allowance, medical_allowance, 
         performance_bonus, other_allowances, provident_fund, professional_tax, 
         other_deductions, gross_salary, net_salary) 
        VALUES (?, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00)`,
        [newEmpId]
      );

      await conn.commit();

      // Audit Log
      await logAction(newUserId, 'User Registration', 'users', newUserId);

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Profile initialized.',
        user: {
          id: newUserId,
          email,
          role: userRole
        }
      });
    } catch (err) {
      await conn.rollback();
      console.error('Registration error:', err);
      return res.status(500).json({ message: 'Failed to complete registration.' });
    } finally {
      conn.release();
    }
  },

  logout: async (req, res) => {
    try {
      const userId = req.user.id;
      const token = req.user.token;

      // Update Session Logout time
      await db.query(
        'UPDATE user_sessions SET logout_time = CURRENT_TIMESTAMP WHERE user_id = ? AND jwt_token = ?',
        [userId, token]
      );

      // Log Audit Entry
      await logAction(userId, 'User Logout', 'users', userId);

      return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Server error during session logout.' });
    }
  },

  me: async (req, res) => {
    try {
      return res.status(200).json({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        employee: req.user.employee,
      });
    } catch (err) {
      console.error('Auth check error:', err);
      return res.status(500).json({ message: 'Authentication verification error.' });
    }
  },
};

module.exports = authController;
