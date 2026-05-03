const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const FileIntegrity = require('../utils/fileIntegrity');

class Evidence {
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT e.*, 
               c.case_number,
               c.title as case_title,
               u.name as collected_by_name
        FROM evidence e
        JOIN cases c ON e.case_id = c.id
        JOIN users u ON e.collected_by = u.id
      `;
      
      const params = [];
      const conditions = [];

      if (filters.case_id) {
        conditions.push('e.case_id = ?');
        params.push(filters.case_id);
      }

      if (filters.file_type) {
        conditions.push('e.file_type = ?');
        params.push(filters.file_type);
      }

      if (filters.collected_by) {
        conditions.push('e.collected_by = ?');
        params.push(filters.collected_by);
      }

      if (filters.date_from) {
        conditions.push('DATE(e.collected_at) >= ?');
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push('DATE(e.collected_at) <= ?');
        params.push(filters.date_to);
      }

      if (filters.integrity_status) {
        conditions.push('e.integrity_status = ?');
        params.push(filters.integrity_status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY e.collected_at DESC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching evidence: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT e.*, 
               c.case_number,
               c.title as case_title,
               u.name as collected_by_name
        FROM evidence e
        JOIN cases c ON e.case_id = c.id
        JOIN users u ON e.collected_by = u.id
        WHERE e.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching evidence: ${error.message}`);
    }
  }

  static async create(evidenceData) {
    try {
      const {
        case_id,
        file_name,
        original_name,
        file_path,
        file_size,
        file_type,
        mime_type,
        file_hash_sha256,
        description,
        location,
        collected_by
      } = evidenceData;

      // Check if description and location fields exist in the table
      const [columns] = await pool.execute('DESCRIBE evidence');
      const hasDescription = columns.some(col => col.Field === 'description');
      const hasLocation = columns.some(col => col.Field === 'location');

      let query, params;
      
      if (hasDescription && hasLocation) {
        // Full query with description and location
        query = `
          INSERT INTO evidence (
            case_id, file_name, original_name, file_path, file_size, 
            file_type, mime_type, file_hash_sha256, description, location, collected_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [
          case_id, file_name, original_name, file_path, file_size,
          file_type, mime_type, file_hash_sha256, description || '', location || '', collected_by
        ];
      } else {
        // Minimal query without description and location
        query = `
          INSERT INTO evidence (
            case_id, file_name, original_name, file_path, file_size, 
            file_type, mime_type, file_hash_sha256, collected_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [
          case_id, file_name, original_name, file_path, file_size,
          file_type, mime_type, file_hash_sha256, collected_by
        ];
      }

      const [result] = await pool.execute(query, params);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating evidence: ${error.message}`);
    }
  }

  static async update(id, evidenceData) {
    try {
      const { description, location } = evidenceData;
      
      // Check if description and location fields exist in the table
      const [columns] = await pool.execute('DESCRIBE evidence');
      const hasDescription = columns.some(col => col.Field === 'description');
      const hasLocation = columns.some(col => col.Field === 'location');

      let query, params;
      
      if (hasDescription && hasLocation) {
        query = 'UPDATE evidence SET description = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params = [description, location, id];
      } else {
        query = 'UPDATE evidence SET updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params = [id];
      }
      
      const [result] = await pool.execute(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating evidence: ${error.message}`);
    }
  }

  static async updateIntegrityStatus(id, status) {
    try {
      const [result] = await pool.execute(
        'UPDATE evidence SET integrity_status = ?, last_verified = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating integrity status: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      // First get the evidence to delete the file
      const evidence = await this.findById(id);
      if (evidence && evidence.file_path) {
        // Delete the physical file
        const fullPath = path.join(process.cwd(), evidence.file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      // Then delete from database
      const [result] = await pool.execute('DELETE FROM evidence WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting evidence: ${error.message}`);
    }
  }

  static async getEvidenceStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT file_type, COUNT(*) as count, SUM(file_size) as total_size
        FROM evidence 
        GROUP BY file_type
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching evidence statistics: ${error.message}`);
    }
  }

  static async getIntegrityStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT integrity_status, COUNT(*) as count
        FROM evidence 
        GROUP BY integrity_status
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching integrity statistics: ${error.message}`);
    }
  }

  static async getCaseEvidenceCount(caseId) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM evidence WHERE case_id = ?',
        [caseId]
      );
      return rows[0].count;
    } catch (error) {
      throw new Error(`Error fetching case evidence count: ${error.message}`);
    }
  }

  static async verifyIntegrity(id) {
    try {
      const evidence = await this.findById(id);
      if (!evidence) {
        throw new Error('Evidence not found');
      }

      const filePath = path.join(process.cwd(), evidence.file_path);
      const verification = await FileIntegrity.verifyIntegrity(filePath, evidence.file_hash_sha256);
      
      // Update integrity status in database
      const status = verification.valid ? 'valid' : 'tampered';
      await this.updateIntegrityStatus(id, status);
      
      return {
        evidenceId: id,
        ...verification,
        status: status,
        lastVerified: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error verifying integrity: ${error.message}`);
    }
  }

  static async batchVerifyIntegrity(ids) {
    try {
      const results = [];
      
      for (const id of ids) {
        try {
          const result = await this.verifyIntegrity(id);
          results.push(result);
        } catch (error) {
          results.push({
            evidenceId: id,
            error: error.message,
            status: 'error'
          });
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Error in batch integrity verification: ${error.message}`);
    }
  }

  static async findByHash(hash) {
    try {
      const [rows] = await pool.execute(`
        SELECT e.*, 
               c.case_number,
               c.title as case_title,
               u.name as collected_by_name
        FROM evidence e
        JOIN cases c ON e.case_id = c.id
        JOIN users u ON e.collected_by = u.id
        WHERE e.file_hash_sha256 = ?
        ORDER BY e.collected_at DESC
      `, [hash]);
      return rows;
    } catch (error) {
      throw new Error(`Error finding evidence by hash: ${error.message}`);
    }
  }

  static async checkDuplicate(hash) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM evidence WHERE file_hash_sha256 = ?',
        [hash]
      );
      return rows[0].count > 0;
    } catch (error) {
      throw new Error(`Error checking duplicate: ${error.message}`);
    }
  }

  static async getDuplicateGroups() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          file_hash_sha256,
          COUNT(*) as duplicate_count,
          GROUP_CONCAT(id ORDER BY collected_at DESC) as evidence_ids,
          MIN(original_name) as sample_filename,
          MAX(collected_at) as last_uploaded
        FROM evidence 
        GROUP BY file_hash_sha256 
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC, last_uploaded DESC
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error getting duplicate groups: ${error.message}`);
    }
  }

  static async getDuplicateStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_files,
          COUNT(DISTINCT file_hash_sha256) as unique_files,
          COUNT(*) - COUNT(DISTINCT file_hash_sha256) as duplicate_files,
          ROUND((COUNT(*) - COUNT(DISTINCT file_hash_sha256)) / COUNT(*) * 100, 2) as duplicate_percentage
        FROM evidence
      `);
      return rows[0];
    } catch (error) {
      throw new Error(`Error getting duplicate stats: ${error.message}`);
    }
  }

  static async getDuplicatesByHash(hash) {
    try {
      const [rows] = await pool.execute(`
        SELECT e.*, 
               c.case_number,
               c.title as case_title,
               u.name as collected_by_name
        FROM evidence e
        JOIN cases c ON e.case_id = c.id
        JOIN users u ON e.collected_by = u.id
        WHERE e.file_hash_sha256 = ?
        ORDER BY e.collected_at DESC
      `, [hash]);
      return rows;
    } catch (error) {
      throw new Error(`Error getting duplicates by hash: ${error.message}`);
    }
  }

  static async getDuplicateChain(evidenceId) {
    try {
      // First get the hash of the specified evidence
      const [evidence] = await pool.execute(
        'SELECT file_hash_sha256 FROM evidence WHERE id = ?',
        [evidenceId]
      );
      
      if (evidence.length === 0) {
        throw new Error('Evidence not found');
      }
      
      const hash = evidence[0].file_hash_sha256;
      
      // Then get all evidence with the same hash
      return await this.getDuplicatesByHash(hash);
    } catch (error) {
      throw new Error(`Error getting duplicate chain: ${error.message}`);
    }
  }

  static async getSimilarFiles(filename) {
    try {
      // Extract filename without extension for similarity matching
      const baseName = path.basename(filename, path.extname(filename));
      const searchTerm = `%${baseName}%`;
      
      const [rows] = await pool.execute(`
        SELECT e.*, 
               c.case_number,
               c.title as case_title,
               u.name as collected_by_name,
           SIMILARITY(original_name, ?) as similarity_score
        FROM evidence e
        JOIN cases c ON e.case_id = c.id
        JOIN users u ON e.collected_by = u.id
        WHERE e.original_name LIKE ?
        ORDER BY similarity_score DESC, e.collected_at DESC
        LIMIT 10
      `, [baseName, searchTerm]);
      return rows;
    } catch (error) {
      throw new Error(`Error getting similar files: ${error.message}`);
    }
  }

  static async createWithDuplicateCheck(evidenceData) {
    try {
      const { file_hash_sha256 } = evidenceData;
      
      // Check for duplicates
      const isDuplicate = await this.checkDuplicate(file_hash_sha256);
      
      if (isDuplicate) {
        // Get existing duplicates
        const duplicates = await this.findByHash(file_hash_sha256);
        throw new Error(`Duplicate file detected. This file already exists in the system. Existing files: ${duplicates.map(d => d.original_name).join(', ')}`);
      }
      
      // Create the evidence record
      const insertId = await this.create(evidenceData);
      
      return {
        insertId,
        duplicateCheck: 'passed',
        message: 'File uploaded successfully - no duplicates found'
      };
    } catch (error) {
      throw new Error(`Error creating evidence with duplicate check: ${error.message}`);
    }
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getIntegrityStatusInfo(status) {
    return FileIntegrity.getIntegrityStatusInfo(status);
  }
}

module.exports = Evidence;
