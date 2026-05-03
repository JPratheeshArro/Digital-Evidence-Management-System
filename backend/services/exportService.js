const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

class ExportService {
  /**
   * Export evidence data to CSV
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  static async exportEvidenceToCSV(options = {}) {
    try {
      const {
        caseId = null,
        dateFrom = null,
        dateTo = null,
        includeRiskScores = true,
        includeHashes = true,
        includeMetadata = true
      } = options;

      const evidence = await this.getEvidenceData(options);
      const csvData = this.formatEvidenceForCSV(evidence, options);
      
      const filename = `evidence_export_${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = await this.generateCSVFile(csvData, filename);
      
      return {
        success: true,
        filename,
        filepath,
        recordCount: csvData.length,
        format: 'csv',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error exporting evidence to CSV: ${error.message}`);
    }
  }

  /**
   * Export evidence data to PDF
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  static async exportEvidenceToPDF(options = {}) {
    try {
      const {
        caseId = null,
        dateFrom = null,
        dateTo = null,
        includeRiskScores = true,
        includeHashes = true,
        includeMetadata = true,
        includeCharts = true
      } = options;

      const evidence = await this.getEvidenceData(options);
      const filename = `evidence_export_${new Date().toISOString().split('T')[0]}.pdf`;
      const filepath = await this.generatePDFFile(evidence, filename, options);
      
      return {
        success: true,
        filename,
        filepath,
        recordCount: evidence.length,
        format: 'pdf',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error exporting evidence to PDF: ${error.message}`);
    }
  }

  /**
   * Export audit logs to CSV
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  static async exportAuditLogsToCSV(options = {}) {
    try {
      const {
        userId = null,
        action = null,
        dateFrom = null,
        dateTo = null,
        resourceType = null
      } = options;

      const logs = await this.getAuditLogData(options);
      const csvData = this.formatAuditLogsForCSV(logs);
      
      const filename = `audit_logs_export_${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = await this.generateCSVFile(csvData, filename);
      
      return {
        success: true,
        filename,
        filepath,
        recordCount: csvData.length,
        format: 'csv',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error exporting audit logs to CSV: ${error.message}`);
    }
  }

  /**
   * Export audit logs to PDF
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  static async exportAuditLogsToPDF(options = {}) {
    try {
      const {
        userId = null,
        action = null,
        dateFrom = null,
        dateTo = null,
        resourceType = null,
        includeSummary = true
      } = options;

      const logs = await this.getAuditLogData(options);
      const filename = `audit_logs_export_${new Date().toISOString().split('T')[0]}.pdf`;
      const filepath = await this.generateAuditLogsPDF(logs, filename, options);
      
      return {
        success: true,
        filename,
        filepath,
        recordCount: logs.length,
        format: 'pdf',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error exporting audit logs to PDF: ${error.message}`);
    }
  }

  /**
   * Export anomaly report to PDF
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  static async exportAnomalyReportToPDF(options = {}) {
    try {
      const AnomalyDetection = require('./anomalyDetection');
      const InsightsService = require('./insightsService');
      
      const anomalyReport = await AnomalyDetection.getAnomalyReport();
      const filename = `anomaly_report_${new Date().toISOString().split('T')[0]}.pdf`;
      const filepath = await this.generateAnomalyReportPDF(anomalyReport, filename, options);
      
      return {
        success: true,
        filename,
        filepath,
        anomalyCount: anomalyReport.anomalies.length,
        format: 'pdf',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error exporting anomaly report to PDF: ${error.message}`);
    }
  }

  /**
   * Export activity analytics to PDF
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  static async exportActivityAnalyticsToPDF(options = {}) {
    try {
      const ActivityAnalytics = require('./activityAnalytics');
      
      const analytics = await ActivityAnalytics.getActivityAnalytics(options);
      const filename = `activity_analytics_${new Date().toISOString().split('T')[0]}.pdf`;
      const filepath = await this.generateActivityAnalyticsPDF(analytics, filename, options);
      
      return {
        success: true,
        filename,
        filepath,
        timeRange: analytics.timeRange,
        format: 'pdf',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error exporting activity analytics to PDF: ${error.message}`);
    }
  }

  /**
   * Get evidence data for export
   * @param {Object} options - Query options
   * @returns {Array} Evidence data
   */
  static async getEvidenceData(options) {
    const Evidence = require('../models/Evidence');
    const RiskScoring = require('./riskScoring');
    
    let evidence;
    
    if (options.caseId) {
      evidence = await Evidence.findByCaseId(options.caseId);
    } else {
      evidence = await Evidence.findAll();
    }
    
    // Apply date filters if provided
    if (options.dateFrom || options.dateTo) {
      evidence = this.filterEvidenceByDate(evidence, options.dateFrom, options.dateTo);
    }
    
    // Add risk scores if requested
    if (options.includeRiskScores) {
      evidence = await Promise.all(evidence.map(async (e) => {
        const risk = RiskScoring.calculateEvidenceRisk(e);
        return { ...e, riskScore: risk.score, riskLevel: risk.level };
      }));
    }
    
    return evidence;
  }

