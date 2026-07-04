const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Employee & Admin shared check-in/out and personal queries
router.get('/me', attendanceController.getMyAttendance);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

// Admin-only registry viewing & updates
router.get('/by-date', roleMiddleware(['admin']), attendanceController.getAttendanceByDate);
router.put('/:id/status', roleMiddleware(['admin']), attendanceController.updateStatus);

module.exports = router;
