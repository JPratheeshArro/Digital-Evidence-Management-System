const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');

class AnomalyDetection {
  /**
   * Detect duplicate evidence across all cases
   * @returns {Promise<Array>} Array of anomaly detections
   */
  static async detectDuplicateEvidence() {
    try {
      // Get all duplicate groups
      const duplicateGroups = await Evidence.getDuplicateGroups();
      const anomalies = [];

      for (const group of duplicateGroups) {
        // Get all evidence with the same hash
        const duplicates = await Evidence.getDuplicatesByHash(group.file_hash_sha256);
        
        // Calculate severity based on duplicate count and cross-case usage
        const severity = this.calculateSeverity(duplicates.length, duplicates);
        
        // Calculate risk score
        const riskScore = this.calculateRiskScore(duplicates.length, duplicates);
        
        // Get affected cases
        const affectedCases = [...new Set(duplicates.map(d => d.case_id))];
        
        const anomaly = {
          type: 'duplicate_evidence',
          severity,
          riskScore,
          hash: group.file_hash_sha256,
          duplicateCount: duplicates.length,
          affectedCases: affectedCases.length,
          evidenceIds: duplicates.map(d => d.id),
          sampleFilename: group.sample_filename,
          lastUploaded: group.last_uploaded,
          metadata: {
            duplicates: duplicates.map(d => ({
              id: d.id,
              caseId: d.case_id,
              caseNumber: d.case_number,
              filename: d.original_name,
              uploadedAt: d.collected_at,
              uploadedBy: d.collected_by_name
            })),
            crossCaseUsage: affectedCases.length > 1,
            timeSpan: this.calculateTimeSpan(duplicates)
          },
          explanation: this.generateDuplicateExplanation(duplicates, severity),
          recommendations: this.generateDuplicateRecommendations(duplicates, severity),
          detectedAt: new Date().toISOString()
        };

        anomalies.push(anomaly);
      }

      return anomalies.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      throw new Error(`Error detecting duplicate evidence: ${error.message}`);
    }
  }

  /**
   * Detect files used across multiple cases
   * @returns {Promise<Array>} Array of cross-case usage anomalies
   */
  static async detectCrossCaseUsage() {
    try {
      const duplicateGroups = await Evidence.getDuplicateGroups();
      const crossCaseAnomalies = [];

      for (const group of duplicateGroups) {
        const duplicates = await Evidence.getDuplicatesByHash(group.file_hash_sha256);
        const uniqueCases = [...new Set(duplicates.map(d => d.case_id))];
        
        // Only flag if used in multiple cases
        if (uniqueCases.length > 1) {
          const severity = this.calculateCrossCaseSeverity(uniqueCases.length, duplicates.length);
          const riskScore = this.calculateCrossCaseRiskScore(uniqueCases.length, duplicates.length);
          
          const anomaly = {
            type: 'cross_case_usage',
            severity,
            riskScore,
            hash: group.file_hash_sha256,
            caseCount: uniqueCases.length,
            duplicateCount: duplicates.length,
            evidenceIds: duplicates.map(d => d.id),
            sampleFilename: group.sample_filename,
            affectedCases: uniqueCases,
            metadata: {
              cases: duplicates.map(d => ({
                caseId: d.case_id,
                caseNumber: d.case_number,
                caseTitle: d.case_title,
                evidenceId: d.id,
                filename: d.original_name,
                uploadedAt: d.collected_at,
                uploadedBy: d.collected_by_name
              })),
              timeSpan: this.calculateTimeSpan(duplicates),
              uploadFrequency: this.calculateUploadFrequency(duplicates)
            },
            explanation: this.generateCrossCaseExplanation(uniqueCases.length, duplicates.length, severity),
            recommendations: this.generateCrossCaseRecommendations(uniqueCases.length, severity),
            detectedAt: new Date().toISOString()
          };

          crossCaseAnomalies.push(anomaly);
        }
      }

      return crossCaseAnomalies.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      throw new Error(`Error detecting cross-case usage: ${error.message}`);
    }
  }

