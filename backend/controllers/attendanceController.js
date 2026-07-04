const db = require('../config/db');
const { logAction } = require('../utils/auditLogger');

// Format minutes to "8h 30m" string format
const formatMinutes = (totalMins) => {
  if (!totalMins) return '0h 00m';
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
};

const attendanceController = {
  // GET /api/attendance/by-date (Admin Daily Viewer list)
  getAttendanceByDate: async (req, res) => {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required.' });
    }

    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      // Return attendance entries joined with employees, filtered by company
      const [rows] = await db.query(
        `SELECT a.id, a.date, a.check_in AS checkIn, a.check_out AS checkOut,
                a.status, a.working_minutes, a.overtime_minutes,
                e.id AS employee_id, e.name, e.employee_code AS display_code, e.photo, d.name AS department
         FROM employees e
         LEFT JOIN departments d ON e.department_id = d.id
         LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = ?
         WHERE e.company_id = ?
         ORDER BY e.name ASC`,
        [date, companyId]
      );

      // Map rows to structure matching frontend table expectations
      const mapped = rows.map(r => {
        return {
          id: r.id ? String(r.id) : `temp-${r.employee_id}`,
          name: r.name,
          employee_id: r.employee_id,
          photo: r.photo,
          department: r.department || '--',
          checkIn: r.checkIn ? new Date(`1970-01-01T${r.checkIn}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
          checkOut: r.checkOut ? new Date(`1970-01-01T${r.checkOut}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
          hours: formatMinutes(r.working_minutes),
          extra: formatMinutes(r.overtime_minutes),
          status: r.status || 'Absent'
        };
      });

      return res.status(200).json(mapped);
    } catch (err) {
      console.error('getAttendanceByDate error:', err);
      return res.status(500).json({ message: 'Failed to fetch attendance registry.' });
    }
  },

  // GET /api/attendance/me (Employee personal monthly logs)
  getMyAttendance: async (req, res) => {
    if (!req.user.employee) {
      return res.status(200).json([]);
    }

    const empId = req.user.employee.id;
    const { month } = req.query; // format: YYYY-MM

    try {
      let query = `
        SELECT id, date, check_in AS checkIn, check_out AS checkOut, working_minutes, overtime_minutes, status 
        FROM attendance 
        WHERE employee_id = ?
      `;
      const params = [empId];

      if (month) {
        query += ' AND date LIKE ?';
        params.push(`${month}%`);
      }

      query += ' ORDER BY date DESC';

      const [rows] = await db.query(query, params);
      
      const mapped = rows.map(r => ({
        id: String(r.id),
        date: r.date.toISOString().split('T')[0],
        checkIn: r.checkIn ? new Date(`1970-01-01T${r.checkIn}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
        checkOut: r.checkOut ? new Date(`1970-01-01T${r.checkOut}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
        hours: formatMinutes(r.working_minutes),
        extra: formatMinutes(r.overtime_minutes),
        status: r.status
      }));

      return res.status(200).json(mapped);
    } catch (err) {
      console.error('getMyAttendance error:', err);
      return res.status(500).json({ message: 'Failed to fetch attendance logs.' });
    }
  },

  // POST /api/attendance/check-in
  checkIn: async (req, res) => {
    if (!req.user.employee) {
      return res.status(400).json({ message: 'Employee profile required to check in.' });
    }
    const empId = req.user.employee.id;
    const today = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

    // Determine status (Late if after 09:15 AM)
    const [hours, minutes] = nowTimeStr.split(':').map(Number);
    const checkInMins = hours * 60 + minutes;
    const lateThreshold = 9 * 60 + 15; // 09:15 AM
    const status = checkInMins > lateThreshold ? 'Late' : 'Present';

    try {
      // Check if already checked in today
      const [existing] = await db.query(
        'SELECT * FROM attendance WHERE employee_id = ? AND date = ? LIMIT 1',
        [empId, today]
      );

      if (existing.length > 0) {
        return res.status(400).json({ message: 'Already checked in for today.' });
      }

      await db.query(
        'INSERT INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, ?)',
        [empId, today, nowTimeStr, status]
      );

      // Audit log
      await logAction(req.user.id, 'Employee Check-In', 'attendance', today);

      return res.status(201).json({
        success: true,
        checkIn: new Date(`1970-01-01T${nowTimeStr}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status
      });
    } catch (err) {
      console.error('checkIn error:', err);
      return res.status(500).json({ message: 'Check-in failed due to server database error.' });
    }
  },

  // POST /api/attendance/check-out
  checkOut: async (req, res) => {
    if (!req.user.employee) {
      return res.status(400).json({ message: 'Employee profile required to check out.' });
    }
    const empId = req.user.employee.id;
    const today = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

    try {
      // Find today's check-in
      const [existing] = await db.query(
        'SELECT * FROM attendance WHERE employee_id = ? AND date = ? LIMIT 1',
        [empId, today]
      );

      if (existing.length === 0) {
        return res.status(400).json({ message: 'No check-in record found for today. Please check in first.' });
      }

      const attendanceRow = existing[0];
      if (attendanceRow.check_out) {
        return res.status(400).json({ message: 'Already checked out for today.' });
      }

      // Compute total minutes worked
      const checkInTime = new Date(`1970-01-01T${attendanceRow.check_in}`);
      const checkOutTime = new Date(`1970-01-01T${nowTimeStr}`);
      let diffMins = Math.floor((checkOutTime - checkInTime) / 1000 / 60);
      if (diffMins < 0) diffMins = 0;

      const standardShiftMins = 480; // 8 hours
      const overtimeMins = Math.max(0, diffMins - standardShiftMins);

      // If check-in was late but total hours fit, preserve status or adjust status
      let finalStatus = attendanceRow.status;
      if (diffMins < 240) {
        finalStatus = 'Half Day';
      }

      await db.query(
        `UPDATE attendance SET 
          check_out = ?, 
          working_minutes = ?, 
          overtime_minutes = ?,
          status = ?
         WHERE id = ?`,
        [nowTimeStr, diffMins, overtimeMins, finalStatus, attendanceRow.id]
      );

      // Audit log
      await logAction(req.user.id, 'Employee Check-Out', 'attendance', attendanceRow.id);

      return res.status(200).json({
        success: true,
        checkOut: new Date(`1970-01-01T${nowTimeStr}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        workingMinutes: diffMins,
        status: finalStatus
      });
    } catch (err) {
      console.error('checkOut error:', err);
      return res.status(500).json({ message: 'Check-out failed.' });
    }
  },

  // PUT /api/attendance/:id/status (Admin overwrite status)
  updateStatus: async (req, res) => {
    const { id } = req.params;
    const { status, date } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const companyId = req.user.employee ? req.user.employee.company_id : null;
    if (!companyId) {
      return res.status(400).json({ message: 'User is not associated with any company.' });
    }

    try {
      if (id.startsWith('temp-')) {
        const employeeId = id.substring(5);
        if (!date) {
          return res.status(400).json({ message: 'Date is required for new attendance entries.' });
        }

        // Verify that the target employee belongs to the admin's company
        const [emp] = await db.query('SELECT company_id FROM employees WHERE id = ? LIMIT 1', [employeeId]);
        if (emp.length === 0 || emp[0].company_id !== companyId) {
          return res.status(403).json({ message: 'Access denied: employee belongs to a different company.' });
        }

        // Insert new row
        const [result] = await db.query(
          'INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
          [employeeId, date, status, status]
        );

        // Audit Log
        await logAction(req.user.id, 'Attendance Updated', 'attendance', result.insertId || employeeId);
        
        return res.status(200).json({ 
          success: true, 
          id: String(result.insertId), 
          message: 'Attendance status recorded successfully.' 
        });
      } else {
        // Verify that the attendance record belongs to an employee of the admin's company
        const [existing] = await db.query(
          `SELECT e.company_id FROM attendance a 
           JOIN employees e ON a.employee_id = e.id 
           WHERE a.id = ? LIMIT 1`, 
          [id]
        );

        if (existing.length === 0 || existing[0].company_id !== companyId) {
          return res.status(403).json({ message: 'Access denied: attendance record belongs to a different company.' });
        }

        await db.query('UPDATE attendance SET status = ? WHERE id = ?', [status, id]);

        // Audit Log
        await logAction(req.user.id, 'Attendance Updated', 'attendance', id);

        return res.status(200).json({ 
          success: true, 
          id: String(id), 
          message: 'Attendance status updated successfully.' 
        });
      }
    } catch (err) {
      console.error('updateStatus error:', err);
      return res.status(500).json({ message: 'Failed to update attendance status.' });
    }
  }
};

module.exports = attendanceController;
