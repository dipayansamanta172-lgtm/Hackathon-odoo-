const db = require('../config/db');

const notificationController = {
  // GET /api/notifications
  getNotifications: async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT id, title, description AS \`desc\`, type, link, is_read AS \`read\`, created_at 
         FROM notifications 
         WHERE user_id = ? 
         ORDER BY id DESC`,
        [req.user.id]
      );

      // Convert is_read boolean and format time relative string if required (handled or placeholder on frontend)
      const mapped = rows.map(r => {
        const dateObj = new Date(r.created_at);
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
          id: String(r.id),
          title: r.title,
          desc: r.desc,
          type: r.type || 'check_in',
          link: r.link || '',
          read: Boolean(r.read),
          time: timeStr
        };
      });

      return res.status(200).json(mapped);
    } catch (err) {
      console.error('getNotifications error:', err);
      return res.status(500).json({ message: 'Failed to fetch notifications.' });
    }
  },

  // PUT /api/notifications/:id/read
  markAsRead: async (req, res) => {
    const { id } = req.params;
    try {
      await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
        [id, req.user.id]
      );
      return res.status(200).json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
      console.error('markAsRead error:', err);
      return res.status(500).json({ message: 'Failed to update notification status.' });
    }
  },

  // PUT /api/notifications/mark-all-read
  markAllRead: async (req, res) => {
    try {
      await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
        [req.user.id]
      );
      return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
      console.error('markAllRead error:', err);
      return res.status(500).json({ message: 'Failed to update all notification statuses.' });
    }
  },

  // DELETE /api/notifications
  clearAll: async (req, res) => {
    try {
      await db.query(
        'DELETE FROM notifications WHERE user_id = ?',
        [req.user.id]
      );
      return res.status(200).json({ success: true, message: 'All notifications cleared.' });
    } catch (err) {
      console.error('clearAll error:', err);
      return res.status(500).json({ message: 'Failed to clear notifications.' });
    }
  }
};

module.exports = notificationController;
