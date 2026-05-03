const AuditLog = require('../models/AuditLog');
const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const User = require('../models/User');

class ActivityAnalytics {
  /**
   * Get comprehensive activity analytics for dashboard
   * @param {Object} options - Analytics options
   * @returns {Object} Activity analytics data
   */
  static async getActivityAnalytics(options = {}) {
    try {
      const {
        timeRange = '7d', // 1d, 7d, 30d, 90d
        includeDetails = false,
        userId = null,
        caseId = null
      } = options;

      const timeFilter = this.getTimeFilter(timeRange);

      const [
        activitySummary,
        activityTimeline,
        topUsers,
        topCases,
        activityByType,
        activityByHour,
        recentActivity,
        trends
      ] = await Promise.all([
        this.getActivitySummary(timeFilter, userId, caseId),
        this.getActivityTimeline(timeFilter, userId, caseId),
        this.getTopUsers(timeFilter),
        this.getTopCases(timeFilter),
        this.getActivityByType(timeFilter, userId, caseId),
        this.getActivityByHour(timeFilter, userId, caseId),
        this.getRecentActivity(timeFilter, includeDetails),
        this.getActivityTrends(timeFilter, userId, caseId)
      ]);

      return {
        summary: activitySummary,
        timeline: activityTimeline,
        topUsers,
        topCases,
        activityByType,
        activityByHour,
        recentActivity,
        trends,
        timeRange,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error generating activity analytics: ${error.message}`);
    }
  }

  /**
   * Get activity summary with counts and percentages
   * @param {Object} timeFilter - Time filter object
   * @param {number|null} userId - Optional user filter
   * @param {number|null} caseId - Optional case filter
   * @returns {Object} Activity summary
   */
  static async getActivitySummary(timeFilter, userId = null, caseId = null) {
    try {
      const baseQuery = this.buildBaseQuery(timeFilter, userId, caseId);
      
      const [totalActivities, uploads, downloads, updates, deletions, views] = await Promise.all([
        this.getTotalActivities(baseQuery),
        this.getUploadCount(baseQuery),
        this.getDownloadCount(baseQuery),
        this.getUpdateCount(baseQuery),
        this.getDeleteCount(baseQuery),
        this.getViewCount(baseQuery)
      ]);

      const summary = {
        total: totalActivities,
        uploads: uploads,
        downloads: downloads,
        updates: updates,
        deletions: deletions,
        views: views,
        breakdown: {
          uploads: this.calculatePercentage(uploads, totalActivities),
          downloads: this.calculatePercentage(downloads, totalActivities),
          updates: this.calculatePercentage(updates, totalActivities),
          deletions: this.calculatePercentage(deletions, totalActivities),
          views: this.calculatePercentage(views, totalActivities)
        },
        growth: await this.getActivityGrowth(baseQuery),
        efficiency: this.calculateEfficiency(uploads, updates, deletions)
      };

      return summary;
    } catch (error) {
      throw new Error(`Error getting activity summary: ${error.message}`);
    }
  }

  /**
   * Get activity timeline data
   * @param {Object} timeFilter - Time filter object
   * @param {number|null} userId - Optional user filter
   * @param {number|null} caseId - Optional case filter
   * @returns {Array} Timeline data
   */
  static async getActivityTimeline(timeFilter, userId = null, caseId = null) {
    try {
      const pool = require('../config/database');
      const query = this.buildTimelineQuery(timeFilter, userId, caseId);
      
      const [rows] = await pool.execute(query);
      
      return rows.map(row => ({
        date: row.date,
        uploads: parseInt(row.uploads) || 0,
        downloads: parseInt(row.downloads) || 0,
        updates: parseInt(row.updates) || 0,
        deletions: parseInt(row.deletions) || 0,
        views: parseInt(row.views) || 0,
        total: parseInt(row.total) || 0
      }));
    } catch (error) {
      throw new Error(`Error getting activity timeline: ${error.message}`);
    }
  }

  /**
   * Get top users by activity
   * @param {Object} timeFilter - Time filter object
   * @returns {Array} Top users data
   */
  static async getTopUsers(timeFilter) {
    try {
      const pool = require('../config/database');
      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          COUNT(al.id) as activity_count,
          COUNT(DISTINCT al.action) as action_types,
          MAX(al.created_at) as last_activity
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.created_at >= ?
        GROUP BY u.id, u.name, u.email, u.role
        ORDER BY activity_count DESC
        LIMIT 10
      `;
      
      const [rows] = await pool.execute(query, [timeFilter.startDate]);
      
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        activityCount: parseInt(row.activity_count),
        actionTypes: parseInt(row.action_types),
        lastActivity: row.last_activity,
        efficiency: this.calculateUserEfficiency(row.id, timeFilter)
      }));
    } catch (error) {
      throw new Error(`Error getting top users: ${error.message}`);
    }
  }

  /**
   * Get top cases by activity
   * @param {Object} timeFilter - Time filter object
   * @returns {Array} Top cases data
   */
  static async getTopCases(timeFilter) {
    try {
      const pool = require('../config/database');
      const query = `
        SELECT 
          c.id,
          c.case_number,
          c.title,
          c.status,
          COUNT(al.id) as activity_count,
          COUNT(DISTINCT al.user_id) as unique_users,
          COUNT(DISTINCT al.action) as action_types,
          MAX(al.created_at) as last_activity
        FROM audit_logs al
        JOIN cases c ON al.resource_id = c.id AND al.resource_type = 'case'
        WHERE al.created_at >= ?
        GROUP BY c.id, c.case_number, c.title, c.status
        ORDER BY activity_count DESC
        LIMIT 10
      `;
      
      const [rows] = await pool.execute(query, [timeFilter.startDate]);
      
      return rows.map(row => ({
        id: row.id,
        caseNumber: row.case_number,
        title: row.title,
        status: row.status,
        activityCount: parseInt(row.activity_count),
        uniqueUsers: parseInt(row.unique_users),
        actionTypes: parseInt(row.action_types),
        lastActivity: row.last_activity,
        riskLevel: this.calculateCaseRiskLevel(row.id)
      }));
    } catch (error) {
      throw new Error(`Error getting top cases: ${error.message}`);
    }
  }

  /**
   * Get activity breakdown by type
   * @param {Object} timeFilter - Time filter object
   * @param {number|null} userId - Optional user filter
   * @param {number|null} caseId - Optional case filter
   * @returns {Array} Activity by type data
   */
  static async getActivityByType(timeFilter, userId = null, caseId = null) {
    try {
      const pool = require('../config/database');
      let query = `
        SELECT 
          action,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT resource_id) as unique_resources
        FROM audit_logs
        WHERE created_at >= ?
      `;
      
      const params = [timeFilter.startDate];
      
      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }
      
      if (caseId) {
        query += ' AND resource_id = ?';
        params.push(caseId);
      }
      
      query += ' GROUP BY action ORDER BY count DESC';
      
      const [rows] = await pool.execute(query, params);
      
      return rows.map(row => ({
        action: row.action,
        count: parseInt(row.count),
        uniqueUsers: parseInt(row.unique_users),
        uniqueResources: parseInt(row.unique_resources),
        percentage: 0 // Will be calculated after getting total
      }));
    } catch (error) {
      throw new Error(`Error getting activity by type: ${error.message}`);
    }
  }

  /**
   * Get activity by hour of day
   * @param {Object} timeFilter - Time filter object
   * @param {number|null} userId - Optional user filter
   * @param {number|null} caseId - Optional case filter
   * @returns {Array} Activity by hour data
   */
  static async getActivityByHour(timeFilter, userId = null, caseId = null) {
    try {
      const pool = require('../config/database');
      let query = `
        SELECT 
          HOUR(created_at) as hour,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM audit_logs
        WHERE created_at >= ?
      `;
      
      const params = [timeFilter.startDate];
      
      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }
      
      if (caseId) {
        query += ' AND resource_id = ?';
        params.push(caseId);
      }
      
      query += ' GROUP BY HOUR(created_at) ORDER BY hour';
      
      const [rows] = await pool.execute(query, params);
      
      // Fill in missing hours with 0
      const hourlyData = [];
      for (let i = 0; i < 24; i++) {
        const found = rows.find(row => parseInt(row.hour) === i);
        hourlyData.push({
          hour: i,
          count: found ? parseInt(found.count) : 0,
          uniqueUsers: found ? parseInt(found.unique_users) : 0
        });
      }
      
      return hourlyData;
    } catch (error) {
      throw new Error(`Error getting activity by hour: ${error.message}`);
    }
  }

  /**
   * Get recent activity logs
   * @param {Object} timeFilter - Time filter object
   * @param {boolean} includeDetails - Include detailed information
   * @returns {Array} Recent activity data
   */
  static async getRecentActivity(timeFilter, includeDetails = false) {
    try {
      const pool = require('../config/database');
      let query = `
        SELECT 
          al.id,
          al.action,
          al.resource_type,
          al.resource_id,
          al.ip_address,
          al.user_agent,
          al.created_at,
          u.name as user_name,
          u.email as user_email,
          u.role as user_role
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.created_at >= ?
        ORDER BY al.created_at DESC
        LIMIT ?
      `;
      
      const limit = includeDetails ? 50 : 20;
      const [rows] = await pool.execute(query, [timeFilter.startDate, limit]);
      
      const activities = rows.map(row => ({
        id: row.id,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        ipAddress: row.ip_address,
        userAgent: row.userAgent,
        createdAt: row.created_at,
        user: {
          name: row.user_name,
          email: row.user_email,
          role: row.user_role
        }
      }));

      // Add resource details if requested
      if (includeDetails) {
        for (const activity of activities) {
          activity.resourceDetails = await this.getResourceDetails(
            activity.resourceType,
            activity.resourceId
          );
        }
      }

      return activities;
    } catch (error) {
      throw new Error(`Error getting recent activity: ${error.message}`);
    }
  }

  /**
   * Get activity trends
   * @param {Object} timeFilter - Time filter object
   * @param {number|null} userId - Optional user filter
   * @param {number|null} caseId - Optional case filter
   * @returns {Object} Activity trends
   */
  static async getActivityTrends(timeFilter, userId = null, caseId = null) {
    try {
      const currentPeriod = await this.getPeriodActivity(timeFilter, userId, caseId);
      const previousPeriod = await this.getPreviousPeriodActivity(timeFilter, userId, caseId);
      
      const trends = {
        overall: this.calculateTrend(currentPeriod.total, previousPeriod.total),
        uploads: this.calculateTrend(currentPeriod.uploads, previousPeriod.uploads),
        downloads: this.calculateTrend(currentPeriod.downloads, previousPeriod.downloads),
        updates: this.calculateTrend(currentPeriod.updates, previousPeriod.updates),
        deletions: this.calculateTrend(currentPeriod.deletions, previousPeriod.deletions),
        views: this.calculateTrend(currentPeriod.views, previousPeriod.views)
      };

      return trends;
    } catch (error) {
      throw new Error(`Error getting activity trends: ${error.message}`);
    }
  }

  /**
   * Get real-time activity metrics
   * @returns {Object} Real-time metrics
   */
  static async getRealTimeMetrics() {
    try {
      const now = new Date();
      const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
      
      const [
        recent5Min,
        recentHour,
        activeUsers,
        systemStatus
      ] = await Promise.all([
        this.getRecentActivityCount(last5Minutes),
        this.getRecentActivityCount(lastHour),
        this.getActiveUsersCount(last5Minutes),
        this.getSystemStatus()
      ]);

      return {
        last5Minutes: recent5Min,
        lastHour: recentHour,
        activeUsers: activeUsers,
        systemStatus: systemStatus,
        timestamp: now.toISOString()
      };
    } catch (error) {
      throw new Error(`Error getting real-time metrics: ${error.message}`);
    }
  }

  /**
   * Get user-specific activity analytics
   * @param {number} userId - User ID
   * @param {Object} options - Analytics options
   * @returns {Object} User activity analytics
   */
  static async getUserActivityAnalytics(userId, options = {}) {
    try {
      const baseOptions = { ...options, userId };
      const analytics = await this.getActivityAnalytics(baseOptions);
      
      // Add user-specific metrics
      const userMetrics = await this.getUserSpecificMetrics(userId, options.timeRange || '7d');
      
      return {
        ...analytics,
        userMetrics,
        userEfficiency: this.calculateUserEfficiency(userId, this.getTimeFilter(options.timeRange || '7d')),
        userPatterns: await this.analyzeUserPatterns(userId, options.timeRange || '7d')
      };
    } catch (error) {
      throw new Error(`Error getting user activity analytics: ${error.message}`);
    }
  }

  /**
   * Get case-specific activity analytics
   * @param {number} caseId - Case ID
   * @param {Object} options - Analytics options
   * @returns {Object} Case activity analytics
   */
  static async getCaseActivityAnalytics(caseId, options = {}) {
    try {
      const baseOptions = { ...options, caseId };
      const analytics = await this.getActivityAnalytics(baseOptions);
      
      // Add case-specific metrics
      const caseMetrics = await this.getCaseSpecificMetrics(caseId, options.timeRange || '7d');
      
      return {
        ...analytics,
        caseMetrics,
        caseRiskLevel: this.calculateCaseRiskLevel(caseId),
        caseTimeline: await this.getCaseActivityTimeline(caseId, options.timeRange || '7d')
      };
    } catch (error) {
      throw new Error(`Error getting case activity analytics: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */
  static getTimeFilter(timeRange) {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      timeRange
    };
  }

  static buildBaseQuery(timeFilter, userId = null, caseId = null) {
    return { timeFilter, userId, caseId };
  }

  static async getTotalActivities(baseQuery) {
    const pool = require('../config/database');
    let query = 'SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= ?';
    const params = [baseQuery.timeFilter.startDate];
    
    if (baseQuery.userId) {
      query += ' AND user_id = ?';
      params.push(baseQuery.userId);
    }
    
    if (baseQuery.caseId) {
      query += ' AND resource_id = ?';
      params.push(baseQuery.caseId);
    }
    
    const [rows] = await pool.execute(query, params);
    return parseInt(rows[0].count);
  }

  static async getUploadCount(baseQuery) {
    return this.getActionCount(baseQuery, 'UPLOAD');
  }

  static async getDownloadCount(baseQuery) {
    return this.getActionCount(baseQuery, 'DOWNLOAD');
  }

  static async getUpdateCount(baseQuery) {
    return this.getActionCount(baseQuery, 'UPDATE');
  }

  static async getDeleteCount(baseQuery) {
    return this.getActionCount(baseQuery, 'DELETE');
  }

  static async getViewCount(baseQuery) {
    return this.getActionCount(baseQuery, 'VIEW');
  }

  static async getActionCount(baseQuery, action) {
    const pool = require('../config/database');
    let query = 'SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= ? AND action = ?';
    const params = [baseQuery.timeFilter.startDate, action];
    
    if (baseQuery.userId) {
      query += ' AND user_id = ?';
      params.push(baseQuery.userId);
    }
    
    if (baseQuery.caseId) {
      query += ' AND resource_id = ?';
      params.push(baseQuery.caseId);
    }
    
    const [rows] = await pool.execute(query, params);
    return parseInt(rows[0].count);
  }

  static calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  static calculateEfficiency(uploads, updates, deletions) {
    const total = uploads + updates + deletions;
    if (total === 0) return 100;
    
    // Efficiency based on ratio of productive actions (uploads) to destructive actions (deletions)
    const efficiency = ((uploads + updates) / total) * 100;
    return Math.round(efficiency);
  }

  static async getActivityGrowth(baseQuery) {
    // Implementation for activity growth calculation
    return { percentage: 0, trend: 'stable' };
  }

  static buildTimelineQuery(timeFilter, userId = null, caseId = null) {
    let query = `
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN action = 'UPLOAD' THEN 1 ELSE 0 END) as uploads,
        SUM(CASE WHEN action = 'DOWNLOAD' THEN 1 ELSE 0 END) as downloads,
        SUM(CASE WHEN action = 'UPDATE' THEN 1 ELSE 0 END) as updates,
        SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) as deletions,
        SUM(CASE WHEN action = 'VIEW' THEN 1 ELSE 0 END) as views,
        COUNT(*) as total
      FROM audit_logs
      WHERE created_at >= ?
    `;
    
    const params = [timeFilter.startDate];
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    if (caseId) {
      query += ' AND resource_id = ?';
      params.push(caseId);
    }
    
    query += ' GROUP BY DATE(created_at) ORDER BY date';
    
    return { query, params };
  }

  static async calculateUserEfficiency(userId, timeFilter) {
    // Implementation for user efficiency calculation
    return 85; // Placeholder
  }

  static async calculateCaseRiskLevel(caseId) {
    // Implementation for case risk level calculation
    return 'medium'; // Placeholder
  }

  static async getResourceDetails(resourceType, resourceId) {
    try {
      switch (resourceType) {
        case 'evidence':
          return await Evidence.findById(resourceId);
        case 'case':
          return await Case.findById(resourceId);
        case 'user':
          return await User.findById(resourceId);
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  static async getPeriodActivity(timeFilter, userId = null, caseId = null) {
    const baseQuery = this.buildBaseQuery(timeFilter, userId, caseId);
    
    const [uploads, downloads, updates, deletions, views] = await Promise.all([
      this.getUploadCount(baseQuery),
      this.getDownloadCount(baseQuery),
      this.getUpdateCount(baseQuery),
      this.getDeleteCount(baseQuery),
      this.getViewCount(baseQuery)
    ]);

    return {
      uploads,
      downloads,
      updates,
      deletions,
      views,
      total: uploads + downloads + updates + deletions + views
    };
  }

  static async getPreviousPeriodActivity(timeFilter, userId = null, caseId = null) {
    // Calculate previous period based on current time range
    const currentStart = new Date(timeFilter.startDate);
    const currentEnd = new Date(timeFilter.endDate);
    const duration = currentEnd - currentStart;
    
    const previousEnd = currentStart;
    const previousStart = new Date(currentStart.getTime() - duration);
    
    const previousTimeFilter = {
      startDate: previousStart.toISOString(),
      endDate: previousEnd.toISOString(),
      timeRange: timeFilter.timeRange
    };
    
    return this.getPeriodActivity(previousTimeFilter, userId, caseId);
  }

  static calculateTrend(current, previous) {
    if (previous === 0) {
      return current > 0 ? { percentage: 100, direction: 'up' } : { percentage: 0, direction: 'stable' };
    }
    
    const percentage = ((current - previous) / previous) * 100;
    const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable';
    
    return {
      percentage: Math.round(Math.abs(percentage)),
      direction,
      change: current - previous
    };
  }

  static async getRecentActivityCount(since) {
    const pool = require('../config/database');
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= ?',
      [since.toISOString()]
    );
    return parseInt(rows[0].count);
  }

  static async getActiveUsersCount(since) {
    const pool = require('../config/database');
    const [rows] = await pool.execute(
      'SELECT COUNT(DISTINCT user_id) as count FROM audit_logs WHERE created_at >= ?',
      [since.toISOString()]
    );
    return parseInt(rows[0].count);
  }

  static async getSystemStatus() {
    // Implementation for system status
    return {
      status: 'healthy',
      cpu: 45,
      memory: 62,
      disk: 78
    };
  }

  static async getUserSpecificMetrics(userId, timeRange) {
    // Implementation for user-specific metrics
    return {
      avgDailyActivity: 12,
      peakActivityHour: 14,
      preferredActions: ['UPLOAD', 'VIEW'],
      efficiency: 85
    };
  }

  static async analyzeUserPatterns(userId, timeRange) {
    // Implementation for user pattern analysis
    return {
      consistency: 'high',
      predictability: 'medium',
      riskLevel: 'low'
    };
  }

  static async getCaseSpecificMetrics(caseId, timeRange) {
    // Implementation for case-specific metrics
    return {
      evidenceGrowthRate: 0.15,
      userEngagement: 'high',
      resolutionSpeed: 'medium'
    };
  }

  static async getCaseActivityTimeline(caseId, timeRange) {
    // Implementation for case activity timeline
    return [];
  }
}

module.exports = ActivityAnalytics;
