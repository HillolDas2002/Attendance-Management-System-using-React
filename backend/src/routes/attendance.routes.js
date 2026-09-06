const { Router } = require('express');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const controller = require('../controllers/attendance.controller');

const router = Router();
router.use(authenticateJWT);

router.post('/self', controller.checkInOut);
router.get('/my-attendance', controller.getMyAttendance);

router.get('/hr-dashboard', authorizeRoles('hr'), controller.getHrDashboard);
router.get('/employees', authorizeRoles('hr'), controller.getEmployees);
router.put('/employee/:userId', authorizeRoles('hr'), controller.updateEmployeeAttendance);

module.exports = router;