  /**
   * Detect unusual upload patterns
   * @returns {Promise<Array>} Array of upload pattern anomalies
   */
  static async detectUploadPatterns() {
    try {
      const anomalies = [];
      
      // Get recent uploads (last 24 hours)
      const recentUploads = await this.getRecentUploads(24);
      
      // Detect bulk uploads by same user
      const userUploadGroups = this.groupByUser(recentUploads);
      for (const [userId, uploads] of Object.entries(userUploadGroups)) {
        if (uploads.length > 10) { // More than 10 uploads in 24 hours
          const severity = uploads.length > 50 ? 'high' : uploads.length > 25 ? 'medium' : 'low';
          const riskScore = Math.min(100, uploads.length * 2);
          
          anomalies.push({
            type: 'bulk_upload_pattern',
            severity,
            riskScore,
            userId: parseInt(userId),
            uploadCount: uploads.length,
            timeWindow: '24 hours',
            metadata: {
              uploads: uploads.map(u => ({
                id: u.id,
                filename: u.original_name,
                caseId: u.case_id,
                uploadedAt: u.collected_at
              })),
              averageInterval: this.calculateAverageInterval(uploads),
              fileTypes: this.getFileTypeDistribution(uploads)
            },
            explanation: this.generateBulkUploadExplanation(uploads.length, severity),
            recommendations: this.generateBulkUploadRecommendations(uploads.length, severity),
            detectedAt: new Date().toISOString()
          });
        }
      }

      // Detect rapid uploads (multiple files in short time)
      const rapidUploads = this.detectRapidUploads(recentUploads);
      anomalies.push(...rapidUploads);

      return anomalies.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      throw new Error(`Error detecting upload patterns: ${error.message}`);
    }
  }

