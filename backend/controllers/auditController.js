const AuditLog = require('../models/AuditLog');
const { validationResult } = require('express-validator');

const auditController = {
  // Get all audit logs with filters
  async getAllAuditLogs(req, res) {
    try {
      const filters = {
        user_id: req.query.user_id,
        action: req.query.action,
        resource_type: req.query.resource_type,
        resource_id: req.query.resource_id,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: req.query.limit || 100
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const auditLogs = await AuditLog.findAll(filters);
      
      res.status(200).json({
        success: true,
        data: auditLogs,
        count: auditLogs.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get audit log by ID
  async getAuditLogById(req, res) {
    try {
      const { id } = req.params;
      const auditLog = await AuditLog.findById(id);

      if (!auditLog) {
        return res.status(404).json({
          success: false,
          message: 'Audit log not found'
        });
      }

      res.status(200).json({
        success: true,
        data: auditLog
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get audit logs for specific resource
  async getResourceAuditLogs(req, res) {
    try {
      const { resourceType, resourceId } = req.params;
      const auditLogs = await AuditLog.findByResource(resourceType, resourceId);

      res.status(200).json({
        success: true,
        data: auditLogs,
        count: auditLogs.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get audit statistics
  async getAuditStats(req, res) {
    try {
      const filters = {
        user_id: req.query.user_id,
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const stats = await AuditLog.getAuditStats(filters);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get recent activity
  async getRecentActivity(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const recentActivity = await AuditLog.getRecentActivity(limit);

      res.status(200).json({
        success: true,
        data: recentActivity,
        count: recentActivity.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get timeline for specific resource
  async getResourceTimeline(req, res) {
    try {
      const { resourceType, resourceId } = req.params;
      const timeline = await AuditLog.getTimeline(resourceType, resourceId);

      res.status(200).json({
        success: true,
        data: timeline,
        count: timeline.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get user activity
  async getUserActivity(req, res) {
    try {
      const { userId } = req.params;
      const filters = {
        user_id: userId,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: req.query.limit || 100
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const userActivity = await AuditLog.findAll(filters);

      res.status(200).json({
        success: true,
        data: userActivity,
        count: userActivity.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = auditController;
