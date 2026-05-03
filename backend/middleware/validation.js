const { body, query, param, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .optional()
    .isIn(['admin', 'officer', 'forensic'])
    .withMessage('Role must be one of: admin, officer, forensic'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['admin', 'officer', 'forensic'])
    .withMessage('Role must be one of: admin, officer, forensic'),
  
  handleValidationErrors
];

// Authentication validation
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Case validation
const validateCaseCreation = [
  body('case_number')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Case number must be between 3 and 50 characters')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Case number can only contain uppercase letters, numbers, and hyphens'),
  
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('status')
    .optional()
    .isIn(['open', 'closed', 'pending'])
    .withMessage('Status must be one of: open, closed, pending'),
  
  body('assigned_officer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned officer ID must be a positive integer'),
  
  handleValidationErrors
];

const validateCaseUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('status')
    .optional()
    .isIn(['open', 'closed', 'pending'])
    .withMessage('Status must be one of: open, closed, pending'),
  
  body('assigned_officer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned officer ID must be a positive integer'),
  
  handleValidationErrors
];

// Evidence validation
const validateEvidenceUpload = [
  body('case_id')
    .isInt({ min: 1 })
    .withMessage('Case ID must be a positive integer'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  
  handleValidationErrors
];

const validateEvidenceUpdate = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  
  handleValidationErrors
];

// Query parameter validation
const validateEvidenceFilters = [
  query('case_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Case ID must be a positive integer'),
  
  query('file_type')
    .optional()
    .isIn(['image', 'video', 'audio', 'document', 'archive', 'other'])
    .withMessage('Invalid file type'),
  
  query('collected_by')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Collected by must be a positive integer'),
  
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  
  query('integrity_status')
    .optional()
    .isIn(['valid', 'tampered', 'pending', 'error'])
    .withMessage('Invalid integrity status'),
  
  handleValidationErrors
];

const validateCaseFilters = [
  query('status')
    .optional()
    .isIn(['open', 'closed', 'pending'])
    .withMessage('Status must be one of: open, closed, pending'),
  
  query('assigned_officer_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned officer ID must be a positive integer'),
  
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  handleValidationErrors
];

// Batch operations validation
const validateBatchOperation = [
  body('ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('IDs must be an array with 1 to 100 items'),
  
  body('ids.*')
    .isInt({ min: 1 })
    .withMessage('Each ID must be a positive integer'),
  
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  query('type')
    .optional()
    .isIn(['cases', 'evidence', 'users'])
    .withMessage('Search type must be one of: cases, evidence, users'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserUpdate,
  validateLogin,
  validateCaseCreation,
  validateCaseUpdate,
  validateEvidenceUpload,
  validateEvidenceUpdate,
  validateEvidenceFilters,
  validateCaseFilters,
  validateId,
  validateBatchOperation,
  validatePasswordChange,
  validateSearch
};