  /**
   * Get audit log data for export
   * @param {Object} options - Query options
   * @returns {Array} Audit log data
   */
  static async getAuditLogData(options) {
    const AuditLog = require('../models/AuditLog');
    const User = require('../models/User');
    
    let logs = await AuditLog.findAll();
    
    // Apply filters
    if (options.userId) {
      logs = logs.filter(log => log.user_id === options.userId);
    }
    
    if (options.action) {
      logs = logs.filter(log => log.action === options.action);
    }
    
    if (options.resourceType) {
      logs = logs.filter(log => log.resource_type === options.resourceType);
    }
    
    if (options.dateFrom || options.dateTo) {
      logs = this.filterLogsByDate(logs, options.dateFrom, options.dateTo);
    }
    
    // Add user details
    logs = await Promise.all(logs.map(async (log) => {
      const user = await User.findById(log.user_id);
      return {
        ...log,
        userName: user ? user.name : 'Unknown',
        userEmail: user ? user.email : 'Unknown'
      };
    }));
    
    return logs;
  }

  /**
   * Format evidence data for CSV export
   * @param {Array} evidence - Evidence data
   * @param {Object} options - Export options
   * @returns {Array} Formatted CSV data
   */
  static formatEvidenceForCSV(evidence, options) {
    return evidence.map(e => {
      const row = {
        id: e.id,
        case_id: e.case_id,
        file_name: e.original_name,
        file_type: e.file_type,
        file_size: e.file_size,
        mime_type: e.mime_type,
        collected_at: e.collected_at,
        collected_by: e.collected_by_name || 'Unknown',
        integrity_status: e.integrity_status,
        created_at: e.created_at
      };
      
      if (options.includeRiskScores) {
        row.risk_score = e.riskScore || 0;
        row.risk_level = e.riskLevel || 'unknown';
      }
      
      if (options.includeHashes) {
        row.file_hash_sha256 = e.file_hash_sha256;
      }
      
      if (options.includeMetadata) {
        row.file_path = e.file_path;
        row.last_verified = e.last_verified;
        row.updated_at = e.updated_at;
      }
      
      return row;
    });
  }

  /**
   * Format audit logs for CSV export
   * @param {Array} logs - Audit log data
   * @returns {Array} Formatted CSV data
   */
  static formatAuditLogsForCSV(logs) {
    return logs.map(log => ({
      id: log.id,
      user_id: log.user_id,
      user_name: log.userName,
      user_email: log.userEmail,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      details: log.details,
      created_at: log.created_at
    }));
  }

  /**
   * Generate CSV file
   * @param {Array} data - Data to export
   * @param {string} filename - Filename
   * @returns {string} File path
   */
  static async generateCSVFile(data, filename) {
    try {
      const parser = new Parser();
      const csv = parser.parse(data);
      
      const exportsDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      const filepath = path.join(exportsDir, filename);
      fs.writeFileSync(filepath, csv);
      
      return filepath;
    } catch (error) {
      throw new Error(`Error generating CSV file: ${error.message}`);
    }
  }

