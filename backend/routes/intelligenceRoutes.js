const express = require('express');
const { body, query, param } = require('express-validator');
const intelligenceController = require('../controllers/intelligenceController');
const { adminOrOfficer, anyAuthenticated, adminOnly } = require('../middleware/roleAuth');
const { validateId, validateBatchOperation } = require('../middleware/validation');

const router = express.Router();

// Anomaly Detection Routes
router.get('/anomalies', 
  anyAuthenticated, 
  intelligenceController.getAnomalyReport
);

router.get('/anomalies/duplicates', 
  anyAuthenticated, 
  intelligenceController.getDuplicateEvidence
);

router.get('/anomalies/cross-case', 
  anyAuthenticated, 
  intelligenceController.getCrossCaseUsage
);

router.get('/anomalies/upload-patterns', 
  anyAuthenticated, 
  intelligenceController.getUploadPatterns
);

// Risk Scoring Routes
router.post('/risk/evidence', 
  adminOrOfficer,
  body('evidenceIds').isArray().withMessage('evidenceIds must be an array'),
  intelligenceController.calculateEvidenceRisk
);

router.post('/risk/cases', 
  adminOrOfficer,
  body('caseIds').isArray().withMessage('caseIds must be an array'),
  intelligenceController.calculateCaseRisk
);

router.get('/risk/distribution', 
  anyAuthenticated,
  query('type').isIn(['evidence', 'case']).withMessage('type must be evidence or case'),
  intelligenceController.getRiskDistribution
);

// Insights Routes
router.get('/insights/anomaly/:anomalyId', 
  anyAuthenticated,
  param('anomalyId').notEmpty().withMessage('anomalyId is required'),
  intelligenceController.getAnomalyInsights
);

// Activity Analytics Routes
router.get('/analytics/activity', 
  anyAuthenticated,
  query('timeRange').isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid time range'),
  query('includeDetails').optional().isBoolean().withMessage('includeDetails must be boolean'),
  intelligenceController.getActivityAnalytics
);

router.get('/analytics/realtime', 
  anyAuthenticated,
  intelligenceController.getRealTimeMetrics
);

router.get('/analytics/user/:userId', 
  anyAuthenticated,
  param('userId').isInt().withMessage('userId must be an integer'),
  query('timeRange').isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid time range'),
  intelligenceController.getUserActivityAnalytics
);

router.get('/analytics/case/:caseId', 
  anyAuthenticated,
  param('caseId').isInt().withMessage('caseId must be an integer'),
  query('timeRange').isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid time range'),
  intelligenceController.getCaseActivityAnalytics
);

// Export Routes
router.post('/export/evidence', 
  adminOrOfficer,
  body('format').isIn(['csv', 'pdf']).withMessage('format must be csv or pdf'),
  body('caseId').optional().isInt().withMessage('caseId must be an integer'),
  body('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid date'),
  body('dateTo').optional().isISO8601().withMessage('dateTo must be a valid date'),
  body('includeRiskScores').optional().isBoolean().withMessage('includeRiskScores must be boolean'),
  body('includeHashes').optional().isBoolean().withMessage('includeHashes must be boolean'),
  body('includeMetadata').optional().isBoolean().withMessage('includeMetadata must be boolean'),
  intelligenceController.exportEvidence
);

router.post('/export/audit-logs', 
  adminOnly,
  body('format').isIn(['csv', 'pdf']).withMessage('format must be csv or pdf'),
  body('userId').optional().isInt().withMessage('userId must be an integer'),
  body('action').optional().isString().withMessage('action must be a string'),
  body('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid date'),
  body('dateTo').optional().isISO8601().withMessage('dateTo must be a valid date'),
  body('resourceType').optional().isString().withMessage('resourceType must be a string'),
  intelligenceController.exportAuditLogs
);

router.post('/export/anomaly-report', 
  adminOrOfficer,
  intelligenceController.exportAnomalyReport
);

router.post('/export/activity-analytics', 
  adminOrOfficer,
  body('timeRange').isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid time range'),
  intelligenceController.exportActivityAnalytics
);

router.get('/export/files', 
  adminOrOfficer,
  intelligenceController.getExportFiles
);

router.get('/export/download/:filename', 
  adminOrOfficer,
  param('filename').notEmpty().withMessage('filename is required'),
  intelligenceController.downloadExportFile
);

router.delete('/export/files/:filename', 
  adminOnly,
  param('filename').notEmpty().withMessage('filename is required'),
  intelligenceController.deleteExportFile
);

// Alerts Routes
router.get('/alerts', 
  anyAuthenticated,
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  query('category').optional().isString().withMessage('category must be a string'),
  query('userId').optional().isInt().withMessage('userId must be an integer'),
  query('status').optional().isString().withMessage('status must be a string'),
  query('limit').optional().isInt().withMessage('limit must be an integer'),
  intelligenceController.getAlerts
);

router.get('/alerts/statistics', 
  adminOrOfficer,
  query('timeRange').isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid time range'),
  intelligenceController.getAlertStatistics
);

router.post('/alerts/:alertId/acknowledge', 
  anyAuthenticated,
  param('alertId').notEmpty().withMessage('alertId is required'),
  body('notes').optional().isString().withMessage('notes must be a string'),
  intelligenceController.acknowledgeAlert
);

router.post('/alerts/:alertId/resolve', 
  anyAuthenticated,
  param('alertId').notEmpty().withMessage('alertId is required'),
  body('resolution').optional().isString().withMessage('resolution must be a string'),
  intelligenceController.resolveAlert
);

// Dashboard Summary Route
router.get('/dashboard/summary', 
  anyAuthenticated,
  intelligenceController.getDashboardSummary
);

module.exports = router;
