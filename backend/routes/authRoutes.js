const express = require('express');
const authController = require('../controllers/authController');
const { auditLog, rateLimitSensitive } = require('../middleware/roleAuth');
const { validateUserRegistration, validateLogin } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Routes with enhanced security
router.post('/register', 
  rateLimitSensitive,
  auditLog('register', 'user'),
  validateUserRegistration,
  asyncHandler(authController.register)
);

router.post('/login', 
  rateLimitSensitive,
  auditLog('login', 'auth'),
  validateLogin,
  asyncHandler(authController.login)
);

module.exports = router;
