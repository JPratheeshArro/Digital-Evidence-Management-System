const AnomalyDetection = require('../services/anomalyDetection');
const RiskScoring = require('../services/riskScoring');
const InsightsService = require('../services/insightsService');
const ActivityAnalytics = require('../services/activityAnalytics');
const ExportService = require('../services/exportService');
const AlertsService = require('../services/alertsService');

const intelligenceController = {
  // Anomaly Detection Endpoints
  async getAnomalyReport(req, res) {
    try {
      const { timeRange = '7d', severity = 'low' } = req.query;
      
      const anomalyReport = await AnomalyDetection.getAnomalyReport();
      
      // Filter by severity if specified
      if (severity !== 'all') {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        const minLevel = severityLevels[severity] || 1;
        
        anomalyReport.anomalies = anomalyReport.anomalies.filter(anomaly => 
          severityLevels[anomaly.severity] >= minLevel
        );
        
        // Update summary
        anomalyReport.summary.totalAnomalies = anomalyReport.anomalies.length;
        anomalyReport.summary.highSeverity = anomalyReport.anomalies.filter(a => a.severity === 'critical').length;
        anomalyReport.summary.mediumSeverity = anomalyReport.anomalies.filter(a => a.severity === 'high').length;
        anomalyReport.summary.lowSeverity = anomalyReport.anomalies.filter(a => a.severity === 'medium').length;
      }
      
      res.json({
        success: true,
        data: anomalyReport
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getDuplicateEvidence(req, res) {
    try {
      const duplicates = await AnomalyDetection.detectDuplicateEvidence();
      
      res.json({
        success: true,
        data: duplicates
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getCrossCaseUsage(req, res) {
    try {
      const crossCaseUsage = await AnomalyDetection.detectCrossCaseUsage();
      
      res.json({
        success: true,
        data: crossCaseUsage
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getUploadPatterns(req, res) {
    try {
      const patterns = await AnomalyDetection.detectUploadPatterns();
      
      res.json({
        success: true,
        data: patterns
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Risk Scoring Endpoints
  async calculateEvidenceRisk(req, res) {
    try {
      const { evidenceIds } = req.body;
      
      if (!evidenceIds || !Array.isArray(evidenceIds)) {
        return res.status(400).json({
          success: false,
          message: 'evidenceIds array is required'
        });
      }
      
      // Get evidence data
      const Evidence = require('../models/Evidence');
      const evidence = await Promise.all(
        evidenceIds.map(id => Evidence.findById(id))
      );
      
      // Calculate risk scores
      const riskAssessments = RiskScoring.batchCalculateRisk(
        evidence.filter(e => e),
        'evidence'
      );
      
      res.json({
        success: true,
        data: riskAssessments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async calculateCaseRisk(req, res) {
    try {
      const { caseIds } = req.body;
      
      if (!caseIds || !Array.isArray(caseIds)) {
        return res.status(400).json({
          success: false,
          message: 'caseIds array is required'
        });
      }
      
      // Get case data
      const Case = require('../models/Case');
      const cases = await Promise.all(
        caseIds.map(id => Case.findById(id))
      );
      
      // Calculate risk scores
      const riskAssessments = RiskScoring.batchCalculateRisk(
        cases.filter(c => c),
        'case'
      );
      
      res.json({
        success: true,
        data: riskAssessments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getRiskDistribution(req, res) {
    try {
      const { type = 'evidence' } = req.query;
      
      let items;
      if (type === 'evidence') {
        const Evidence = require('../models/Evidence');
        items = await Evidence.findAll();
      } else if (type === 'case') {
        const Case = require('../models/Case');
        items = await Case.findAll();
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be "evidence" or "case"'
        });
      }
      
      // Calculate risk scores
      const riskAssessments = RiskScoring.batchCalculateRisk(items, type);
      
      // Get distribution
      const distribution = RiskScoring.getRiskDistribution(riskAssessments);
      
      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Insights Endpoints
  async getAnomalyInsights(req, res) {
    try {
      const { anomalyId } = req.params;
      
      // Get anomaly (in a real implementation, this would come from a database)
      const anomalyReport = await AnomalyDetection.getAnomalyReport();
      const anomaly = anomalyReport.anomalies.find(a => a.id === anomalyId);
      
      if (!anomaly) {
        return res.status(404).json({
          success: false,
          message: 'Anomaly not found'
        });
      }
      
      // Generate insights
      const insights = await InsightsService.generateAnomalyInsights(anomaly);
      
      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Activity Analytics Endpoints
  async getActivityAnalytics(req, res) {
    try {
      const { 
        timeRange = '7d', 
        includeDetails = false,
        userId = null,
        caseId = null 
      } = req.query;
      
      const options = {
        timeRange,
        includeDetails: includeDetails === 'true',
        userId: userId ? parseInt(userId) : null,
        caseId: caseId ? parseInt(caseId) : null
      };
      
      const analytics = await ActivityAnalytics.getActivityAnalytics(options);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getRealTimeMetrics(req, res) {
    try {
      const metrics = await ActivityAnalytics.getRealTimeMetrics();
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getUserActivityAnalytics(req, res) {
    try {
      const { userId } = req.params;
      const { timeRange = '7d' } = req.query;
      
      const analytics = await ActivityAnalytics.getUserActivityAnalytics(
        parseInt(userId),
        { timeRange }
      );
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getCaseActivityAnalytics(req, res) {
    try {
      const { caseId } = req.params;
      const { timeRange = '7d' } = req.query;
      
      const analytics = await ActivityAnalytics.getCaseActivityAnalytics(
        parseInt(caseId),
        { timeRange }
      );
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Export Endpoints
  async exportEvidence(req, res) {
    try {
      const { 
        format = 'csv',
        caseId = null,
        dateFrom = null,
        dateTo = null,
        includeRiskScores = true,
        includeHashes = true,
        includeMetadata = true
      } = req.body;
      
      const options = {
        caseId: caseId ? parseInt(caseId) : null,
        dateFrom,
        dateTo,
        includeRiskScores,
        includeHashes,
        includeMetadata
      };
      
      let result;
      if (format === 'csv') {
        result = await ExportService.exportEvidenceToCSV(options);
      } else if (format === 'pdf') {
        result = await ExportService.exportEvidenceToPDF(options);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid format. Must be "csv" or "pdf"'
        });
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async exportAuditLogs(req, res) {
    try {
      const { 
        format = 'csv',
        userId = null,
        action = null,
        dateFrom = null,
        dateTo = null,
        resourceType = null
      } = req.body;
      
      const options = {
        userId: userId ? parseInt(userId) : null,
        action,
        dateFrom,
        dateTo,
        resourceType
      };
      
      let result;
      if (format === 'csv') {
        result = await ExportService.exportAuditLogsToCSV(options);
      } else if (format === 'pdf') {
        result = await ExportService.exportAuditLogsToPDF(options);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid format. Must be "csv" or "pdf"'
        });
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async exportAnomalyReport(req, res) {
    try {
      const result = await ExportService.exportAnomalyReportToPDF();
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async exportActivityAnalytics(req, res) {
    try {
      const { timeRange = '7d' } = req.body;
      
      const result = await ExportService.exportActivityAnalyticsToPDF({ timeRange });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getExportFiles(req, res) {
    try {
      const files = await ExportService.getExportFiles();
      
      res.json({
        success: true,
        data: files
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async downloadExportFile(req, res) {
    try {
      const { filename } = req.params;
      const files = await ExportService.getExportFiles();
      const file = files.find(f => f.filename === filename);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }
      
      res.download(file.filepath, filename);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async deleteExportFile(req, res) {
    try {
      const { filename } = req.params;
      
      const success = await ExportService.deleteExportFile(filename);
      
      res.json({
        success,
        message: success ? 'File deleted successfully' : 'File not found'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Alerts Endpoints
  async getAlerts(req, res) {
    try {
      const { 
        severity = null,
        category = null,
        userId = null,
        status = 'active',
        limit = 100
      } = req.query;
      
      const filters = {
        severity,
        category,
        userId: userId ? parseInt(userId) : null,
        status,
        limit: limit ? parseInt(limit) : 100
      };
      
      const alerts = await AlertsService.getActiveAlerts(filters);
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getAlertStatistics(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      
      const statistics = await AlertsService.getAlertStatistics({ timeRange });
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async acknowledgeAlert(req, res) {
    try {
      const { alertId } = req.params;
      const { notes = '' } = req.body;
      const userId = req.user.id;
      
      const result = await AlertsService.acknowledgeAlert(alertId, userId, notes);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async resolveAlert(req, res) {
    try {
      const { alertId } = req.params;
      const { resolution = '' } = req.body;
      const userId = req.user.id;
      
      const result = await AlertsService.resolveAlert(alertId, userId, resolution);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Dashboard Summary Endpoint
  async getDashboardSummary(req, res) {
    try {
      const [
        anomalyReport,
        alertReport,
        activityAnalytics,
        realTimeMetrics
      ] = await Promise.all([
        AnomalyDetection.getAnomalyReport(),
        AlertsService.generateIntelligentAlerts({ minSeverity: 'medium' }),
        ActivityAnalytics.getActivityAnalytics({ timeRange: '24h' }),
        ActivityAnalytics.getRealTimeMetrics()
      ]);
      
      const summary = {
        anomalies: {
          total: anomalyReport.summary.totalAnomalies,
          critical: anomalyReport.summary.highSeverity,
          high: anomalyReport.summary.mediumSeverity,
          medium: anomalyReport.summary.lowSeverity
        },
        alerts: {
          total: alertReport.summary.total,
          pending: alertReport.summary.pending,
          acknowledged: alertReport.summary.acknowledged
        },
        activity: {
          total: activityAnalytics.summary.total,
          uploads: activityAnalytics.summary.uploads,
          downloads: activityAnalytics.summary.downloads,
          efficiency: activityAnalytics.summary.efficiency
        },
        system: {
          activeUsers: realTimeMetrics.activeUsers,
          recentActivity: realTimeMetrics.last5Minutes,
          systemStatus: realTimeMetrics.systemStatus.status
        },
        trends: activityAnalytics.trends,
        generatedAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = intelligenceController;
