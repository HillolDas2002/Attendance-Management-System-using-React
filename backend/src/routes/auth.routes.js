const { Router } = require('express');
const { authenticateJWT } = require('../middleware/auth');
const controller = require('../controllers/auth.controller');

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/profile', authenticateJWT, controller.getProfile);

module.exports = router;


