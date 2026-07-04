const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const payrollController = {
  // GET /api/payroll/me (Employee personal payslips list)
  getMyPayroll: async (req, res) => {
    if (!req.user.employee) {
      return res.status(200).json([]);
    }

    const empId = req.user.employee.id;

    try {
      const [rows] = await db.query(
        `SELECT id, pay_month, pay_year, date, basic_salary, hra, travel_allowance, 
                medical_allowance, performance_bonus, other_allowances, standard_allowance,
                leave_travel_allowance, fixed_allowance, provident_fund, professional_tax, 
                income_tax, other_deductions, gross_salary, net_salary, status
         FROM payroll
         WHERE employee_id = ?
         ORDER BY pay_year DESC, pay_month DESC`,
        [empId]
      );

      const mapped = rows.map(r => {
        const monthLabel = `${monthNames[r.pay_month - 1]} ${r.pay_year}`;
        
        // Sum of all allowances
        const totalAllowances = 
          parseFloat(r.hra || 0) + 
          parseFloat(r.travel_allowance || 0) + 
          parseFloat(r.medical_allowance || 0) + 
          parseFloat(r.performance_bonus || 0) + 
          parseFloat(r.standard_allowance || 0) + 
          parseFloat(r.leave_travel_allowance || 0) + 
          parseFloat(r.fixed_allowance || 0) + 
          parseFloat(r.other_allowances || 0);

        // Sum of all deductions
        const totalDeductions = 
          parseFloat(r.provident_fund || 0) + 
          parseFloat(r.professional_tax || 0) + 
          parseFloat(r.income_tax || 0) + 
          parseFloat(r.other_deductions || 0);

        return {
          id: String(r.id),
          month: monthLabel,
          date: r.date.toISOString().split('T')[0],
          basic: parseFloat(r.basic_salary || 0),
          allowances: totalAllowances,
          deductions: totalDeductions,
          net: parseFloat(r.net_salary || 0),
          status: r.status,
          // Detailed salary breakdown fields for UI Modal detail viewer
          details: {
            hra: parseFloat(r.hra || 0),
            travel: parseFloat(r.travel_allowance || 0),
            medical: parseFloat(r.medical_allowance || 0),
            bonus: parseFloat(r.performance_bonus || 0),
            standardAllowance: parseFloat(r.standard_allowance || 0),
            lta: parseFloat(r.leave_travel_allowance || 0),
            fixedAllowance: parseFloat(r.fixed_allowance || 0),
            otherAllowances: parseFloat(r.other_allowances || 0),
            pf: parseFloat(r.provident_fund || 0),
            tax: parseFloat(r.professional_tax || 0),
            incomeTax: parseFloat(r.income_tax || 0),
            otherDeductions: parseFloat(r.other_deductions || 0)
          }
        };
      });

      return res.status(200).json(mapped);
    } catch (err) {
      console.error('getMyPayroll error:', err);
      return res.status(500).json({ message: 'Failed to fetch personal payslips.' });
    }
  },

  // GET /api/payroll (Admin list employee payroll runs)
  getAdminPayroll: async (req, res) => {
    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      // Query all employees joined with their current salary_components profile
      // and their payroll status for the current month/year, filtered by company
      const [rows] = await db.query(
        `SELECT e.id, e.name, e.photo, e.role,
                sc.basic_salary, sc.hra, sc.travel_allowance, sc.medical_allowance, 
                sc.performance_bonus, sc.other_allowances, sc.standard_allowance,
                sc.leave_travel_allowance, sc.fixed_allowance, sc.provident_fund, 
                sc.professional_tax, sc.income_tax, sc.other_deductions, sc.gross_salary, sc.net_salary,
                p.id AS payroll_id, p.status AS payroll_status
         FROM employees e
         LEFT JOIN salary_components sc ON e.id = sc.employee_id
         LEFT JOIN payroll p ON e.id = p.employee_id AND p.pay_month = ? AND p.pay_year = ?
         WHERE e.status = 'Active' AND e.company_id = ?
         ORDER BY e.name ASC`,
        [currentMonth, currentYear, companyId]
      );

      // Map rows for the Admin Payroll list
      const mapped = rows.map(r => {
        // Calculate dynamic allowance sum and deduction sum
        const basic = parseFloat(r.basic_salary || 0);
        const allowancesSum = 
          parseFloat(r.hra || 0) + 
          parseFloat(r.travel_allowance || 0) + 
          parseFloat(r.medical_allowance || 0) + 
          parseFloat(r.performance_bonus || 0) + 
          parseFloat(r.standard_allowance || 0) + 
          parseFloat(r.leave_travel_allowance || 0) + 
          parseFloat(r.fixed_allowance || 0) + 
          parseFloat(r.other_allowances || 0);

        const deductionsSum = 
          parseFloat(r.provident_fund || 0) + 
          parseFloat(r.professional_tax || 0) + 
          parseFloat(r.income_tax || 0) + 
          parseFloat(r.other_deductions || 0);

        const netSalary = r.net_salary ? parseFloat(r.net_salary) : (basic + allowancesSum - deductionsSum);

        return {
          id: String(r.id),
          name: r.name,
          photo: r.photo,
          role: r.role,
          salary: `$${netSalary.toLocaleString()}`,
          status: r.payroll_id ? r.payroll_status : 'Pending'
        };
      });

      return res.status(200).json(mapped);
    } catch (err) {
      console.error('getAdminPayroll error:', err);
      return res.status(500).json({ message: 'Failed to fetch payroll list.' });
    }
  },

  // PUT /api/payroll/:id/approve (Admin approve / release payroll for employee)
  approvePayroll: async (req, res) => {
    const employeeId = req.params.id; // numeric employee_id
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const todayStr = now.toISOString().split('T')[0];

    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      // Verify that the employee belongs to the admin's company
      const [empProfile] = await db.query('SELECT company_id, user_id FROM employees WHERE id = ? LIMIT 1', [employeeId]);
      if (empProfile.length === 0 || empProfile[0].company_id !== companyId) {
        return res.status(403).json({ message: 'Access denied: employee belongs to a different company.' });
      }

      // 1. Fetch salary components profile for employee
      const [salaries] = await db.query(
        'SELECT * FROM salary_components WHERE employee_id = ? LIMIT 1',
        [employeeId]
      );

      if (salaries.length === 0) {
        return res.status(404).json({ message: 'Salary components profile not configured for employee.' });
      }

      const sc = salaries[0];

      // 2. Check if payroll was already approved/created for this employee this month
      const [existing] = await db.query(
        'SELECT * FROM payroll WHERE employee_id = ? AND pay_month = ? AND pay_year = ? LIMIT 1',
        [employeeId, currentMonth, currentYear]
      );

      if (existing.length > 0) {
        if (existing[0].status === 'Approved') {
          return res.status(400).json({ message: 'Payroll has already been approved for this employee this month.' });
        }
        
        // Update existing pending payroll row to Approved
        await db.query(
          'UPDATE payroll SET status = ?, date = ? WHERE id = ?',
          ['Approved', todayStr, existing[0].id]
        );
      } else {
        // Insert new payroll record
        await db.query(
          `INSERT INTO payroll 
          (employee_id, pay_month, pay_year, date, basic_salary, hra, travel_allowance, 
           medical_allowance, performance_bonus, other_allowances, standard_allowance,
           leave_travel_allowance, fixed_allowance, provident_fund, professional_tax,
           income_tax, other_deductions, gross_salary, net_salary, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            employeeId,
            currentMonth,
            currentYear,
            todayStr,
            sc.basic_salary,
            sc.hra,
            sc.travel_allowance,
            sc.medical_allowance,
            sc.performance_bonus,
            sc.other_allowances,
            sc.standard_allowance,
            sc.leave_travel_allowance,
            sc.fixed_allowance,
            sc.provident_fund,
            sc.professional_tax,
            sc.income_tax,
            sc.other_deductions,
            sc.gross_salary,
            sc.net_salary,
            'Approved'
          ]
        );
      }

      // Create notification for employee
      await db.query(
        `INSERT INTO notifications (user_id, title, description, type, link, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          empProfile[0].user_id,
          'Payslip Released',
          `Your payslip for ${monthNames[currentMonth - 1]} ${currentYear} has been generated and approved.`,
          'payroll',
          '/employee/salary',
          req.user.id
        ]
      );

      // Audit Log
      await logAction(req.user.id, 'Payroll Approved', 'payroll', employeeId);

      return res.status(200).json({ success: true, message: 'Payroll approved and payslip generated successfully.' });
    } catch (err) {
      console.error('approvePayroll error:', err);
      return res.status(500).json({ message: 'Failed to approve payroll.' });
    }
  },

  // GET /api/payroll/budget (Fetch target payroll budget for company)
  getBudget: async (req, res) => {
    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      const [rows] = await db.query('SELECT payroll_budget FROM company WHERE id = ? LIMIT 1', [companyId]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Company record not found.' });
      }
      return res.status(200).json({ budget: parseFloat(rows[0].payroll_budget || 0) });
    } catch (err) {
      console.error('getBudget error:', err);
      return res.status(500).json({ message: 'Failed to fetch payroll budget.' });
    }
  },

  // PUT /api/payroll/budget (Update target payroll budget for company)
  updateBudget: async (req, res) => {
    const { budget } = req.body;
    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      const numericBudget = parseFloat(budget) || 0.00;
      await db.query('UPDATE company SET payroll_budget = ? WHERE id = ?', [numericBudget, companyId]);

      // Audit Log
      await logAction(req.user.id, 'Payroll Budget Updated', 'company', companyId);

      return res.status(200).json({ 
        success: true, 
        budget: numericBudget, 
        message: 'Payroll budget saved successfully.' 
      });
    } catch (err) {
      console.error('updateBudget error:', err);
      return res.status(500).json({ message: 'Failed to update payroll budget.' });
    }
  }
};

module.exports = payrollController;
