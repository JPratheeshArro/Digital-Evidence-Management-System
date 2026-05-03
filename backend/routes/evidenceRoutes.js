const express = require('express');
const evidenceController = require('../controllers/evidenceController');
const { adminOrOfficer, anyAuthenticated, auditLog, rateLimitSensitive } = require('../middleware/roleAuth');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const { 
  validateEvidenceUpload, 
  validateEvidenceUpdate, 
  validateEvidenceFilters, 
  validateId,
  validateBatchOperation 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Routes with enhanced security
// Upload single evidence file
router.post('/upload', 
  ...adminOrOfficer,
  auditLog('upload', 'evidence'),
  uploadSingle, 
  validateEvidenceUpload,
  asyncHandler(evidenceController.uploadEvidence)
);

// Upload multiple evidence files
router.post('/upload-multiple', 
  ...adminOrOfficer,
  auditLog('upload-multiple', 'evidence'),
  uploadMultiple, 
  validateEvidenceUpload,
  asyncHandler(evidenceController.uploadMultipleEvidence)
);

// Get all evidence with filters
router.get('/', 
  ...anyAuthenticated,
  validateEvidenceFilters,
  asyncHandler(evidenceController.getAllEvidence)
);

// Get evidence statistics
router.get('/stats', 
  ...adminOrOfficer,
  auditLog('view', 'evidence-stats'),
  asyncHandler(evidenceController.getEvidenceStats)
);

// Get integrity statistics
router.get('/integrity-stats', 
  ...adminOrOfficer,
  auditLog('view', 'integrity-stats'),
  asyncHandler(evidenceController.getIntegrityStats)
);

// Get evidence by ID
router.get('/:id', 
  ...anyAuthenticated,
  validateId,
  asyncHandler(evidenceController.getEvidenceById)
);

// Download evidence file
router.get('/:id/download', 
  ...anyAuthenticated,
  validateId,
  auditLog('download', 'evidence'),
  asyncHandler(evidenceController.downloadEvidence)
);

// Verify evidence integrity
router.get('/:id/verify-integrity', 
  ...anyAuthenticated,
  validateId,
  auditLog('verify-integrity', 'evidence'),
  asyncHandler(evidenceController.verifyEvidenceIntegrity)
);

// Batch verify evidence integrity
router.post('/batch-verify-integrity', 
  ...anyAuthenticated,
  validateBatchOperation,
  auditLog('batch-verify-integrity', 'evidence'),
  asyncHandler(evidenceController.batchVerifyEvidenceIntegrity)
);

// Update evidence metadata
router.put('/:id', 
  ...adminOrOfficer,
  validateId,
  validateEvidenceUpdate,
  auditLog('update', 'evidence'),
  asyncHandler(evidenceController.updateEvidence)
);

// Delete evidence
router.delete('/:id', 
  ...adminOrOfficer,
  validateId,
  auditLog('delete', 'evidence'),
  rateLimitSensitive,
  asyncHandler(evidenceController.deleteEvidence)
);

// Duplicate detection routes
router.get('/duplicates/stats', 
  ...adminOrOfficer,
  auditLog('view', 'duplicate-stats'),
  asyncHandler(evidenceController.getDuplicateStats)
);

router.get('/duplicates/report', 
  ...adminOrOfficer,
  auditLog('view', 'duplicate-report'),
  asyncHandler(evidenceController.getDuplicateReport)
);

router.get('/duplicates/hash/:hash', 
  ...adminOrOfficer,
  auditLog('view', 'duplicates-by-hash'),
  asyncHandler(evidenceController.getDuplicatesByHash)
);

router.get('/:id/duplicates', 
  ...anyAuthenticated,
  validateId,
  auditLog('view', 'duplicate-chain'),
  asyncHandler(evidenceController.getDuplicateChain)
);

router.get('/similar/:filename', 
  ...anyAuthenticated,
  auditLog('view', 'similar-files'),
  asyncHandler(evidenceController.getSimilarFiles)
);

module.exports = router;
