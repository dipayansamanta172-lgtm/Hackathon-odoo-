const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// All department operations are Admin-only
router.get('/', departmentController.getDepartments);
router.post('/', roleMiddleware(['admin']), departmentController.createDepartment);
router.put('/:id', roleMiddleware(['admin']), departmentController.updateDepartment);
router.delete('/:id', roleMiddleware(['admin']), departmentController.deleteDepartment);

module.exports = router;
