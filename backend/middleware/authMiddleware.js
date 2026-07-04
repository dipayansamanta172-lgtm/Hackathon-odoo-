const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET environment variable is missing.');
    return res.status(500).json({ message: 'Internal server configuration error.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    // Check if session is active in database
    const [sessions] = await db.query(
      'SELECT * FROM user_sessions WHERE user_id = ? AND jwt_token = ? AND logout_time IS NULL LIMIT 1',
      [decoded.id, token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ message: 'Session expired or invalidated. Please login again.' });
    }

    // Load user details
    const [users] = await db.query(
      'SELECT id, email, role FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'User associated with this token no longer exists.' });
    }

    const user = users[0];

    // Load employee profile details joined with departments and salary components
    const [employees] = await db.query(
      `SELECT e.*, d.name AS department, d.department_code,
              sc.basic_salary, sc.hra, sc.travel_allowance, sc.medical_allowance, 
              sc.performance_bonus, sc.other_allowances, sc.standard_allowance, 
              sc.leave_travel_allowance, sc.fixed_allowance, sc.provident_fund, 
              sc.professional_tax, sc.income_tax, sc.other_deductions, 
              sc.gross_salary, sc.net_salary
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN salary_components sc ON e.id = sc.employee_id
       WHERE e.user_id = ? LIMIT 1`,
      [user.id]
    );

    if (employees.length > 0) {
      employees[0].user_role = user.role;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      employee: employees.length > 0 ? employees[0] : null,
      token: token,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

module.exports = authMiddleware;
