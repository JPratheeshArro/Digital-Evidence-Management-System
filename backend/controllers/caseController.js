const Case = require('../models/Case');
const { validationResult } = require('express-validator');

const caseController = {
  // Get all cases
  async getAllCases(req, res) {
    try {
      const cases = await Case.findAll();
      
      // Transform cases to ensure consistent format with id and name
      const transformedCases = cases.map(case_ => ({
        id: case_.id,
        name: `${case_.case_number} - ${case_.title}`,
        case_number: case_.case_number,
        title: case_.title,
        description: case_.description,
        status: case_.status,
        assigned_officer_id: case_.assigned_officer_id,
        created_by: case_.created_by,
        created_at: case_.created_at,
        updated_at: case_.updated_at,
        assigned_officer_name: case_.assigned_officer_name,
        created_by_name: case_.created_by_name
      }));
      
      res.status(200).json({
        success: true,
        data: transformedCases,
        count: transformedCases.length
      });
    } catch (error) {
      console.error('Error fetching cases:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get case by ID
  async getCaseById(req, res) {
    try {
      const { id } = req.params;
      const case_ = await Case.findById(id);

      if (!case_) {
        return res.status(404).json({
          success: false,
          message: 'Case not found'
        });
      }

      res.status(200).json({
        success: true,
        data: case_
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Create new case
  async createCase(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { case_number, title, description, assigned_officer_id } = req.body;
      
      // Check if case number already exists
      const existingCase = await Case.findByCaseNumber(case_number);
      if (existingCase) {
        return res.status(400).json({
          success: false,
          message: 'Case number already exists'
        });
      }

      const caseData = {
        case_number,
        title,
        description,
        assigned_officer_id: assigned_officer_id || null,
        created_by: req.user.id
      };

      const caseId = await Case.create(caseData);
      const case_ = await Case.findById(caseId);

      res.status(201).json({
        success: true,
        message: 'Case created successfully',
        data: case_
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update case
  async updateCase(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { title, description, status, assigned_officer_id } = req.body;

      const updated = await Case.update(id, {
        title,
        description,
        status,
        assigned_officer_id
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Case not found'
        });
      }

      const case_ = await Case.findById(id);
      res.status(200).json({
        success: true,
        message: 'Case updated successfully',
        data: case_
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Delete case (admin only)
  async deleteCase(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Case.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Case not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Case deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get case statistics
  async getCaseStats(req, res) {
    try {
      const stats = await Case.getCaseStats();
      
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
  }
};

module.exports = caseController;
