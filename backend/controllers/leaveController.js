const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');

const leaveController = {
  // GET /api/leaves (Admin fetch all leaves list, filtered by company)
  getLeaves: async (req, res) => {
    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      const [rows] = await db.query(
        `SELECT r.id, r.start_date AS startDate, r.end_date AS endDate,
                r.days, r.reason, r.status, r.approved_at, r.rejection_reason,
                t.name AS type, e.name AS employeeName, e.photo AS employeePhoto, e.role
         FROM leave_requests r
         LEFT JOIN leave_types t ON r.leave_type_id = t.id
         LEFT JOIN employees e ON r.employee_id = e.id
         WHERE e.company_id = ?
         ORDER BY r.id DESC`,
         [companyId]
      );

      // Map rows to match camelCase dates
      const mapped = rows.map(r => ({
        id: String(r.id),
        employeeName: r.employeeName,
        employeePhoto: r.employeePhoto,
        role: r.role,
        type: r.type,
        startDate: r.startDate.toISOString().split('T')[0],
        endDate: r.endDate.toISOString().split('T')[0],
        days: r.days,
        reason: r.reason,
        status: r.status,
        rejectionReason: r.rejection_reason
      }));

      return res.status(200).json(mapped);
    } catch (err) {
      console.error('getLeaves error:', err);
      return res.status(500).json({ message: 'Failed to fetch leave requests.' });
    }
  },

  // GET /api/leaves/me (Employee personal leaves)
  getMyLeaves: async (req, res) => {
    if (!req.user.employee) {
      return res.status(200).json([]);
    }

    const empId = req.user.employee.id;

    try {
      const [rows] = await db.query(
        `SELECT r.id, r.start_date AS startDate, r.end_date AS endDate,
                r.days, r.reason, r.status, t.name AS type
         FROM leave_requests r
         LEFT JOIN leave_types t ON r.leave_type_id = t.id
         WHERE r.employee_id = ?
         ORDER BY r.id DESC`,
         [empId]
      );

      const mapped = rows.map(r => ({
        id: String(r.id),
        type: r.type,
        startDate: r.startDate.toISOString().split('T')[0],
        endDate: r.endDate.toISOString().split('T')[0],
        days: r.days,
        reason: r.reason,
        status: r.status
      }));

      return res.status(200).json(mapped);
    } catch (err) {
      console.error('getMyLeaves error:', err);
      return res.status(500).json({ message: 'Failed to fetch personal leave requests.' });
    }
  },

  // POST /api/leaves (Employee apply for leave)
  applyLeave: async (req, res) => {
    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Type, startDate, endDate, and reason are required fields.' });
    }

    if (!req.user.employee) {
      return res.status(400).json({ message: 'Employee profile required to apply for leave.' });
    }

    const empId = req.user.employee.id;

    try {
      // Find leave type ID
      const [lt] = await db.query('SELECT id FROM leave_types WHERE name = ? LIMIT 1', [type]);
      if (lt.length === 0) {
        return res.status(400).json({ message: 'Invalid leave type specified.' });
      }
      const leaveTypeId = lt[0].id;

      // Calculate days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays <= 0) {
        return res.status(400).json({ message: 'End date must be on or after start date.' });
      }

      const [result] = await db.query(
        `INSERT INTO leave_requests 
        (employee_id, leave_type_id, start_date, end_date, days, reason, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [empId, leaveTypeId, startDate, endDate, diffDays, reason, 'Pending']
      );

      // Audit Log
      await logAction(req.user.id, 'Leave Requested', 'leave_requests', result.insertId);

      return res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully.',
        leave: {
          id: String(result.insertId),
          employeeName: req.user.employee.name,
          employeePhoto: req.user.employee.photo,
          role: req.user.employee.role,
          type,
          startDate,
          endDate,
          days: diffDays,
          reason,
          status: 'Pending'
        }
      });
    } catch (err) {
      console.error('applyLeave error:', err);
      return res.status(500).json({ message: 'Failed to submit leave request.' });
    }
  },

  // PUT /api/leaves/:id/status (Admin approve/reject request)
  updateStatus: async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected.' });
    }

    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      const [existing] = await db.query(
        `SELECT r.*, e.company_id FROM leave_requests r 
         JOIN employees e ON r.employee_id = e.id 
         WHERE r.id = ? LIMIT 1`, 
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ message: 'Leave request not found.' });
      }

      const leaveReq = existing[0];
      if (leaveReq.company_id !== companyId) {
        return res.status(403).json({ message: 'Access denied: leave request belongs to a different company.' });
      }
      
      // Update employee status to On Leave if status is Approved and date matches today
      if (status === 'Approved') {
        const today = new Date().toISOString().split('T')[0];
        const startStr = leaveReq.start_date.toISOString().split('T')[0];
        const endStr = leaveReq.end_date.toISOString().split('T')[0];
        
        if (today >= startStr && today <= endStr) {
          await db.query('UPDATE employees SET status = ? WHERE id = ?', ['On Leave', leaveReq.employee_id]);
        }
      }

      await db.query(
        `UPDATE leave_requests SET 
          status = ?, 
          approved_by = ?, 
          approved_at = CURRENT_TIMESTAMP(),
          rejection_reason = ?
         WHERE id = ?`,
        [status, req.user.id, rejectionReason || null, id]
      );

      // Create notification for employee
      const [emp] = await db.query('SELECT user_id, name FROM employees WHERE id = ? LIMIT 1', [leaveReq.employee_id]);
      if (emp.length > 0) {
        const user = emp[0];
        await db.query(
          `INSERT INTO notifications (user_id, title, description, type, link, created_by) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            user.user_id,
            `Leave Request ${status}`,
            `Your leave request starting on ${leaveReq.start_date.toISOString().split('T')[0]} has been ${status.toLowerCase()}.`,
            'leave_approve',
            '/employee/leave',
            req.user.id
          ]
        );
      }

      // Audit Log
      await logAction(req.user.id, `Leave ${status}`, 'leave_requests', id);

      return res.status(200).json({ success: true, message: `Leave request status updated to ${status}.` });
    } catch (err) {
      console.error('updateStatus error:', err);
      return res.status(500).json({ message: 'Failed to update leave request status.' });
    }
  },

  // GET /api/leaves/team-availability (Filtered by company)
  getTeamAvailability: async (req, res) => {
    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      // Get all active employees for this company
      const [allEmployees] = await db.query(
        'SELECT id, name, photo AS avatar FROM employees WHERE status != "Inactive" AND company_id = ?',
        [companyId]
      );

      // Generate next 4 days starting from today
      const daysList = [];
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      const today = new Date();
      const endRange = new Date();
      endRange.setDate(today.getDate() + 3);

      const [approvedLeaves] = await db.query(
        `SELECT r.employee_id, r.start_date, r.end_date FROM leave_requests r
         JOIN employees e ON r.employee_id = e.id
         WHERE r.status = 'Approved' 
         AND e.company_id = ?
         AND (
           (r.start_date <= ? AND r.end_date >= ?) OR
           (r.start_date >= ? AND r.start_date <= ?)
         )`,
        [
          companyId,
          endRange.toISOString().split('T')[0],
          today.toISOString().split('T')[0],
          today.toISOString().split('T')[0],
          endRange.toISOString().split('T')[0]
        ]
      );

      for (let i = 0; i < 4; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        const dayStr = weekdays[d.getDay()];
        const dateNum = d.getDate();
        const dateCompareStr = d.toISOString().split('T')[0];

        // Map status of each employee for this day
        const employeesStatus = allEmployees.map(emp => {
          const isOnLeave = approvedLeaves.some(l => {
            if (l.employee_id !== emp.id) return false;
            const start = l.start_date.toISOString().split('T')[0];
            const end = l.end_date.toISOString().split('T')[0];
            return dateCompareStr >= start && dateCompareStr <= end;
          });

          return {
            name: emp.name,
            avatar: emp.avatar,
            status: isOnLeave ? 'On Leave' : 'Available'
          };
        });

        const hasOnLeave = employeesStatus.some(e => e.status === 'On Leave');

        daysList.push({
          day: dayStr,
          date: dateNum,
          isToday: i === 0,
          status: hasOnLeave ? 'on_leave' : 'available',
          employees: employeesStatus
        });
      }

      return res.status(200).json(daysList);
    } catch (err) {
      console.error('getTeamAvailability error:', err);
      return res.status(500).json({ message: 'Failed to query team availability overview.' });
    }
  }
};

module.exports = leaveController;
