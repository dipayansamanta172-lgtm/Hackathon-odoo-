const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// HR Dashboard Admin Stats and activity logs
router.get('/stats', employeeController.getAdminStats);
router.get('/staff-stats', employeeController.getStaffStats);
router.get('/activity', employeeController.getAdminActivity);

module.exports = router;
