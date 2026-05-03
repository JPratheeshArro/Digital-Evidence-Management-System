const AnomalyDetection = require('./anomalyDetection');
const RiskScoring = require('./riskScoring');
const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');

class InsightsService {
  /**
   * Generate comprehensive insights for an anomaly
   * @param {Object} anomaly - Anomaly object
   * @returns {Object} Detailed insights with metadata
   */
  static async generateAnomalyInsights(anomaly) {
    try {
      const insights = {
        anomaly: anomaly,
        metadata: await this.getAnomalyMetadata(anomaly),
        context: await this.getAnomalyContext(anomaly),
        timeline: await this.getAnomalyTimeline(anomaly),
        impact: await this.getAnomalyImpact(anomaly),
        relationships: await this.getAnomalyRelationships(anomaly),
        explanation: this.generateDetailedExplanation(anomaly),
        actionableInsights: this.generateActionableInsights(anomaly),
        visualization: this.generateVisualizationData(anomaly),
        generatedAt: new Date().toISOString()
      };

      return insights;
    } catch (error) {
      throw new Error(`Error generating anomaly insights: ${error.message}`);
    }
  }

  /**
   * Get detailed metadata for an anomaly
   * @param {Object} anomaly - Anomaly object
   * @returns {Object} Metadata
   */
  static async getAnomalyMetadata(anomaly) {
    const metadata = {
      basic: {
        type: anomaly.type,
        severity: anomaly.severity,
        riskScore: anomaly.riskScore,
        detectedAt: anomaly.detectedAt
      },
      technical: {
        hash: anomaly.hash,
        evidenceIds: anomaly.evidenceIds,
        affectedCases: anomaly.affectedCases || anomaly.caseCount
      },
      classification: {
        category: this.getAnomalyCategory(anomaly.type),
        priority: this.getAnomalyPriority(anomaly.severity),
        urgency: this.getAnomalyUrgency(anomaly.riskScore),
        complexity: this.getAnomalyComplexity(anomaly)
      }
    };

    // Add type-specific metadata
    if (anomaly.type === 'duplicate_evidence' || anomaly.type === 'cross_case_usage') {
      metadata.duplicateAnalysis = {
        duplicateCount: anomaly.duplicateCount,
        crossCaseUsage: anomaly.metadata.crossCaseUsage,
        timeSpan: anomaly.metadata.timeSpan,
        uploadFrequency: anomaly.metadata.uploadFrequency
      };
    }

    if (anomaly.type === 'bulk_upload_pattern' || anomaly.type === 'rapid_upload_pattern') {
      metadata.uploadAnalysis = {
        userId: anomaly.userId,
        uploadCount: anomaly.uploadCount,
        timeWindow: anomaly.timeWindow,
        averageInterval: anomaly.metadata.averageInterval,
        fileTypes: anomaly.metadata.fileTypes
      };
    }

    return metadata;
  }

  /**
   * Get context information for an anomaly
   * @param {Object} anomaly - Anomaly object
   * @returns {Object} Context information
   */
  static async getAnomalyContext(anomaly) {
    const context = {
      system: await this.getSystemContext(),
      temporal: await this.getTemporalContext(anomaly),
      user: await this.getUserContext(anomaly),
      case: await this.getCaseContext(anomaly),
      evidence: await this.getEvidenceContext(anomaly)
    };

    return context;
  }

  /**
   * Get timeline for an anomaly
   * @param {Object} anomaly - Anomaly object
   * @returns {Array} Timeline events
   */
  static async getAnomalyTimeline(anomaly) {
    const timeline = [];

    // Get related audit logs
    const auditLogs = await this.getRelatedAuditLogs(anomaly);
    
    // Sort events by timestamp
    const events = auditLogs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    events.forEach(event => {
      timeline.push({
        timestamp: event.created_at,
        type: 'audit_log',
        action: event.action,
        resource: event.resource_type,
        resourceId: event.resource_id,
        userId: event.user_id,
        details: event.details,
        significance: this.getEventSignificance(event, anomaly)
      });
    });

    // Add anomaly detection event
    timeline.push({
      timestamp: anomaly.detectedAt,
      type: 'anomaly_detected',
      action: 'ANOMALY_DETECTED',
      resource: anomaly.type,
      resourceId: anomaly.evidenceIds,
      details: {
        severity: anomaly.severity,
        riskScore: anomaly.riskScore,
        explanation: anomaly.explanation
      },
      significance: 'high'
    });

    return timeline;
  }

