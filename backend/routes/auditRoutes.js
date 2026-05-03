const express = require('express');
const { query } = require('express-validator');
const auditController = require('../controllers/auditController');
const { anyAuthenticated, adminOnly } = require('../middleware/roleAuth');

const router = express.Router();

// Validation rules
const filterValidation = [
  query('user_id').optional().isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD', 'UPLOAD', 'VERIFY', 'LOGIN', 'LOGOUT']).withMessage('Invalid action'),
  query('resource_type').optional().isIn(['evidence', 'case', 'user', 'system']).withMessage('Invalid resource type'),
  query('resource_id').optional().isInt({ min: 1 }).withMessage('Resource ID must be a positive integer'),
  query('date_from').optional().isDate().withMessage('Date from must be a valid date'),
  query('date_to').optional().isDate().withMessage('Date to must be a valid date'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
];

// Routes
// Get all audit logs (admin only)
router.get('/', 
  adminOnly, 
  filterValidation, 
  auditController.getAllAuditLogs
);

// Get audit statistics (admin only)
router.get('/stats', 
  adminOnly, 
  filterValidation, 
  auditController.getAuditStats
);

// Get recent activity (admin only)
router.get('/recent', 
  adminOnly, 
  filterValidation, 
  auditController.getRecentActivity
);

// Get audit log by ID (admin only)
router.get('/:id', 
  adminOnly, 
  auditController.getAuditLogById
);

// Get audit logs for specific resource (authenticated users)
router.get('/resource/:resourceType/:resourceId', 
  anyAuthenticated, 
  auditController.getResourceAuditLogs
);

// Get timeline for specific resource (authenticated users)
router.get('/timeline/:resourceType/:resourceId', 
  anyAuthenticated, 
  auditController.getResourceTimeline
);

// Get user activity (admin only or own activity)
router.get('/user/:userId', 
  anyAuthenticated, 
  filterValidation, 
  auditController.getUserActivity
);

module.exports = router;
