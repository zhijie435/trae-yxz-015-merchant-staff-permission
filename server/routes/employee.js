const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', employeeController.getEmployees);
router.get('/pending', employeeController.getPendingEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.put('/:id/password', employeeController.updatePassword);
router.put('/:id/permissions', employeeController.updatePermissions);
router.patch('/:id/status', employeeController.toggleEmployeeStatus);
router.patch('/:id/approve', employeeController.approveEmployee);
router.patch('/:id/reject', employeeController.rejectEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