  /**
   * Get impact assessment for an anomaly
   * @param {Object} anomaly - Anomaly object
   * @returns {Object} Impact assessment
   */
  static async getAnomalyImpact(anomaly) {
    const impact = {
      overall: this.calculateOverallImpact(anomaly),
      dataIntegrity: this.calculateDataIntegrityImpact(anomaly),
      operational: this.calculateOperationalImpact(anomaly),
      compliance: this.calculateComplianceImpact(anomaly),
      security: this.calculateSecurityImpact(anomaly)
    };

    return impact;
  }

  /**
   * Get relationships between anomalies
   * @param {Object} anomaly - Anomaly object
   * @returns {Object} Relationship analysis
   */
  static async getAnomalyRelationships(anomaly) {
    const relationships = {
      relatedAnomalies: await this.findRelatedAnomalies(anomaly),
      patterns: await this.identifyPatterns(anomaly),
      correlations: await this.findCorrelations(anomaly),
      dependencies: await this.findDependencies(anomaly)
    };

    return relationships;
  }

  /**
   * Generate detailed explanation for an anomaly
   * @param {Object} anomaly - Anomaly object
   * @returns {Object} Detailed explanation
   */
  static generateDetailedExplanation(anomaly) {
    const explanation = {
      summary: anomaly.explanation,
      technical: this.generateTechnicalExplanation(anomaly),
      business: this.generateBusinessExplanation(anomaly),
      risk: this.generateRiskExplanation(anomaly),
      factors: this.identifyContributingFactors(anomaly)
    };

    return explanation;
  }

  /**
   * Generate actionable insights
   * @param {Object} anomaly - Anomaly object
   * @returns {Array} Actionable insights
   */
  static generateActionableInsights(anomaly) {
    const insights = [];

    // Add basic recommendations
    anomaly.recommendations.forEach(rec => {
      insights.push({
        type: 'recommendation',
        priority: this.getInsightPriority(anomaly.severity),
        category: 'immediate_action',
        title: rec,
        description: this.expandRecommendation(rec, anomaly),
        effort: this.estimateEffort(rec),
        impact: this.estimateImpact(rec, anomaly)
      });
    });

    // Add preventive insights
    insights.push(...this.generatePreventiveInsights(anomaly));

    // Add monitoring insights
    insights.push(...this.generateMonitoringInsights(anomaly));

    // Add compliance insights
    insights.push(...this.generateComplianceInsights(anomaly));

    return insights.sort((a, b) => this.getInsightPriorityScore(b.priority) - this.getInsightPriorityScore(a.priority));
  }

  /**
   * Generate visualization data for an anomaly
   * @param {Object} anomaly - Anomaly object
   * @returns {Object} Visualization data
   */
  static generateVisualizationData(anomaly) {
    const visualization = {
      charts: this.generateChartConfigs(anomaly),
      metrics: this.generateMetricConfigs(anomaly),
      timeline: this.generateTimelineConfig(anomaly),
      network: this.generateNetworkConfig(anomaly)
    };

    return visualization;
  }

  /**
   * Helper methods
   */
  static getAnomalyCategory(type) {
    const categories = {
      'duplicate_evidence': 'data_integrity',
      'cross_case_usage': 'evidence_management',
      'bulk_upload_pattern': 'user_behavior',
      'rapid_upload_pattern': 'user_behavior'
    };
    return categories[type] || 'other';
  }

  static getAnomalyPriority(severity) {
    const priorities = {
      'critical': 'P0',
      'high': 'P1',
      'medium': 'P2',
      'low': 'P3'
    };
    return priorities[severity] || 'P4';
  }

  static getAnomalyUrgency(riskScore) {
    if (riskScore >= 80) return 'immediate';
    if (riskScore >= 60) return 'urgent';
    if (riskScore >= 40) return 'normal';
    return 'low';
  }

  static getAnomalyComplexity(anomaly) {
    let complexity = 1;
    
    if (anomaly.affectedCases > 3) complexity += 1;
    if (anomaly.duplicateCount > 5) complexity += 1;
    if (anomaly.type === 'cross_case_usage') complexity += 1;
    if (anomaly.riskScore >= 70) complexity += 1;
    
    if (complexity >= 4) return 'high';
    if (complexity >= 3) return 'medium';
    return 'low';
  }

