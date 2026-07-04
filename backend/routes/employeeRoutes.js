const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Employee-accessible endpoints
router.get('/me', employeeController.getMyProfile);
router.put('/me', employeeController.updateMyProfile);
router.get('/me/stats', employeeController.getMyStats);
router.get('/me/activity', employeeController.getEmployeeActivity);

// Admin & general employee directory list
router.get('/', employeeController.getEmployees);

// Admin-only endpoints
router.get('/:id', roleMiddleware(['admin']), employeeController.getEmployeeById);
router.post('/', roleMiddleware(['admin']), employeeController.addEmployee);
router.put('/:id', roleMiddleware(['admin']), employeeController.updateEmployee);
router.delete('/:id', roleMiddleware(['admin']), employeeController.deleteEmployee);

module.exports = router;
