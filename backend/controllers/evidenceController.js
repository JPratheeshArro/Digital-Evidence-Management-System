const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const DuplicateDetection = require('../services/duplicateDetection');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

const evidenceController = {
  // Upload evidence files
  async uploadEvidence(req, res) {
    try {
      console.log('📁 Upload evidence request received');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file ? req.file.originalname : 'No file');
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      if (!req.file) {
        console.log('❌ No file uploaded');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { case_id, description, location } = req.body;
      const { getRelativeFilePath, getFileType } = require('../middleware/upload');

      console.log('📋 Processing upload:', { case_id, description, location });

      // Verify case exists
      const caseExists = await Case.findById(case_id);
      if (!caseExists) {
        console.log('❌ Case not found:', case_id);
        return res.status(404).json({
          success: false,
          message: 'Case not found'
        });
      }

      // Get user ID - use admin user (ID 1) if no user is available
      const collected_by = req.user ? req.user.id : 1;
      console.log('👤 Using collected_by ID:', collected_by);

      // Check for duplicate files using hash
      const existingDuplicate = await DuplicateDetection.checkDuplicate(req.file.hash);
      
      const evidenceData = {
        case_id,
        file_name: req.file.filename,
        original_name: req.file.originalname,
        file_path: getRelativeFilePath(req.file.path),
        file_size: req.file.size,
        file_type: getFileType(req.file.mimetype),
        mime_type: req.file.mimetype,
        file_hash_sha256: req.file.hash,
        description: description || '',
        location: location || '',
        collected_by: collected_by
      };

      console.log('💾 Creating evidence record:', evidenceData);

      const evidenceId = await Evidence.create(evidenceData);
      console.log('✅ Evidence created with ID:', evidenceId);

      // If duplicate found, mark it and include in response
      let duplicateInfo = null;
      if (existingDuplicate) {
        await DuplicateDetection.markAsDuplicate(evidenceId, existingDuplicate.id);
        duplicateInfo = {
          is_duplicate: true,
          original_evidence_id: existingDuplicate.id,
          original_case_id: existingDuplicate.case_id,
          original_uploaded: existingDuplicate.collected_at
        };
      }

      const evidence = await Evidence.findById(evidenceId);

      // Log audit entry (only if user is available)
      if (req.user && req.user.id) {
        try {
          await AuditLog.create({
            user_id: req.user.id,
            action: 'UPLOAD',
            resource_type: 'evidence',
            resource_id: evidenceId,
            details: JSON.stringify({
              file_name: req.file.originalname,
              file_size: req.file.size,
              case_id: case_id,
              description: description
            }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
          });
        } catch (auditError) {
          console.error('Audit logging error:', auditError);
          // Don't fail the request if audit logging fails
        }
      }

      console.log('✅ Evidence uploaded successfully:', evidenceId);

      const responseData = {
        success: true,
        message: 'Evidence uploaded successfully',
        data: evidence
      };

      // Include duplicate information if found
      if (duplicateInfo) {
        responseData.duplicate_warning = duplicateInfo;
        responseData.message += ' (Warning: Duplicate file detected)';
      }

      res.status(201).json(responseData);

    } catch (error) {
      console.error('❌ Upload evidence error:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload evidence'
      });
    }
  },

  // Upload multiple evidence files
  async uploadMultipleEvidence(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const { case_id, description, location } = req.body;
      const { getRelativeFilePath, getFileType } = require('../middleware/upload');

      // Verify case exists
      const caseExists = await Case.findById(case_id);
      if (!caseExists) {
        return res.status(404).json({
          success: false,
          message: 'Case not found'
        });
      }

      const uploadedEvidence = [];

      for (const file of req.files) {
        const evidenceData = {
          case_id,
          file_name: file.filename,
          original_name: file.originalname,
          file_path: getRelativeFilePath(file.path),
          file_size: file.size,
          file_type: getFileType(file.mimetype),
          mime_type: file.mimetype,
          file_hash_sha256: file.hash, // Hash generated in middleware
          description: description || '',
          location: location || '',
          collected_by: req.user.id
        };

        const evidenceId = await Evidence.create(evidenceData);
        const evidence = await Evidence.findById(evidenceId);
        uploadedEvidence.push(evidence);

        // Log audit entry for each file
        await AuditLog.create({
          user_id: req.user.id,
          action: 'UPLOAD',
          resource_type: 'evidence',
          resource_id: evidenceId,
          details: JSON.stringify({
            file_name: file.originalname,
            file_size: file.size,
            case_id: case_id,
            description: description
          }),
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
      }

      res.status(201).json({
        success: true,
        message: `${uploadedEvidence.length} evidence files uploaded successfully`,
        data: uploadedEvidence
      });
    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all evidence with filters
  async getAllEvidence(req, res) {
    try {
      const filters = {
        case_id: req.query.case_id,
        file_type: req.query.file_type,
        collected_by: req.query.collected_by,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        integrity_status: req.query.integrity_status
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const evidence = await Evidence.findAll(filters);

      // Log audit entry for viewing evidence list (only if user is available)
      if (req.user && req.user.id) {
        try {
          await AuditLog.create({
            user_id: req.user.id,
            action: 'VIEW',
            resource_type: 'evidence',
            resource_id: null,
            details: JSON.stringify({
              filters: filters,
              result_count: evidence.length
            }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
          });
        } catch (auditError) {
          console.error('Audit logging error:', auditError);
          // Don't fail the request if audit logging fails
        }
      }
      
      res.status(200).json({
        success: true,
        data: evidence,
        count: evidence.length
      });
    } catch (error) {
      console.error('Error fetching evidence:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get evidence by ID
  async getEvidenceById(req, res) {
    try {
      const { id } = req.params;
      const evidence = await Evidence.findById(id);

      if (!evidence) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      // Log audit entry for viewing specific evidence
      await AuditLog.create({
        user_id: req.user.id,
        action: 'VIEW',
        resource_type: 'evidence',
        resource_id: id,
        details: JSON.stringify({
          file_name: evidence.original_name,
          case_id: evidence.case_id
        }),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        data: evidence
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update evidence metadata
  async updateEvidence(req, res) {
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
      const { description, location } = req.body;

      // Get original evidence for audit
      const originalEvidence = await Evidence.findById(id);
      if (!originalEvidence) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      const updated = await Evidence.update(id, { description, location });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      const evidence = await Evidence.findById(id);

      // Log audit entry for updating evidence
      await AuditLog.create({
        user_id: req.user.id,
        action: 'UPDATE',
        resource_type: 'evidence',
        resource_id: id,
        details: JSON.stringify({
          changes: {
            description: originalEvidence.description !== description,
            location: originalEvidence.location !== location
          },
          old_values: {
            description: originalEvidence.description,
            location: originalEvidence.location
          },
          new_values: {
            description: description,
            location: location
          }
        }),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Evidence updated successfully',
        data: evidence
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Delete evidence
  async deleteEvidence(req, res) {
    try {
      const { id } = req.params;
      
      // Get evidence details for audit before deletion
      const evidence = await Evidence.findById(id);
      if (!evidence) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      const deleted = await Evidence.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      // Log audit entry for deleting evidence
      await AuditLog.create({
        user_id: req.user.id,
        action: 'DELETE',
        resource_type: 'evidence',
        resource_id: id,
        details: JSON.stringify({
          file_name: evidence.original_name,
          file_size: evidence.file_size,
          case_id: evidence.case_id,
          description: evidence.description
        }),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Evidence deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Download evidence file
  async downloadEvidence(req, res) {
    try {
      const { id } = req.params;
      const evidence = await Evidence.findById(id);

      if (!evidence) {
        return res.status(404).json({
          success: false,
          message: 'Evidence not found'
        });
      }

      const filePath = path.join(process.cwd(), evidence.file_path);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Log audit entry for downloading evidence
      await AuditLog.create({
        user_id: req.user.id,
        action: 'DOWNLOAD',
        resource_type: 'evidence',
        resource_id: id,
        details: JSON.stringify({
          file_name: evidence.original_name,
          file_size: evidence.file_size,
          case_id: evidence.case_id
        }),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Set appropriate headers
      res.setHeader('Content-Type', evidence.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${evidence.original_name}"`);
      res.setHeader('Content-Length', evidence.file_size);

      // Send file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Verify evidence integrity
  async verifyEvidenceIntegrity(req, res) {
    try {
      const { id } = req.params;
      
      const verification = await Evidence.verifyIntegrity(id);
      
      // Log audit entry for integrity verification
      await AuditLog.create({
        user_id: req.user.id,
        action: 'VERIFY',
        resource_type: 'evidence',
        resource_id: id,
        details: JSON.stringify({
          integrity_status: verification.status,
          verification_result: verification.valid,
          last_verified: verification.lastVerified
        }),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.status(200).json({
        success: true,
        message: 'Integrity verification completed',
        data: verification
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Batch verify evidence integrity
  async batchVerifyEvidenceIntegrity(req, res) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid evidence IDs'
        });
      }

      const results = await Evidence.batchVerifyIntegrity(ids);

      // Log audit entry for batch integrity verification
      await AuditLog.create({
        user_id: req.user.id,
        action: 'VERIFY',
        resource_type: 'evidence',
        resource_id: null,
        details: JSON.stringify({
          batch_verification: true,
          evidence_count: ids.length,
          results: results.map(r => ({
            evidence_id: r.evidenceId,
            status: r.status,
            valid: r.valid
          }))
        }),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.status(200).json({
        success: true,
        message: `Batch integrity verification completed for ${ids.length} files`,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get evidence statistics
  async getEvidenceStats(req, res) {
    try {
      const stats = await Evidence.getEvidenceStats();
      
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

  // Get integrity statistics
  async getIntegrityStats(req, res) {
    try {
      const stats = await Evidence.getIntegrityStats();
      
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

  // Get duplicate statistics
  async getDuplicateStats(req, res) {
    try {
      const stats = await DuplicateDetection.getDuplicateStats();
      
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

  // Get comprehensive duplicate report
  async getDuplicateReport(req, res) {
    try {
      const report = await DuplicateDetection.generateDuplicateReport();
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get duplicates by hash
  async getDuplicatesByHash(req, res) {
    try {
      const { hash } = req.params;
      
      if (!hash || hash.length !== 64) {
        return res.status(400).json({
          success: false,
          message: 'Invalid hash provided'
        });
      }

      const duplicates = await DuplicateDetection.getAllDuplicates(hash);
      
      res.status(200).json({
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

  // Get duplicate chain for a specific evidence
  async getDuplicateChain(req, res) {
    try {
      const { id } = req.params;
      const chain = await DuplicateDetection.getDuplicateChain(parseInt(id));
      
      res.status(200).json({
        success: true,
        data: chain
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get similar files by filename
  async getSimilarFiles(req, res) {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Filename is required'
        });
      }

      const similarFiles = await DuplicateDetection.getSimilarFiles(filename);
      
      res.status(200).json({
        success: true,
        data: similarFiles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = evidenceController;
