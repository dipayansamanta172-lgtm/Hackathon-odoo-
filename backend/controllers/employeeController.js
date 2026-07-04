const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');

const employeeController = {
  // GET /api/employees (Admin & Employee directory, filtered by company)
  getEmployees: async (req, res) => {
    const { search, department } = req.query;
    
    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      let query = `
        SELECT e.*, d.name AS department, u.email 
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.company_id = ?
      `;
      const params = [companyId];

      if (search && search.trim() !== '') {
        query += ' AND (e.name LIKE ? OR e.employee_code LIKE ? OR e.role LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (department && department.trim() !== '') {
        query += ' AND d.name = ?';
        params.push(department);
      }

      query += ' ORDER BY e.id ASC';

      const [rows] = await db.query(query, params);
      return res.status(200).json(rows);
    } catch (err) {
      console.error('getEmployees error:', err);
      return res.status(500).json({ message: 'Failed to fetch employee list.' });
    }
  },

  // GET /api/employees/me (Logged-in employee profile)
  getMyProfile: async (req, res) => {
    try {
      if (!req.user.employee) {
        return res.status(404).json({ message: 'Employee profile not found.' });
      }
      return res.status(200).json(req.user.employee);
    } catch (err) {
      console.error('getMyProfile error:', err);
      return res.status(500).json({ message: 'Failed to fetch personal profile.' });
    }
  },

  // PUT /api/employees/me (Self profile update)
  updateMyProfile: async (req, res) => {
    const {
      personalEmail,
      phone,
      location,
      emergencyContact,
      dob,
      gender,
      maritalStatus,
      nationality,
      photo,
      resumeName,
      resumeDate,
      resumeUrl,
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      upiId
    } = req.body;

    if (!req.user.employee) {
      return res.status(404).json({ message: 'Employee profile not associated with this account.' });
    }

    const employeeId = req.user.employee.id;

    try {
      await db.query(
        `UPDATE employees SET 
          personal_email = ?,
          phone = ?,
          location = ?,
          emergency_contact = ?,
          dob = ?,
          gender = ?,
          marital_status = ?,
          nationality = ?,
          photo = ?,
          resume_name = ?,
          resume_date = ?,
          resume_url = ?,
          bank_name = ?,
          account_holder_name = ?,
          account_number = ?,
          ifsc_code = ?,
          upi_id = ?
        WHERE id = ?`,
        [
          personalEmail || null,
          phone || null,
          location || null,
          emergencyContact || null,
          dob || null,
          gender || null,
          maritalStatus || null,
          nationality || null,
          photo || req.user.employee.photo || null,
          resumeName || req.user.employee.resume_name || null,
          resumeDate || req.user.employee.resume_date || null,
          resumeUrl || req.user.employee.resume_url || null,
          bankName || null,
          accountHolderName || null,
          accountNumber || null,
          ifscCode || null,
          upiId || null,
          employeeId
        ]
      );

      // Audit log
      await logAction(req.user.id, 'Self Profile Updated', 'employees', employeeId);

      return res.status(200).json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
      console.error('updateMyProfile error:', err);
      return res.status(500).json({ message: 'Failed to update personal profile.' });
    }
  },

  // GET /api/employees/me/stats (Own dashboard counts)
  getMyStats: async (req, res) => {
    if (!req.user.employee) {
      return res.status(200).json({ presentDays: 0, leavesTaken: 0, pendingRequests: 0 });
    }
    const empId = req.user.employee.id;

    try {
      // 1. Present days this month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const [present] = await db.query(
        `SELECT COUNT(*) AS count FROM attendance 
         WHERE employee_id = ? AND MONTH(date) = ? AND YEAR(date) = ? AND status IN ('Present', 'Late', 'Half Day')`,
        [empId, currentMonth, currentYear]
      );

      // 2. Approved leaves taken this year
      const [leaves] = await db.query(
        `SELECT SUM(days) AS count FROM leave_requests 
         WHERE employee_id = ? AND status = 'Approved' AND YEAR(start_date) = ?`,
        [empId, currentYear]
      );

      // 3. Pending leave requests
      const [pending] = await db.query(
        `SELECT COUNT(*) AS count FROM leave_requests 
         WHERE employee_id = ? AND status = 'Pending'`,
        [empId]
      );

      return res.status(200).json({
        presentDays: present[0].count || 0,
        leavesTaken: leaves[0].count || 0,
        pendingRequests: pending[0].count || 0
      });
    } catch (err) {
      console.error('getMyStats error:', err);
      return res.status(500).json({ message: 'Failed to query profile statistics.' });
    }
  },

  // GET /api/employees/:id (Admin view specific employee details)
  getEmployeeById: async (req, res) => {
    const { id } = req.params;
    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      const [rows] = await db.query(
        `SELECT e.*, d.name AS department, u.email 
         FROM employees e
         LEFT JOIN departments d ON e.department_id = d.id
         LEFT JOIN users u ON e.user_id = u.id
         WHERE e.id = ? LIMIT 1`,
        [id]
      );

      if (rows.length === 0 || rows[0].company_id !== companyId) {
        return res.status(403).json({ message: 'Access denied: employee belongs to a different company.' });
      }

      // Load salary components breakdown
      const [salaries] = await db.query('SELECT * FROM salary_components WHERE employee_id = ? LIMIT 1', [id]);
      const empData = rows[0];
      empData.salary_breakdown = salaries.length > 0 ? salaries[0] : null;

      return res.status(200).json(empData);
    } catch (err) {
      console.error('getEmployeeById error:', err);
      return res.status(500).json({ message: 'Failed to fetch employee details.' });
    }
  },

  // POST /api/employees (Admin add new employee + auto user creation)
  addEmployee: async (req, res) => {
    const { name, email, role, department, photo } = req.body;

    if (!name || !email || !role || !department) {
      return res.status(400).json({ message: 'Name, email, role, and department are required fields.' });
    }

    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Check if user email already exists
      const [existingUser] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (existingUser.length > 0) {
        await conn.rollback();
        return res.status(400).json({ message: 'A user account with this email address already exists.' });
      }

      // Check if department exists in this company
      const [depts] = await conn.query('SELECT id FROM departments WHERE name = ? AND company_id = ? LIMIT 1', [department, companyId]);
      if (depts.length === 0) {
        await conn.rollback();
        return res.status(400).json({ message: 'Specified department does not exist in your company.' });
      }
      const departmentId = depts[0].id;

      // 1. Create corresponding user record with default password 'Temp@123'
      const hashedPassword = await bcrypt.hash('Temp@123', 10);
      const [userResult] = await conn.query(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, 'employee']
      );
      const newUserId = userResult.insertId;

      // 2. Generate employee code automatically (EMP-001, etc.)
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

      // 3. Create employee profile record with default permissions and company ID
      const {
        securityClearance,
        roleClearance,
        departmentAccess,
        payrollPermission,
        recruitmentPermission,
        leavePermission,
        attendancePermission,
        employeeManagementPermission
      } = req.body;

      const [empResult] = await conn.query(
        `INSERT INTO employees 
        (employee_code, user_id, name, role, department_id, status, photo, personal_email, join_date,
         security_clearance, role_clearance, department_access, payroll_permission, 
         recruitment_permission, leave_permission, attendance_permission, employee_management_permission, company_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeCode,
          newUserId,
          name,
          role,
          departmentId,
          'Active',
          photo || null,
          email,
          securityClearance || 'Level 1 (Standard Employee)',
          roleClearance || 'Employee',
          departmentAccess || 'Own Department Only',
          payrollPermission || 'View Only',
          recruitmentPermission || 'No Access',
          leavePermission || 'Apply Only',
          attendancePermission || 'Check-in/Check-out Only',
          employeeManagementPermission || 'No Access',
          companyId
        ]
      );
      const newEmpId = empResult.insertId;

      // 4. Initialize blank salary components for the new employee
      await conn.query(
        `INSERT INTO salary_components 
        (employee_id, basic_salary, hra, travel_allowance, medical_allowance, performance_bonus, other_allowances, provident_fund, professional_tax, other_deductions, gross_salary, net_salary) 
        VALUES (?, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00)`,
        [newEmpId]
      );

      await conn.commit();

      // Audit log
      await logAction(req.user.id, 'Employee Created', 'employees', newEmpId);

      return res.status(201).json({
        success: true,
        message: 'Employee profile and user login created successfully.',
        employee: {
          id: newEmpId,
          employee_code: employeeCode,
          user_id: newUserId,
          name,
          role,
          department,
          status: 'Active',
          photo,
        },
      });
    } catch (err) {
      await conn.rollback();
      console.error('addEmployee error:', err);
      return res.status(500).json({ message: 'Failed to create employee profile.' });
    } finally {
      conn.release();
    }
  },

  // PUT /api/employees/:id (Admin update specific employee detail)
  updateEmployee: async (req, res) => {
    const { id } = req.params;
    const { 
      name, 
      email, 
      role, 
      department, 
      salary, 
      status,
      securityClearance,
      roleClearance,
      departmentAccess,
      payrollPermission,
      recruitmentPermission,
      leavePermission,
      attendancePermission,
      employeeManagementPermission
    } = req.body;

    if (!name || !email || !role || !department) {
      return res.status(400).json({ message: 'Name, email, role, and department are required fields.' });
    }

    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Check if employee exists and belongs to the admin's company
      const [existing] = await conn.query('SELECT * FROM employees WHERE id = ? LIMIT 1', [id]);
      if (existing.length === 0 || existing[0].company_id !== companyId) {
        await conn.rollback();
        return res.status(403).json({ message: 'Access denied: employee belongs to a different company.' });
      }

      const employee = existing[0];

      // Check if department exists in this company
      const [depts] = await conn.query('SELECT id FROM departments WHERE name = ? AND company_id = ? LIMIT 1', [department, companyId]);
      if (depts.length === 0) {
        await conn.rollback();
        return res.status(400).json({ message: 'Department does not exist in your company.' });
      }
      const departmentId = depts[0].id;

      // Update employee record
      await conn.query(
        `UPDATE employees SET 
          name = ?,
          role = ?,
          department_id = ?,
          status = ?,
          security_clearance = ?,
          role_clearance = ?,
          department_access = ?,
          payroll_permission = ?,
          recruitment_permission = ?,
          leave_permission = ?,
          attendance_permission = ?,
          employee_management_permission = ?
        WHERE id = ?`,
        [
          name, 
          role, 
          departmentId, 
          status || 'Active', 
          securityClearance || employee.security_clearance,
          roleClearance || employee.role_clearance,
          departmentAccess || employee.department_access,
          payrollPermission || employee.payroll_permission,
          recruitmentPermission || employee.recruitment_permission,
          leavePermission || employee.leave_permission,
          attendancePermission || employee.attendance_permission,
          employeeManagementPermission || employee.employee_management_permission,
          id
        ]
      );

      // Update user login email
      if (employee.user_id) {
        await conn.query('UPDATE users SET email = ? WHERE id = ?', [email, employee.user_id]);
      }

      // Update salary components basic_salary
      if (salary !== undefined) {
        const numericSalary = parseFloat(salary) || 0.00;
        await conn.query(
          `UPDATE salary_components SET 
            basic_salary = ?, 
            gross_salary = basic_salary + hra + travel_allowance + medical_allowance + performance_bonus + other_allowances + standard_allowance + leave_travel_allowance + fixed_allowance, 
            net_salary = gross_salary - provident_fund - professional_tax - income_tax - other_deductions 
          WHERE employee_id = ?`,
          [numericSalary, id]
        );
      }

      await conn.commit();

      // Audit Log
      await logAction(req.user.id, 'Employee Updated', 'employees', id);

      return res.status(200).json({ success: true, message: 'Employee record updated successfully.' });
    } catch (err) {
      await conn.rollback();
      console.error('updateEmployee error:', err);
      return res.status(500).json({ message: 'Failed to update employee details.' });
    } finally {
      conn.release();
    }
  },

  // DELETE /api/employees/:id (Admin delete employee)
  deleteEmployee: async (req, res) => {
    const { id } = req.params;

    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Find employee and verify company
      const [existing] = await conn.query('SELECT * FROM employees WHERE id = ? LIMIT 1', [id]);
      if (existing.length === 0 || existing[0].company_id !== companyId) {
        await conn.rollback();
        return res.status(403).json({ message: 'Access denied: employee belongs to a different company.' });
      }

      const employee = existing[0];

      // Delete associated user record
      if (employee.user_id) {
        await conn.query('DELETE FROM users WHERE id = ?', [employee.user_id]);
      } else {
        await conn.query('DELETE FROM employees WHERE id = ?', [id]);
      }

      await conn.commit();

      // Audit log
      await logAction(req.user.id, 'Employee Deleted', 'employees', id);

      return res.status(200).json({ success: true, message: 'Employee deleted successfully.' });
    } catch (err) {
      await conn.rollback();
      console.error('deleteEmployee error:', err);
      return res.status(500).json({ message: 'Failed to delete employee profile.' });
    } finally {
      conn.release();
    }
  },

  // GET /api/admin/stats (HR dashboard summary KPIs, isolated by company)
  getAdminStats: async (req, res) => {
    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      // 1. Total Employees
      const [total] = await db.query("SELECT COUNT(*) AS count FROM employees WHERE status = 'Active' AND company_id = ?", [companyId]);
      
      // 2. Present Today (checked-in today)
      const todayStr = new Date().toISOString().split('T')[0];
      const [present] = await db.query(
        `SELECT COUNT(*) AS count FROM attendance a
         JOIN employees e ON a.employee_id = e.id
         WHERE a.date = ? AND a.status IN ('Present', 'Late', 'Half Day') AND e.company_id = ?`,
        [todayStr, companyId]
      );

      // 3. Pending Leaves
      const [leaves] = await db.query(
        `SELECT COUNT(*) AS count FROM leave_requests l
         JOIN employees e ON l.employee_id = e.id
         WHERE l.status = 'Pending' AND e.company_id = ?`,
         [companyId]
      );

      // 4. Monthly Payroll Budget (Sum of net salary from active components)
      const [payrollSum] = await db.query(
        `SELECT SUM(sc.net_salary) AS total FROM salary_components sc
         JOIN employees e ON sc.employee_id = e.id
         WHERE e.company_id = ?`,
         [companyId]
      );

      const headcount = total[0].count || 0;
      const attendees = present[0].count || 0;
      const attendeeRate = headcount > 0 ? Math.round((attendees / headcount) * 100) : 0;

      return res.status(200).json({
        totalEmployees: headcount,
        totalEmployeesChange: '+2 MTD',
        presentToday: attendees,
        presentTodayRate: `${attendeeRate}%`,
        pendingLeaves: leaves[0].count || 0,
        monthlyPayroll: payrollSum[0].total ? `$${parseFloat(payrollSum[0].total).toLocaleString()}` : '$0.00',
      });
    } catch (err) {
      console.error('getAdminStats error:', err);
      return res.status(500).json({ message: 'Failed to fetch admin stats.' });
    }
  },

  // GET /api/admin/staff-stats (MTD counts in staff directory, isolated by company)
  getStaffStats: async (req, res) => {
    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // 1. Total Staff
      const [total] = await db.query("SELECT COUNT(*) AS count FROM employees WHERE company_id = ?", [companyId]);
      
      // 2. Active Now
      const [active] = await db.query(
        `SELECT COUNT(*) AS count FROM attendance a
         JOIN employees e ON a.employee_id = e.id
         WHERE a.date = ? AND a.status IN ('Present', 'Late') AND e.company_id = ?`,
        [todayStr, companyId]
      );

      // 3. On Leave
      const [leaves] = await db.query(
        "SELECT COUNT(*) AS count FROM employees WHERE status = 'On Leave' AND company_id = ?",
        [companyId]
      );

      // 4. New Hires this month MTD
      const startOfMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
      const [newHires] = await db.query(
        "SELECT COUNT(*) AS count FROM employees WHERE join_date >= ? AND company_id = ?",
        [startOfMonthStr, companyId]
      );

      const totalCount = total[0].count || 0;
      const activeCount = active[0].count || 0;
      const leaveCount = leaves[0].count || 0;

      const activeRate = totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}%` : '0%';
      const leaveRate = totalCount > 0 ? `${Math.round((leaveCount / totalCount) * 100)}%` : '0%';

      return res.status(200).json({
        totalStaff: totalCount,
        totalStaffChange: '+1 MTD',
        activeNow: activeCount,
        activeNowRate: activeRate,
        onLeave: leaveCount,
        onLeaveRate: leaveRate,
        newHires: newHires[0].count || 0
      });
    } catch (err) {
      console.error('getStaffStats error:', err);
      return res.status(500).json({ message: 'Failed to fetch staff directory statistics.' });
    }
  },

  // GET /api/admin/activity (HR Dashboard Recent Activity, isolated by company)
  getAdminActivity: async (req, res) => {
    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      const [logs] = await db.query(
        `SELECT l.id, l.action AS title, l.timestamp AS time, e.name AS employeeName, e.photo AS userPhoto
         FROM audit_logs l
         LEFT JOIN users u ON l.user_id = u.id
         LEFT JOIN employees e ON u.id = e.user_id
         WHERE e.company_id = ?
         ORDER BY l.id DESC LIMIT 10`,
         [companyId]
      );

      // Format audit log items for RecentActivityList format
      const formatted = logs.map(item => {
        let type = 'check_in';
        if (item.title.includes('Employee Created')) type = 'new_hire';
        if (item.title.includes('Leave')) type = 'leave_approve';
        if (item.title.includes('Payroll')) type = 'payroll';

        const dateObj = new Date(item.time);
        const diffMs = new Date() - dateObj;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        let timeStr = `${diffHrs} hours ago`;
        if (diffHrs === 0) {
          const diffMins = Math.floor(diffMs / (1000 * 60));
          timeStr = diffMins === 0 ? 'Just now' : `${diffMins} minutes ago`;
        } else if (diffHrs >= 24) {
          timeStr = dateObj.toLocaleDateString();
        }

        return {
          id: String(item.id),
          title: item.employeeName ? `${item.employeeName}: ${item.title}` : item.title,
          time: timeStr,
          type,
          userPhoto: item.userPhoto
        };
      });

      return res.status(200).json(formatted);
    } catch (err) {
      console.error('getAdminActivity error:', err);
      return res.status(500).json({ message: 'Failed to query activity logs.' });
    }
  },

  // GET /api/employees/me/activity (Employee Dashboard Activity list)
  getEmployeeActivity: async (req, res) => {
    try {
      const userId = req.user.id;
      const [logs] = await db.query(
        `SELECT l.id, l.action AS title, l.timestamp AS time
         FROM audit_logs l
         WHERE l.user_id = ?
         ORDER BY l.id DESC LIMIT 10`,
        [userId]
      );

      const formatted = logs.map(item => {
        let type = 'check_in';
        if (item.title.includes('Leave')) type = 'leave_approve';
        if (item.title.includes('Payroll')) type = 'payroll';

        const dateObj = new Date(item.time);
        const diffMs = new Date() - dateObj;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        let timeStr = `${diffHrs} hours ago`;
        if (diffHrs === 0) {
          const diffMins = Math.floor(diffMs / (1000 * 60));
          timeStr = diffMins === 0 ? 'Just now' : `${diffMins} minutes ago`;
        } else if (diffHrs >= 24) {
          timeStr = dateObj.toLocaleDateString();
        }

        return {
          id: String(item.id),
          title: item.title,
          time: timeStr,
          type
        };
      });

      return res.status(200).json(formatted);
    } catch (err) {
      console.error('getEmployeeActivity error:', err);
      return res.status(500).json({ message: 'Failed to fetch personal activity list.' });
    }
  }
};

module.exports = employeeController;