  /**
   * Generate PDF file for evidence
   * @param {Array} evidence - Evidence data
   * @param {string} filename - Filename
   * @param {Object} options - Export options
   * @returns {string} File path
   */
  static async generatePDFFile(evidence, filename, options) {
    try {
      const doc = new PDFDocument();
      const exportsDir = path.join(process.cwd(), 'exports');
      
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      const filepath = path.join(exportsDir, filename);
      doc.pipe(fs.createWriteStream(filepath));
      
      // Add content to PDF
      this.addEvidencePDFContent(doc, evidence, options);
      
      doc.end();
      
      return filepath;
    } catch (error) {
      throw new Error(`Error generating PDF file: ${error.message}`);
    }
  }

  /**
   * Add content to evidence PDF
   * @param {PDFDocument} doc - PDF document
   * @param {Array} evidence - Evidence data
   * @param {Object} options - Export options
   */
  static addEvidencePDFContent(doc, evidence, options) {
    // Title
    doc.fontSize(20).text('Evidence Export Report', { align: 'center' });
    doc.moveDown();
    
    // Metadata
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Total Records: ${evidence.length}`);
    
    if (options.caseId) {
      doc.text(`Case ID: ${options.caseId}`);
    }
    
    if (options.dateFrom || options.dateTo) {
      doc.text(`Date Range: ${options.dateFrom || 'All'} to ${options.dateTo || 'All'}`);
    }
    
    doc.moveDown();
    
    // Summary
    if (options.includeRiskScores) {
      const riskSummary = this.calculateRiskSummary(evidence);
      doc.fontSize(14).text('Risk Summary', { underline: true });
      doc.fontSize(10);
      doc.text(`High Risk: ${riskSummary.high}`);
      doc.text(`Medium Risk: ${riskSummary.medium}`);
      doc.text(`Low Risk: ${riskSummary.low}`);
      doc.text(`Minimal Risk: ${riskSummary.minimal}`);
      doc.moveDown();
    }
    
    // Evidence table
    doc.fontSize(14).text('Evidence Details', { underline: true });
    doc.moveDown();
    
    // Table headers
    const headers = ['ID', 'Filename', 'Type', 'Size', 'Collected', 'Status'];
    if (options.includeRiskScores) {
      headers.push('Risk');
    }
    if (options.includeHashes) {
      headers.push('Hash');
    }
    
    // Table data
    const tableData = evidence.map(e => {
      const row = [
        e.id.toString(),
        e.original_name,
        e.file_type,
        this.formatFileSize(e.file_size),
        new Date(e.collected_at).toLocaleDateString(),
        e.integrity_status
      ];
      
      if (options.includeRiskScores) {
        row.push(`${e.riskScore || 0} (${e.riskLevel || 'unknown'})`);
      }
      
      if (options.includeHashes) {
        row.push(e.file_hash_sha256.substring(0, 16) + '...');
      }
      
      return row;
    });
    
    // Draw table
    this.drawTable(doc, headers, tableData);
  }

  /**
   * Generate PDF file for audit logs
   * @param {Array} logs - Audit log data
   * @param {string} filename - Filename
   * @param {Object} options - Export options
   * @returns {string} File path
   */
  static async generateAuditLogsPDF(logs, filename, options) {
    try {
      const doc = new PDFDocument();
      const exportsDir = path.join(process.cwd(), 'exports');
      
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      const filepath = path.join(exportsDir, filename);
      doc.pipe(fs.createWriteStream(filepath));
      
      // Add content to PDF
      this.addAuditLogsPDFContent(doc, logs, options);
      
      doc.end();
      
      return filepath;
    } catch (error) {
      throw new Error(`Error generating audit logs PDF: ${error.message}`);
    }
  }

  /**
   * Add content to audit logs PDF
   * @param {PDFDocument} doc - PDF document
   * @param {Array} logs - Audit log data
   * @param {Object} options - Export options
   */
  static addAuditLogsPDFContent(doc, logs, options) {
    // Title
    doc.fontSize(20).text('Audit Logs Export Report', { align: 'center' });
    doc.moveDown();
    
    // Metadata
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Total Records: ${logs.length}`);
    