  /**
   * Get comprehensive anomaly report
   * @returns {Promise<Object>} Complete anomaly analysis
   */
  static async getAnomalyReport() {
    try {
      const [
        duplicateAnomalies,
        crossCaseAnomalies,
        uploadPatternAnomalies
      ] = await Promise.all([
        this.detectDuplicateEvidence(),
        this.detectCrossCaseUsage(),
        this.detectUploadPatterns()
      ]);

      const allAnomalies = [
        ...duplicateAnomalies,
        ...crossCaseAnomalies,
        ...uploadPatternAnomalies
      ].sort((a, b) => b.riskScore - a.riskScore);

      const summary = {
        totalAnomalies: allAnomalies.length,
        highSeverity: allAnomalies.filter(a => a.severity === 'high').length,
        mediumSeverity: allAnomalies.filter(a => a.severity === 'medium').length,
        lowSeverity: allAnomalies.filter(a => a.severity === 'low').length,
        averageRiskScore: allAnomalies.length > 0 
          ? (allAnomalies.reduce((sum, a) => sum + a.riskScore, 0) / allAnomalies.length).toFixed(1)
          : 0,
        byType: {
          duplicate_evidence: duplicateAnomalies.length,
          cross_case_usage: crossCaseAnomalies.length,
          bulk_upload_pattern: uploadPatternAnomalies.filter(a => a.type === 'bulk_upload_pattern').length,
          rapid_upload_pattern: uploadPatternAnomalies.filter(a => a.type === 'rapid_upload_pattern').length
        }
      };

      return {
        summary,
        anomalies: allAnomalies,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error generating anomaly report: ${error.message}`);
    }
  }

  /**
   * Calculate severity level based on duplicate count and affected cases
   */
  static calculateSeverity(duplicateCount, duplicates) {
    const affectedCases = [...new Set(duplicates.map(d => d.case_id))];
    
    if (duplicateCount >= 10 || affectedCases.length >= 5) return 'high';
    if (duplicateCount >= 5 || affectedCases.length >= 3) return 'medium';
    return 'low';
  }

  /**
   * Calculate risk score (0-100)
   */
  static calculateRiskScore(duplicateCount, duplicates) {
    const affectedCases = [...new Set(duplicates.map(d => d.case_id))];
    const timeSpan = this.calculateTimeSpan(duplicates);
    
    let score = 0;
    
    // Base score from duplicate count
    score += Math.min(50, duplicateCount * 5);
    
    // Additional score from cross-case usage
    score += Math.min(30, affectedCases.length * 10);
    
    // Additional score from rapid uploads
    if (timeSpan.hours < 1) score += 20;
    else if (timeSpan.hours < 24) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Calculate cross-case severity
   */
  static calculateCrossCaseSeverity(caseCount, duplicateCount) {
    if (caseCount >= 5 || duplicateCount >= 10) return 'high';
    if (caseCount >= 3 || duplicateCount >= 5) return 'medium';
    return 'low';
  }

  /**
   * Calculate cross-case risk score
   */
  static calculateCrossCaseRiskScore(caseCount, duplicateCount) {
    let score = 0;
    score += Math.min(40, caseCount * 15);
    score += Math.min(40, duplicateCount * 4);
    score += Math.min(20, caseCount * duplicateCount / 2);
    return Math.min(100, score);
  }

  /**
   * Calculate time span between uploads
   */
  static calculateTimeSpan(duplicates) {
    if (duplicates.length < 2) return { hours: 0, days: 0 };
    
    const dates = duplicates.map(d => new Date(d.collected_at)).sort((a, b) => a - b);
    const diffMs = dates[dates.length - 1] - dates[0];
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;
    
    return { hours: Math.round(diffHours), days: Math.round(diffDays) };
  }

  /**
   * Generate explanation for duplicate evidence
   */
  static generateDuplicateExplanation(duplicates, severity) {
    const affectedCases = [...new Set(duplicates.map(d => d.case_id))];
    const timeSpan = this.calculateTimeSpan(duplicates);
    
    let explanation = `Detected ${duplicates.length} duplicate files with identical SHA-256 hash across ${affectedCases.length} case${affectedCases.length > 1 ? 's' : ''}.`;
    
    if (timeSpan.hours < 1) {
      explanation += ' These duplicates were uploaded within the same hour, indicating potential systematic issues.';
    } else if (timeSpan.days < 1) {
      explanation += ` These duplicates were uploaded within ${timeSpan.hours} hours.`;
    } else {
      explanation += ` These duplicates were uploaded over ${timeSpan.days} days.`;
    }
    
    if (severity === 'high') {
      explanation += ' This pattern requires immediate attention as it may indicate data integrity issues or procedural violations.';
    }
    
    return explanation;
  }

  /**
   * Generate recommendations for duplicate evidence
   */
  static generateDuplicateRecommendations(duplicates, severity) {
    const recommendations = [];
    
    if (severity === 'high') {
      recommendations.push('Immediately review all duplicate files for authenticity');
      recommendations.push('Investigate potential data integrity breaches');
      recommendations.push('Consider implementing stricter upload validation');
    } else if (severity === 'medium') {
      recommendations.push('Review duplicate files to determine necessity');
      recommendations.push('Update evidence handling procedures');
    } else {
      recommendations.push('Monitor for additional duplicates');
      recommendations.push('Consider consolidating duplicate evidence');
    }
    
    recommendations.push('Document the reason for duplicate uploads');
    recommendations.push('Train staff on evidence handling best practices');
    
    return recommendations;
  }

  /**
   * Generate explanation for cross-case usage
   */
  static generateCrossCaseExplanation(caseCount, duplicateCount, severity) {
    let explanation = `The same file (SHA-256 hash) is being used across ${caseCount} different cases with ${duplicateCount} total uploads. `;
    
    if (caseCount >= 5) {
      explanation += 'This is highly unusual and may indicate evidence contamination or improper evidence handling.';
    } else if (caseCount >= 3) {
      explanation += 'This pattern is concerning and requires investigation.';
    } else {
      explanation += 'This pattern should be reviewed for appropriateness.';
    }
    
    return explanation;
  }

  /**
   * Generate recommendations for cross-case usage
   */
  static generateCrossCaseRecommendations(caseCount, severity) {
    const recommendations = [];
    
    if (severity === 'high') {
      recommendations.push('Immediate investigation required for evidence cross-contamination');
      recommendations.push('Review evidence handling procedures');
      recommendations.push('Consider chain of custody implications');
    } else if (severity === 'medium') {
      recommendations.push('Review the appropriateness of cross-case evidence usage');
      recommendations.push('Document justification for shared evidence');
    } else {
      recommendations.push('Monitor cross-case usage patterns');
      recommendations.push('Ensure proper documentation for shared evidence');
    }
    
    return recommendations;
  }

  /**
   * Generate explanation for bulk uploads
   */
  static generateBulkUploadExplanation(uploadCount, severity) {
    let explanation = `Detected ${uploadCount} file uploads by a single user within 24 hours. `;
    
    if (uploadCount > 50) {
      explanation += 'This volume of uploads is exceptionally high and may indicate automated uploads or data migration activity.';
    } else if (uploadCount > 25) {
      explanation += 'This is a high volume of uploads that may require review.';
    } else {
      explanation += 'This upload volume should be monitored.';
    }
    
    return explanation;
  }

  /**
   * Generate recommendations for bulk uploads
   */
  static generateBulkUploadRecommendations(uploadCount, severity) {
    const recommendations = [];
    
    if (severity === 'high') {
      recommendations.push('Verify user authorization for bulk uploads');
      recommendations.push('Review uploaded files for appropriateness');
      recommendations.push('Consider implementing bulk upload approval workflow');
    } else if (severity === 'medium') {
      recommendations.push('Review upload patterns with the user');
      recommendations.push('Monitor for continued high-volume uploads');
    } else {
      recommendations.push('Continue monitoring upload patterns');
    }
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  static async getRecentUploads(hours = 24) {
    const pool = require('../config/database');
    const [rows] = await pool.execute(`
      SELECT e.*, c.case_number, u.name as uploaded_by_name
      FROM evidence e
      JOIN cases c ON e.case_id = c.id
      JOIN users u ON e.collected_by = u.id
      WHERE e.collected_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      ORDER BY e.collected_at DESC
    `, [hours]);
    return rows;
  }

  static groupByUser(uploads) {
    return uploads.reduce((groups, upload) => {
      const userId = upload.collected_by.toString();
      if (!groups[userId]) groups[userId] = [];
      groups[userId].push(upload);
      return groups;
    }, {});
  }

  static calculateAverageInterval(uploads) {
    if (uploads.length < 2) return 0;
    
    const sortedUploads = uploads.sort((a, b) => new Date(a.collected_at) - new Date(b.collected_at));
    let totalInterval = 0;
    
    for (let i = 1; i < sortedUploads.length; i++) {
      const interval = new Date(sortedUploads[i].collected_at) - new Date(sortedUploads[i-1].collected_at);
      totalInterval += interval;
    }
    
    return totalInterval / (uploads.length - 1) / (1000 * 60); // Convert to minutes
  }

  static getFileTypeDistribution(uploads) {
    return uploads.reduce((distribution, upload) => {
      distribution[upload.file_type] = (distribution[upload.file_type] || 0) + 1;
      return distribution;
    }, {});
  }

  static detectRapidUploads(uploads) {
    const anomalies = [];
    const userGroups = this.groupByUser(uploads);
    
    for (const [userId, userUploads] of Object.entries(userGroups)) {
      const sortedUploads = userUploads.sort((a, b) => new Date(a.collected_at) - new Date(b.collected_at));
      
      for (let i = 1; i < sortedUploads.length; i++) {
        const interval = (new Date(sortedUploads[i].collected_at) - new Date(sortedUploads[i-1].collected_at)) / (1000 * 60); // minutes
        
        if (interval < 1) { // Less than 1 minute between uploads
          const severity = interval < 10 ? 'high' : 'medium';
          const riskScore = interval < 10 ? 80 : 60;
          
          anomalies.push({
            type: 'rapid_upload_pattern',
            severity,
            riskScore,
            userId: parseInt(userId),
            interval: Math.round(interval * 60), // Convert to seconds
            evidenceIds: [sortedUploads[i-1].id, sortedUploads[i].id],
            metadata: {
              uploads: [
                {
                  id: sortedUploads[i-1].id,
                  filename: sortedUploads[i-1].original_name,
                  uploadedAt: sortedUploads[i-1].collected_at
                },
                {
                  id: sortedUploads[i].id,
                  filename: sortedUploads[i].filename,
                  uploadedAt: sortedUploads[i].collected_at
                }
              ]
            },
            explanation: `Rapid upload pattern detected: files uploaded ${Math.round(interval * 60)} seconds apart. This may indicate automated uploads or urgent evidence processing.`,
            recommendations: interval < 10 
              ? ['Verify automated upload authorization', 'Review evidence handling urgency']
              : ['Monitor upload patterns', 'Ensure proper evidence documentation'],
            detectedAt: new Date().toISOString()
          });
        }
      }
    }
    
    return anomalies;
  }

  static calculateUploadFrequency(duplicates) {
    const timeSpan = this.calculateTimeSpan(duplicates);
    if (timeSpan.hours === 0) return 'instantaneous';
    if (timeSpan.hours < 1) return 'very frequent';
    if (timeSpan.hours < 24) return 'frequent';
    return 'normal';
  }
}

module.exports = AnomalyDetection;
