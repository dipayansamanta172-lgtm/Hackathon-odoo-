const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Employee & Admin shared endpoints
router.get('/me', leaveController.getMyLeaves);
router.post('/', leaveController.applyLeave);
router.get('/team-availability', leaveController.getTeamAvailability);

// Admin-only endpoints
router.get('/', roleMiddleware(['admin']), leaveController.getLeaves);
router.put('/:id/status', roleMiddleware(['admin']), leaveController.updateStatus);

module.exports = router;