    if (options.userId) {
      doc.text(`User ID: ${options.userId}`);
    }
    
    if (options.action) {
      doc.text(`Action: ${options.action}`);
    }
    
    if (options.dateFrom || options.dateTo) {
      doc.text(`Date Range: ${options.dateFrom || 'All'} to ${options.dateTo || 'All'}`);
    }
    
    doc.moveDown();
    
    // Summary
    if (options.includeSummary) {
      const summary = this.calculateAuditLogSummary(logs);
      doc.fontSize(14).text('Activity Summary', { underline: true });
      doc.fontSize(10);
      
      Object.entries(summary.actions).forEach(([action, count]) => {
        doc.text(`${action}: ${count}`);
      });
      
      doc.text(`Unique Users: ${summary.uniqueUsers}`);
      doc.text(`Unique Resources: ${summary.uniqueResources}`);
      doc.moveDown();
    }
    
    // Logs table
    doc.fontSize(14).text('Audit Log Details', { underline: true });
    doc.moveDown();
    
    // Table headers
    const headers = ['Date', 'User', 'Action', 'Resource', 'IP Address'];
    
    // Table data
    const tableData = logs.slice(0, 100).map(log => [
      new Date(log.created_at).toLocaleString(),
      log.userName,
      log.action,
      `${log.resource_type}:${log.resource_id}`,
      log.ip_address
    ]);
    
    // Draw table
    this.drawTable(doc, headers, tableData);
    
