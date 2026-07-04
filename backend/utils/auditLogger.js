const db = require('../config/db');

/**
 * Log a user action to the audit_logs table
 * @param {number|null} userId - The user performing the action
 * @param {string} action - The action name (e.g. 'Employee Created')
 * @param {string} tableName - The table modified (e.g. 'employees')
 * @param {string|number} recordId - The primary key of the record modified
 */
const logAction = async (userId, action, tableName, recordId) => {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
      [userId, action, tableName, String(recordId)]
    );
  } catch (err) {
    console.error('Audit log failed to write:', err.message);
  }
};

module.exports = { logAction };
