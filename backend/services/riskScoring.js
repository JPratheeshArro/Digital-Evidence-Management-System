class RiskScoring {
  /**
   * Calculate comprehensive risk score for evidence
   * @param {Object} evidence - Evidence object with metadata
   * @returns {Object} Risk assessment with score, level, and badge
   */
  static calculateEvidenceRisk(evidence) {
    let riskScore = 0;
    const factors = [];

    // Factor 1: Duplicate count (0-40 points)
    if (evidence.duplicateCount > 0) {
      const duplicateScore = Math.min(40, evidence.duplicateCount * 8);
      riskScore += duplicateScore;
      factors.push({
        type: 'duplicate_count',
        score: duplicateScore,
        weight: 40,
        description: `${evidence.duplicateCount} duplicate(s) found`
      });
    }

    // Factor 2: Cross-case usage (0-30 points)
    if (evidence.affectedCases > 1) {
      const crossCaseScore = Math.min(30, (evidence.affectedCases - 1) * 15);
      riskScore += crossCaseScore;
      factors.push({
        type: 'cross_case_usage',
        score: crossCaseScore,
        weight: 30,
        description: `Used across ${evidence.affectedCases} cases`
      });
    }

    // Factor 3: File type risk (0-15 points)
    const fileTypeRisk = this.getFileTypeRisk(evidence.file_type);
    riskScore += fileTypeRisk.score;
    factors.push({
      type: 'file_type',
      score: fileTypeRisk.score,
      weight: 15,
      description: `File type: ${evidence.file_type} (${fileTypeRisk.level} risk)`
    });

    // Factor 4: Upload frequency (0-15 points)
    const uploadFrequencyRisk = this.getUploadFrequencyRisk(evidence.uploadFrequency);
    riskScore += uploadFrequencyRisk.score;
    factors.push({
      type: 'upload_frequency',
      score: uploadFrequencyRisk.score,
      weight: 15,
      description: `Upload frequency: ${evidence.uploadFrequency || 'normal'}`
    });

    // Cap at 100
    riskScore = Math.min(100, riskScore);

    const riskLevel = this.getRiskLevel(riskScore);
    const badge = this.getRiskBadge(riskLevel, riskScore);

    return {
      score: riskScore,
      level: riskLevel,
      badge,
      factors,
      explanation: this.generateRiskExplanation(factors, riskLevel),
      recommendations: this.generateRiskRecommendations(factors, riskLevel),
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate risk score for case
   * @param {Object} caseData - Case object with evidence metadata
   * @returns {Object} Risk assessment for the case
   */
  static calculateCaseRisk(caseData) {
    let riskScore = 0;
    const factors = [];

    // Factor 1: Evidence count (0-25 points)
    if (caseData.evidenceCount > 0) {
      const evidenceScore = Math.min(25, caseData.evidenceCount * 2);
      riskScore += evidenceScore;
      factors.push({
        type: 'evidence_count',
        score: evidenceScore,
        weight: 25,
        description: `${caseData.evidenceCount} evidence items`
      });
    }

    // Factor 2: High-risk evidence (0-35 points)
    if (caseData.highRiskEvidenceCount > 0) {
      const highRiskScore = Math.min(35, caseData.highRiskEvidenceCount * 12);
      riskScore += highRiskScore;
      factors.push({
        type: 'high_risk_evidence',
        score: highRiskScore,
        weight: 35,
        description: `${caseData.highRiskEvidenceCount} high-risk evidence items`
      });
    }

    // Factor 3: Case age (0-20 points)
    const ageRisk = this.getCaseAgeRisk(caseData.created_at);
    riskScore += ageRisk.score;
    factors.push({
      type: 'case_age',
      score: ageRisk.score,
      weight: 20,
      description: `Case age: ${ageRisk.description}`
    });

    // Factor 4: Status risk (0-20 points)
    const statusRisk = this.getStatusRisk(caseData.status);
    riskScore += statusRisk.score;
    factors.push({
      type: 'case_status',
      score: statusRisk.score,
      weight: 20,
      description: `Status: ${caseData.status} (${statusRisk.level} risk)`
    });

    riskScore = Math.min(100, riskScore);

    const riskLevel = this.getRiskLevel(riskScore);
    const badge = this.getRiskBadge(riskLevel, riskScore);

    return {
      score: riskScore,
      level: riskLevel,
      badge,
      factors,
      explanation: this.generateCaseRiskExplanation(factors, riskLevel),
      recommendations: this.generateCaseRiskRecommendations(factors, riskLevel),
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Get risk level from score
   * @param {number} score - Risk score (0-100)
   * @returns {string} Risk level
   */
  static getRiskLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'minimal';
  }

  /**
   * Get risk badge with colors and styling
   * @param {string} level - Risk level
   * @param {number} score - Risk score
   * @returns {Object} Badge configuration
   */
  static getRiskBadge(level, score) {
    const badges = {
      critical: {
        color: '#dc2626', // red-600
        bgColor: '#fef2f2', // red-50
        borderColor: '#fca5a5', // red-300
        textColor: '#991b1b', // red-800
        icon: '!',
        label: 'CRITICAL',
        description: `Critical risk (${score}/100)`
      },
      high: {
        color: '#ea580c', // orange-600
        bgColor: '#fff7ed', // orange-50
        borderColor: '#fdba74', // orange-300
        textColor: '#c2410c', // orange-800
        icon: '!',
        label: 'HIGH',
        description: `High risk (${score}/100)`
      },
      medium: {
        color: '#d97706', // amber-600
        bgColor: '#fef3c7', // amber-50
        borderColor: '#fde047', // amber-300
        textColor: '#92400e', // amber-800
        icon: '!',
        label: 'MEDIUM',
        description: `Medium risk (${score}/100)`
      },
      low: {
        color: '#059669', // emerald-600
        bgColor: '#ecfdf5', // emerald-50
        borderColor: '#6ee7b7', // emerald-300
        textColor: '#065f46', // emerald-800
        icon: '!',
        label: 'LOW',
        description: `Low risk (${score}/100)`
      },
      minimal: {
        color: '#10b981', // emerald-500
        bgColor: '#d1fae5', // emerald-100
        borderColor: '#34d399', // emerald-400
        textColor: '#047857', // emerald-700
        icon: '!',
        label: 'MINIMAL',
        description: `Minimal risk (${score}/100)`
      }
    };

    return badges[level] || badges.minimal;
  }

  /**
   * Get file type risk assessment
   * @param {string} fileType - File type
   * @returns {Object} Risk assessment
   */
  static getFileTypeRisk(fileType) {
    const riskLevels = {
      'executable': { score: 15, level: 'high' },
      'archive': { score: 10, level: 'medium' },
      'document': { score: 5, level: 'low' },
      'image': { score: 3, level: 'low' },
      'video': { score: 7, level: 'medium' },
      'audio': { score: 5, level: 'low' },
      'other': { score: 8, level: 'medium' }
    };

    return riskLevels[fileType] || riskLevels.other;
  }

  /**
   * Get upload frequency risk assessment
   * @param {string} frequency - Upload frequency
   * @returns {Object} Risk assessment
   */
  static getUploadFrequencyRisk(frequency) {
    const riskLevels = {
      'instantaneous': { score: 15, level: 'high' },
      'very frequent': { score: 12, level: 'high' },
      'frequent': { score: 8, level: 'medium' },
      'normal': { score: 3, level: 'low' }
    };

    return riskLevels[frequency] || riskLevels.normal;
  }

  /**
   * Get case age risk assessment
   * @param {string} createdAt - Case creation date
   * @returns {Object} Risk assessment
   */
  static getCaseAgeRisk(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    const daysOld = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    if (daysOld > 365) {
      return { score: 20, level: 'high', description: `${daysOld} days old` };
    } else if (daysOld > 180) {
      return { score: 15, level: 'medium', description: `${daysOld} days old` };
    } else if (daysOld > 90) {
      return { score: 10, level: 'medium', description: `${daysOld} days old` };
    } else if (daysOld > 30) {
      return { score: 5, level: 'low', description: `${daysOld} days old` };
    } else {
      return { score: 2, level: 'low', description: `${daysOld} days old` };
    }
  }

  /**
   * Get status risk assessment
   * @param {string} status - Case status
   * @returns {Object} Risk assessment
   */
  static getStatusRisk(status) {
    const riskLevels = {
      'open': { score: 15, level: 'medium' },
      'pending': { score: 10, level: 'medium' },
      'closed': { score: 5, level: 'low' }
    };

    return riskLevels[status] || riskLevels.open;
  }

  /**
   * Generate risk explanation
   * @param {Array} factors - Risk factors
   * @param {string} level - Risk level
   * @returns {string} Explanation
   */
  static generateRiskExplanation(factors, level) {
    const highImpactFactors = factors.filter(f => f.score >= 15);
    const mediumImpactFactors = factors.filter(f => f.score >= 8 && f.score < 15);
    
    let explanation = `Risk assessment calculated based on ${factors.length} factors. `;
    
    if (highImpactFactors.length > 0) {
      explanation += `High impact factors: ${highImpactFactors.map(f => f.description).join(', ')}. `;
    }
    
    if (mediumImpactFactors.length > 0) {
      explanation += `Medium impact factors: ${mediumImpactFactors.map(f => f.description).join(', ')}. `;
    }
    
    if (level === 'critical') {
      explanation += 'This item requires immediate attention due to multiple high-risk factors.';
    } else if (level === 'high') {
      explanation += 'This item poses significant risk and should be reviewed promptly.';
    } else if (level === 'medium') {
      explanation += 'This item has moderate risk factors that should be monitored.';
    } else {
      explanation += 'This item has low risk factors but should be monitored periodically.';
    }
    
    return explanation;
  }

  /**
   * Generate risk recommendations
   * @param {Array} factors - Risk factors
   * @param {string} level - Risk level
   * @returns {Array} Recommendations
   */
  static generateRiskRecommendations(factors, level) {
    const recommendations = [];
    
    // Generate recommendations based on factors
    factors.forEach(factor => {
      switch (factor.type) {
        case 'duplicate_count':
          if (factor.score >= 20) {
            recommendations.push('Investigate duplicate evidence immediately');
            recommendations.push('Review evidence handling procedures');
          } else {
            recommendations.push('Monitor duplicate evidence patterns');
          }
          break;
          
        case 'cross_case_usage':
          if (factor.score >= 20) {
            recommendations.push('Review cross-case evidence usage');
            recommendations.push('Investigate potential evidence contamination');
          } else {
            recommendations.push('Document cross-case evidence justification');
          }
          break;
          
        case 'file_type':
          if (factor.score >= 10) {
            recommendations.push('Review high-risk file types');
            recommendations.push('Ensure proper file validation');
          }
          break;
          
        case 'upload_frequency':
          if (factor.score >= 10) {
            recommendations.push('Investigate rapid upload patterns');
            recommendations.push('Verify user authorization');
          }
          break;
          
        case 'evidence_count':
          if (factor.score >= 15) {
            recommendations.push('Review evidence management for large cases');
          }
          break;
          
        case 'high_risk_evidence':
          recommendations.push('Address high-risk evidence items');
          break;
          
        case 'case_age':
          if (factor.score >= 15) {
            recommendations.push('Consider case closure or escalation');
          }
          break;
          
        case 'case_status':
          if (factor.score >= 10) {
            recommendations.push('Update case status appropriately');
          }
          break;
      }
    });
    
    // Add level-specific recommendations
    if (level === 'critical') {
      recommendations.unshift('Immediate action required');
      recommendations.push('Escalate to management');
    } else if (level === 'high') {
      recommendations.unshift('Prompt attention needed');
      recommendations.push('Schedule review within 24 hours');
    } else if (level === 'medium') {
      recommendations.push('Schedule review within 7 days');
    } else {
      recommendations.push('Monitor periodically');
    }
    
    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Generate case-specific risk explanation
   * @param {Array} factors - Risk factors
   * @param {string} level - Risk level
   * @returns {string} Explanation
   */
  static generateCaseRiskExplanation(factors, level) {
    let explanation = `Case risk assessment based on ${factors.length} factors. `;
    
    const evidenceFactor = factors.find(f => f.type === 'evidence_count');
    const highRiskFactor = factors.find(f => f.type === 'high_risk_evidence');
    const ageFactor = factors.find(f => f.type === 'case_age');
    
    if (evidenceFactor && highRiskFactor) {
      explanation += `Case contains ${evidenceFactor.description} with ${highRiskFactor.description}. `;
    }
    
    if (ageFactor && ageFactor.score >= 15) {
      explanation += `Case is ${ageFactor.description} and may require attention. `;
    }
    
    if (level === 'critical') {
      explanation += 'This case requires immediate management attention.';
    } else if (level === 'high') {
      explanation += 'This case should be prioritized for review.';
    }
    
    return explanation;
  }

  /**
   * Generate case-specific risk recommendations
   * @param {Array} factors - Risk factors
   * @param {string} level - Risk level
   * @returns {Array} Recommendations
   */
  static generateCaseRiskRecommendations(factors, level) {
    const recommendations = [];
    
    factors.forEach(factor => {
      switch (factor.type) {
        case 'evidence_count':
          if (factor.score >= 20) {
            recommendations.push('Consider case splitting or delegation');
            recommendations.push('Review evidence organization');
          }
          break;
          
        case 'high_risk_evidence':
          recommendations.push('Address high-risk evidence items');
          recommendations.push('Review evidence integrity');
          break;
          
        case 'case_age':
          if (factor.score >= 15) {
            recommendations.push('Consider case closure or escalation');
            recommendations.push('Review case progress');
          }
          break;
          
        case 'case_status':
          recommendations.push('Update case status appropriately');
          break;
      }
    });
    
    if (level === 'critical') {
      recommendations.unshift('Immediate management review required');
    } else if (level === 'high') {
      recommendations.unshift('Prioritize case for review');
    }
    
    return [...new Set(recommendations)];
  }

  /**
   * Batch calculate risk scores for multiple items
   * @param {Array} items - Array of evidence or case objects
   * @param {string} type - 'evidence' or 'case'
   * @returns {Array} Array of risk assessments
   */
  static batchCalculateRisk(items, type = 'evidence') {
    return items.map(item => {
      if (type === 'evidence') {
        return this.calculateEvidenceRisk(item);
      } else {
        return this.calculateCaseRisk(item);
      }
    });
  }

  /**
   * Get risk distribution statistics
   * @param {Array} riskAssessments - Array of risk assessments
   * @returns {Object} Risk distribution
   */
  static getRiskDistribution(riskAssessments) {
    const distribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      minimal: 0,
      averageScore: 0,
      totalItems: riskAssessments.length
    };

    let totalScore = 0;
    riskAssessments.forEach(assessment => {
      distribution[assessment.level]++;
      totalScore += assessment.score;
    });

    distribution.averageScore = riskAssessments.length > 0 
      ? (totalScore / riskAssessments.length).toFixed(1)
      : 0;

    return distribution;
  }
}

module.exports = RiskScoring;
