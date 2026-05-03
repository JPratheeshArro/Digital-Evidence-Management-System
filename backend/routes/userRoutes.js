const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { adminOnly, adminOrOfficer, anyAuthenticated } = require('../middleware/roleAuth');

const router = express.Router();

// Validation rules
const userValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['admin', 'officer', 'forensic']).withMessage('Role must be admin, officer, or forensic')
];

const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['admin', 'officer', 'forensic']).withMessage('Role must be admin, officer, or forensic')
];

// Routes with role-based protection
router.get('/', userController.getAllUsers); 
router.get('/role/:role', adminOrOfficer, userController.getUsersByRole);
router.get('/stats', adminOrOfficer, userController.getRoleStats);
router.get('/profile', anyAuthenticated, userController.getProfile);
router.get('/:id', anyAuthenticated, userController.getUserById);
router.post('/', adminOnly, userValidation, userController.createUser);
router.put('/:id', anyAuthenticated, updateUserValidation, userController.updateUser);
router.put('/:id/role', adminOnly, userController.updateUserRole);
router.delete('/:id', adminOnly, userController.deleteUser);

module.exports = router;