  static async getSystemContext() {
    try {
      const [evidenceStats, caseStats, userStats] = await Promise.all([
        Evidence.getEvidenceStats(),
        Case.getCaseStats(),
        this.getUserStats()
      ]);

      return {
        totalEvidence: evidenceStats.reduce((sum, stat) => sum + stat.count, 0),
        totalCases: caseStats.total,
        totalUsers: userStats.total,
        systemLoad: this.calculateSystemLoad(),
        recentActivity: await this.getRecentActivityCount()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  static async getTemporalContext(anomaly) {
    const now = new Date();
    const detectedAt = new Date(anomaly.detectedAt);
    
    return {
      detectionTime: detectedAt.toISOString(),
      timeOfDay: detectedAt.getHours(),
      dayOfWeek: detectedAt.getDay(),
      isBusinessHours: detectedAt.getHours() >= 9 && detectedAt.getHours() <= 17,
      isWeekday: detectedAt.getDay() >= 1 && detectedAt.getDay() <= 5,
      relativeTime: this.getRelativeTime(detectedAt, now)
    };
  }

  static async getUserContext(anomaly) {
    if (!anomaly.userId) return null;

    try {
      const userActivity = await this.getUserActivity(anomaly.userId);
      const userRole = await this.getUserRole(anomaly.userId);
      
      return {
        userId: anomaly.userId,
        role: userRole,
        recentActivity: userActivity,
        accessLevel: this.getAccessLevel(userRole),
        behaviorPattern: this.analyzeUserBehavior(userActivity)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  static async getCaseContext(anomaly) {
    const caseIds = anomaly.affectedCases || [];
    
    try {
      const cases = await Promise.all(
        caseIds.map(id => Case.findById(id))
      );

      return {
        affectedCases: cases.filter(c => c).map(c => ({
          id: c.id,
          caseNumber: c.case_number,
          title: c.title,
          status: c.status,
          createdAt: c.created_at
        })),
        caseTypes: this.analyzeCaseTypes(cases.filter(c => c)),
        caseDistribution: this.getCaseDistribution(cases.filter(c => c))
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  static async getEvidenceContext(anomaly) {
    try {
      const evidence = await Promise.all(
        anomaly.evidenceIds.map(id => Evidence.findById(id))
      );

      return {
        affectedEvidence: evidence.filter(e => e).map(e => ({
          id: e.id,
          fileName: e.original_name,
          fileType: e.file_type,
          fileSize: e.file_size,
          uploadedAt: e.collected_at
        })),
        fileTypeDistribution: this.getEvidenceFileTypeDistribution(evidence.filter(e => e)),
        uploadPattern: this.analyzeUploadPattern(evidence.filter(e => e))
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  static async getRelatedAuditLogs(anomaly) {
    try {
      const timeWindow = this.getTimeWindowForAnomaly(anomaly);
      
      let logs = [];
      if (anomaly.type === 'duplicate_evidence' || anomaly.type === 'cross_case_usage') {
        logs = await AuditLog.getEvidenceLogs(anomaly.evidenceIds, timeWindow);
      } else if (anomaly.userId) {
        logs = await AuditLog.getUserLogs(anomaly.userId, timeWindow);
      }

      return logs;
    } catch (error) {
      return [];
    }
  }

  static getTimeWindowForAnomaly(anomaly) {
    // Return appropriate time window based on anomaly type
    if (anomaly.type === 'rapid_upload_pattern') return { hours: 1 };
    if (anomaly.type === 'bulk_upload_pattern') return { hours: 24 };
    return { days: 7 };
  }

  static getEventSignificance(event, anomaly) {
    if (event.action === 'UPLOAD' && anomaly.evidenceIds.includes(event.resource_id)) {
      return 'high';
    }
    if (event.action === 'DELETE' && anomaly.evidenceIds.includes(event.resource_id)) {
      return 'high';
    }
    return 'medium';
  }

  static calculateOverallImpact(anomaly) {
    let score = 0;
    
    if (anomaly.severity === 'critical') score += 40;
    else if (anomaly.severity === 'high') score += 30;
    else if (anomaly.severity === 'medium') score += 20;
    else score += 10;
    
    if (anomaly.affectedCases > 5) score += 20;
    else if (anomaly.affectedCases > 2) score += 10;
    
    if (anomaly.duplicateCount > 10) score += 20;
    else if (anomaly.duplicateCount > 5) score += 10;
    
    if (anomaly.riskScore >= 80) score += 20;
    else if (anomaly.riskScore >= 60) score += 10;
    
    return Math.min(100, score);
  }

  static calculateDataIntegrityImpact(anomaly) {
    if (anomaly.type === 'duplicate_evidence' || anomaly.type === 'cross_case_usage') {
      return anomaly.severity === 'critical' ? 'severe' : 
             anomaly.severity === 'high' ? 'significant' : 'moderate';
    }
    return 'minimal';
  }

  static calculateOperationalImpact(anomaly) {
    if (anomaly.type === 'bulk_upload_pattern' || anomaly.type === 'rapid_upload_pattern') {
      return anomaly.severity === 'critical' ? 'disruptive' : 'noticeable';
    }
    return 'minimal';
  }

  static calculateComplianceImpact(anomaly) {
    if (anomaly.type === 'cross_case_usage' && anomaly.affectedCases > 3) {
      return 'significant';
    }
    return 'minimal';
  }

  static calculateSecurityImpact(anomaly) {
    if (anomaly.type === 'rapid_upload_pattern' && anomaly.riskScore > 70) {
      return 'potential_threat';
    }
    return 'low';
  }

  static generateTechnicalExplanation(anomaly) {
    let explanation = `Technical analysis of ${anomaly.type}: `;
    
    if (anomaly.type === 'duplicate_evidence') {
      explanation += `SHA-256 hash collision detected. ${anomaly.duplicateCount} files share identical hash ${anomaly.hash}. `;
      explanation += `This indicates either identical files or potential data integrity issues.`;
    } else if (anomaly.type === 'cross_case_usage') {
      explanation += `Same file hash used across ${anomaly.caseCount} different cases. `;
      explanation += `This may indicate evidence sharing, contamination, or procedural violations.`;
    } else if (anomaly.type === 'bulk_upload_pattern') {
      explanation += `User ${anomaly.userId} uploaded ${anomaly.uploadCount} files within ${anomaly.timeWindow}. `;
      explanation += `Upload frequency exceeds normal patterns and may indicate automated processes or data migration.`;
    } else if (anomaly.type === 'rapid_upload_pattern') {
      explanation += `Rapid upload sequence detected with ${anomaly.interval} seconds between uploads. `;
      explanation += `This pattern suggests automated uploads or urgent evidence processing.`;
    }
    
    return explanation;
  }

  static generateBusinessExplanation(anomaly) {
    let explanation = `Business impact assessment: `;
    
    if (anomaly.severity === 'critical') {
      explanation += `This anomaly requires immediate management attention and may affect case integrity or compliance requirements.`;
    } else if (anomaly.severity === 'high') {
      explanation += `This anomaly should be reviewed promptly as it may impact evidence handling procedures or case outcomes.`;
    } else {
      explanation += `This anomaly should be monitored and may indicate opportunities for process improvement.`;
    }
    
    return explanation;
  }

  static generateRiskExplanation(anomaly) {
    return `Risk score ${anomaly.riskScore}/100 calculated based on anomaly type, severity, affected resources, and potential impact. ${anomaly.severity} severity level indicates ${this.getAnomalyUrgency(anomaly.riskScore)} action is required.`;
  }

  static identifyContributingFactors(anomaly) {
    const factors = [];
    
    if (anomaly.duplicateCount > 5) {
      factors.push({
        factor: 'high_duplicate_count',
        description: `Large number of duplicates (${anomaly.duplicateCount})`,
        impact: 'high'
      });
    }
    
    if (anomaly.affectedCases > 3) {
      factors.push({
        factor: 'cross_case_impact',
        description: `Affects multiple cases (${anomaly.affectedCases})`,
        impact: 'medium'
      });
    }
    
    if (anomaly.riskScore > 70) {
      factors.push({
        factor: 'high_risk_score',
        description: `High risk score (${anomaly.riskScore})`,
        impact: 'high'
      });
    }
    
    return factors;
  }

  static expandRecommendation(recommendation, anomaly) {
    const expansions = {
      'Immediately review all duplicate files for authenticity': 
        'Conduct thorough verification of all duplicate files to ensure they are legitimate evidence and not system errors or malicious uploads.',
      'Investigate potential data integrity breaches': 
        'Review system logs, user activity, and evidence handling procedures to identify any potential breaches or unauthorized access.',
      'Review evidence handling procedures': 
        'Examine current evidence handling workflows and update them to prevent similar anomalies in the future.',
      'Verify user authorization for bulk uploads': 
        'Confirm that the user has proper authorization for bulk uploads and review their recent activity patterns.',
      'Monitor for continued high-volume uploads': 
        'Set up monitoring alerts for similar upload patterns and review them regularly for potential issues.'
    };
    
    return expansions[recommendation] || recommendation;
  }

  static estimateEffort(recommendation) {
    const efforts = {
      'Immediately review all duplicate files for authenticity': 'high',
      'Investigate potential data integrity breaches': 'high',
      'Review evidence handling procedures': 'medium',
      'Verify user authorization for bulk uploads': 'medium',
      'Monitor for continued high-volume uploads': 'low'
    };
    
    return efforts[recommendation] || 'medium';
  }

  static estimateImpact(recommendation, anomaly) {
    if (anomaly.severity === 'critical') return 'high';
    if (anomaly.severity === 'high') return 'medium';
    return 'low';
  }

  static getInsightPriority(severity) {
    if (severity === 'critical') return 'critical';
    if (severity === 'high') return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  }

  static getInsightPriorityScore(priority) {
    const scores = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return scores[priority] || 0;
  }

  static generatePreventiveInsights(anomaly) {
    const insights = [];
    
    if (anomaly.type === 'duplicate_evidence') {
      insights.push({
        type: 'prevention',
        priority: 'medium',
        category: 'process_improvement',
        title: 'Implement duplicate detection at upload time',
        description: 'Add real-time duplicate detection during file upload to prevent duplicates from being stored.',
        effort: 'medium',
        impact: 'high'
      });
    }
    
    if (anomaly.type === 'cross_case_usage') {
      insights.push({
        type: 'prevention',
        priority: 'medium',
        category: 'policy',
        title: 'Establish cross-case evidence sharing policies',
        description: 'Create clear guidelines for when and how evidence can be shared between cases.',
        effort: 'low',
        impact: 'medium'
      });
    }
    
    return insights;
  }

  static generateMonitoringInsights(anomaly) {
    const insights = [];
    
    insights.push({
      type: 'monitoring',
      priority: 'low',
      category: 'alerting',
      title: 'Set up anomaly monitoring alerts',
      description: 'Configure automated alerts for similar anomalies to enable early detection.',
      effort: 'low',
      impact: 'medium'
    });
    
    return insights;
  }

  static generateComplianceInsights(anomaly) {
    const insights = [];
    
    if (anomaly.type === 'cross_case_usage' && anomaly.affectedCases > 3) {
      insights.push({
        type: 'compliance',
        priority: 'high',
        category: 'audit',
        title: 'Document cross-case evidence usage for compliance',
        description: 'Ensure all cross-case evidence usage is properly documented and justified for audit purposes.',
        effort: 'medium',
        impact: 'high'
      });
    }
    
    return insights;
  }

  // Additional helper methods would be implemented here...
  static async getUserStats() {
    // Implementation for user statistics
    return { total: 0 };
  }

  static calculateSystemLoad() {
    // Implementation for system load calculation
    return 'low';
  }

  static async getRecentActivityCount() {
    // Implementation for recent activity count
    return 0;
  }

  static getRelativeTime(date1, date2) {
    const diff = date2 - date1;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day(s) ago`;
    if (hours > 0) return `${hours} hour(s) ago`;
    return 'Less than an hour ago';
  }

  // Placeholder methods - would need full implementation
  static async getUserActivity(userId) { return []; }
  static async getUserRole(userId) { return 'user'; }
  static getAccessLevel(role) { return 'standard'; }
  static analyzeUserBehavior(activity) { return 'normal'; }
  static analyzeCaseTypes(cases) { return []; }
  static getCaseDistribution(cases) { return {}; }
  static getEvidenceFileTypeDistribution(evidence) { return {}; }
  static analyzeUploadPattern(evidence) { return 'normal'; }
  static async findRelatedAnomalies(anomaly) { return []; }
  static async identifyPatterns(anomaly) { return []; }
  static async findCorrelations(anomaly) { return []; }
  static async findDependencies(anomaly) { return []; }
  static generateChartConfigs(anomaly) { return {}; }
  static generateMetricConfigs(anomaly) { return {}; }
  static generateTimelineConfig(anomaly) { return {}; }
  static generateNetworkConfig(anomaly) { return {}; }
}

module.exports = InsightsService;
