const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Employee payslip history
router.get('/me', payrollController.getMyPayroll);

// Admin-only payroll budget configuration
router.get('/budget', roleMiddleware(['admin']), payrollController.getBudget);
router.put('/budget', roleMiddleware(['admin']), payrollController.updateBudget);

// Admin-only payroll processing routes
router.get('/', roleMiddleware(['admin']), payrollController.getAdminPayroll);
router.put('/:id/approve', roleMiddleware(['admin']), payrollController.approvePayroll);

module.exports = router;