    // Note if data was truncated
    if (logs.length > 100) {
      doc.moveDown();
      doc.fontSize(10).text(`Note: Only first 100 records shown. Total records: ${logs.length}`);
    }
  }

  /**
   * Generate PDF file for anomaly report
   * @param {Object} report - Anomaly report data
   * @param {string} filename - Filename
   * @param {Object} options - Export options
   * @returns {string} File path
   */
  static async generateAnomalyReportPDF(report, filename, options) {
    try {
      const doc = new PDFDocument();
      const exportsDir = path.join(process.cwd(), 'exports');
      
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      const filepath = path.join(exportsDir, filename);
      doc.pipe(fs.createWriteStream(filepath));
      
      // Add content to PDF
      this.addAnomalyReportPDFContent(doc, report, options);
      
      doc.end();
      
      return filepath;
    } catch (error) {
      throw new Error(`Error generating anomaly report PDF: ${error.message}`);
    }
  }

  /**
   * Add content to anomaly report PDF
   * @param {PDFDocument} doc - PDF document
   * @param {Object} report - Anomaly report data
   * @param {Object} options - Export options
   */
  static addAnomalyReportPDFContent(doc, report, options) {
    // Title
    doc.fontSize(20).text('Anomaly Detection Report', { align: 'center' });
    doc.moveDown();
    
    // Metadata
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Total Anomalies: ${report.summary.totalAnomalies}`);
    doc.text(`Average Risk Score: ${report.summary.averageRiskScore}`);
    doc.moveDown();
    
    // Summary
    doc.fontSize(14).text('Anomaly Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Critical: ${report.summary.highSeverity}`);
    doc.text(`High: ${report.summary.mediumSeverity}`);
    doc.text(`Medium: ${report.summary.lowSeverity}`);
    doc.text(`Low: ${report.summary.lowSeverity}`);
    doc.moveDown();
    
    // Anomalies by type
    doc.fontSize(14).text('Anomalies by Type', { underline: true });
    doc.fontSize(10);
    Object.entries(report.summary.byType).forEach(([type, count]) => {
      doc.text(`${this.formatAnomalyType(type)}: ${count}`);
    });
    doc.moveDown();
    
    // Top anomalies
    doc.fontSize(14).text('Top Anomalies', { underline: true });
    doc.moveDown();
    
    const topAnomalies = report.anomalies.slice(0, 20);
    topAnomalies.forEach((anomaly, index) => {
      doc.fontSize(12).text(`${index + 1}. ${this.formatAnomalyType(anomaly.type)}`, { underline: true });
      doc.fontSize(10);
      doc.text(`Severity: ${anomaly.severity.toUpperCase()}`);
      doc.text(`Risk Score: ${anomaly.riskScore}`);
      doc.text(`Description: ${anomaly.explanation.substring(0, 200)}...`);
      doc.moveDown();
    });
  }

  /**
   * Generate PDF file for activity analytics
   * @param {Object} analytics - Analytics data
   * @param {string} filename - Filename
   * @param {Object} options - Export options
   * @returns {string} File path
   */
  static async generateActivityAnalyticsPDF(analytics, filename, options) {
    try {
      const doc = new PDFDocument();
      const exportsDir = path.join(process.cwd(), 'exports');
      
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      const filepath = path.join(exportsDir, filename);
      doc.pipe(fs.createWriteStream(filepath));
      
      // Add content to PDF
      this.addActivityAnalyticsPDFContent(doc, analytics, options);
      
      doc.end();
      
      return filepath;
    } catch (error) {
      throw new Error(`Error generating activity analytics PDF: ${error.message}`);
    }
  }

  /**
   * Add content to activity analytics PDF
   * @param {PDFDocument} doc - PDF document
   * @param {Object} analytics - Analytics data
   * @param {Object} options - Export options
   */
  static addActivityAnalyticsPDFContent(doc, analytics, options) {
    // Title
    doc.fontSize(20).text('Activity Analytics Report', { align: 'center' });
    doc.moveDown();
    
    // Metadata
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Time Range: ${analytics.timeRange}`);
    doc.text(`Total Activities: ${analytics.summary.total}`);
    doc.moveDown();
    
    // Activity breakdown
    doc.fontSize(14).text('Activity Breakdown', { underline: true });
    doc.fontSize(10);
    doc.text(`Uploads: ${analytics.summary.uploads} (${analytics.summary.breakdown.uploads}%)`);
    doc.text(`Downloads: ${analytics.summary.downloads} (${analytics.summary.breakdown.downloads}%)`);
    doc.text(`Updates: ${analytics.summary.updates} (${analytics.summary.breakdown.updates}%)`);
    doc.text(`Deletions: ${analytics.summary.deletions} (${analytics.summary.breakdown.deletions}%)`);
    doc.text(`Views: ${analytics.summary.views} (${analytics.summary.breakdown.views}%)`);
    doc.moveDown();
    
    // Top users
    doc.fontSize(14).text('Top Users by Activity', { underline: true });
    doc.moveDown();
    
    analytics.topUsers.slice(0, 10).forEach((user, index) => {
      doc.fontSize(10);
      doc.text(`${index + 1}. ${user.name} (${user.role}): ${user.activityCount} activities`);
    });
    
    // Add new page for top cases
    doc.addPage();
    doc.fontSize(14).text('Top Cases by Activity', { underline: true });
    doc.moveDown();
    
    analytics.topCases.slice(0, 10).forEach((case_, index) => {
      doc.fontSize(10);
      doc.text(`${index + 1}. ${case_.caseNumber}: ${case_.activityCount} activities`);
      doc.text(`   ${case_.title}`);
      doc.moveDown();
    });
  }

  /**
   * Helper methods
   */
  static filterEvidenceByDate(evidence, dateFrom, dateTo) {
    return evidence.filter(e => {
      const date = new Date(e.collected_at);
      if (dateFrom && date < new Date(dateFrom)) return false;
      if (dateTo && date > new Date(dateTo)) return false;
      return true;
    });
  }

  static filterLogsByDate(logs, dateFrom, dateTo) {
    return logs.filter(log => {
      const date = new Date(log.created_at);
      if (dateFrom && date < new Date(dateFrom)) return false;
      if (dateTo && date > new Date(dateTo)) return false;
      return true;
    });
  }

  static calculateRiskSummary(evidence) {
    const summary = {
      high: 0,
      medium: 0,
      low: 0,
      minimal: 0
    };
    
    evidence.forEach(e => {
      const level = e.riskLevel || 'unknown';
      if (summary[level] !== undefined) {
        summary[level]++;
      }
    });
    
    return summary;
  }

  static calculateAuditLogSummary(logs) {
    const summary = {
      actions: {},
      uniqueUsers: new Set(),
      uniqueResources: new Set()
    };
    
    logs.forEach(log => {
      summary.actions[log.action] = (summary.actions[log.action] || 0) + 1;
      summary.uniqueUsers.add(log.user_id);
      summary.uniqueResources.add(`${log.resource_type}:${log.resource_id}`);
    });
    
    summary.uniqueUsers = summary.uniqueUsers.size;
    summary.uniqueResources = summary.uniqueResources.size;
    
    return summary;
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatAnomalyType(type) {
    const types = {
      'duplicate_evidence': 'Duplicate Evidence',
      'cross_case_usage': 'Cross-Case Usage',
      'bulk_upload_pattern': 'Bulk Upload Pattern',
      'rapid_upload_pattern': 'Rapid Upload Pattern'
    };
    return types[type] || type;
  }

  static drawTable(doc, headers, data) {
    const tableTop = doc.y;
    const cellPadding = 5;
    const rowHeight = 20;
    const tableWidth = doc.page.width - 100;
    const columnWidth = tableWidth / headers.length;
    
    // Draw headers
    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, 50 + i * columnWidth, tableTop, { width: columnWidth - cellPadding });
    });
    
    // Draw data rows
    doc.fontSize(8).font('Helvetica');
    data.forEach((row, i) => {
      const y = tableTop + rowHeight + i * rowHeight;
      if (y > doc.page.height - 50) {
        doc.addPage();
        return;
      }
      
      row.forEach((cell, j) => {
        doc.text(cell, 50 + j * columnWidth, y, { width: columnWidth - cellPadding });
      });
    });
  }

  /**
   * Get list of available export files
   * @returns {Array} List of export files
   */
  static async getExportFiles() {
    try {
      const exportsDir = path.join(process.cwd(), 'exports');
      
      if (!fs.existsSync(exportsDir)) {
        return [];
      }
      
      const files = fs.readdirSync(exportsDir);
      const exportFiles = files
        .filter(file => file.endsWith('.csv') || file.endsWith('.pdf'))
        .map(file => {
          const filepath = path.join(exportsDir, file);
          const stats = fs.statSync(filepath);
          
          return {
            filename: file,
            filepath: filepath,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
            type: file.endsWith('.csv') ? 'csv' : 'pdf'
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return exportFiles;
    } catch (error) {
      throw new Error(`Error getting export files: ${error.message}`);
    }
  }

  /**
   * Delete export file
   * @param {string} filename - Filename to delete
   * @returns {boolean} Success status
   */
  static async deleteExportFile(filename) {
    try {
      const exportsDir = path.join(process.cwd(), 'exports');
      const filepath = path.join(exportsDir, filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      
      return false;
    } catch (error) {
      throw new Error(`Error deleting export file: ${error.message}`);
    }
  }

  /**
   * Clean up old export files
   * @param {number} daysOld - Delete files older than this many days
   * @returns {number} Number of files deleted
   */
  static async cleanupOldExports(daysOld = 30) {
    try {
      const files = await this.getExportFiles();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const fileDate = new Date(file.createdAt);
        if (fileDate < cutoffDate) {
          await this.deleteExportFile(file.filename);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      throw new Error(`Error cleaning up old exports: ${error.message}`);
    }
  }
}

module.exports = ExportService;
