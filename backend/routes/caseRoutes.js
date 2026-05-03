const express = require('express');
const { body } = require('express-validator');
const caseController = require('../controllers/caseController');
const { adminOrOfficer, anyAuthenticated, adminOnly } = require('../middleware/roleAuth');
const { validateId } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const caseValidation = [
  body('case_number').trim().isLength({ min: 3, max: 50 }).withMessage('Case number must be between 3 and 50 characters'),
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('assigned_officer_id').optional().isInt({ min: 1 }).withMessage('Assigned officer ID must be a positive integer')
];

const updateValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['open', 'closed', 'pending']).withMessage('Status must be open, closed, or pending'),
  body('assigned_officer_id').optional().isInt({ min: 1 }).withMessage('Assigned officer ID must be a positive integer')
];

// Routes - Production-ready with proper authentication
router.get('/', anyAuthenticated, caseController.getAllCases);
router.get('/stats', adminOrOfficer, caseController.getCaseStats);
router.get('/:id', anyAuthenticated, validateId, caseController.getCaseById);
router.post('/', adminOrOfficer, caseValidation, caseController.createCase);
router.put('/:id', adminOrOfficer, validateId, updateValidation, caseController.updateCase);
router.delete('/:id', adminOnly, validateId, caseController.deleteCase);

module.exports = router;
