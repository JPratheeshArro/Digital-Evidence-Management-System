const Evidence = require('../models/Evidence');

class DuplicateDetection {
  /**
   * Check for duplicate evidence by file hash
   * @param {string} fileHash - SHA-256 hash of the file
   * @returns {Promise<Object|null>} - Returns duplicate evidence info or null if no duplicate
   */
  static async checkDuplicate(fileHash) {
    try {
      const pool = require('../config/database');
      const [rows] = await pool.execute(
        'SELECT id, case_id, file_name, original_name, collected_by, collected_at FROM evidence WHERE file_hash_sha256 = ? LIMIT 1',
        [fileHash]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Error checking for duplicate: ${error.message}`);
    }
  }

  /**
   * Get all duplicates for a specific hash
   * @param {string} fileHash - SHA-256 hash of the file
   * @returns {Promise<Array>} - Array of duplicate evidence records
   */
  static async getAllDuplicates(fileHash) {
    try {
      const pool = require('../config/database');
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
      `, [fileHash]);
      
      return rows;
    } catch (error) {
      throw new Error(`Error fetching duplicates: ${error.message}`);
    }
  }

  /**
   * Get statistics about duplicate files
   * @returns {Promise<Object>} - Duplicate statistics
   */
  static async getDuplicateStats() {
    try {
      const pool = require('../config/database');
      
      // Get files with duplicates
      const [duplicateGroups] = await pool.execute(`
        SELECT 
          file_hash_sha256,
          COUNT(*) as duplicate_count,
          GROUP_CONCAT(id) as evidence_ids,
          MIN(collected_at) as first_uploaded,
          MAX(collected_at) as last_uploaded
        FROM evidence 
        GROUP BY file_hash_sha256 
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC
      `);

      // Get overall statistics
      const [totalStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_files,
          COUNT(DISTINCT file_hash_sha256) as unique_files,
          COUNT(*) - COUNT(DISTINCT file_hash_sha256) as duplicate_files
        FROM evidence
      `);

      return {
        total_files: totalStats[0].total_files,
        unique_files: totalStats[0].unique_files,
        duplicate_files: totalStats[0].duplicate_files,
        duplicate_groups: duplicateGroups.length,
        duplicate_groups_details: duplicateGroups
      };
    } catch (error) {
      throw new Error(`Error getting duplicate stats: ${error.message}`);
    }
  }

  /**
   * Get potential duplicates based on file name similarity
   * @param {string} fileName - Original file name
   * @param {number} similarityThreshold - Similarity threshold (0-100)
   * @returns {Promise<Array>} - Array of potentially similar files
   */
  static async getSimilarFiles(fileName, similarityThreshold = 80) {
    try {
      const pool = require('../config/database');
      
      // Simple similarity check using LIKE (can be enhanced with more sophisticated algorithms)
      const [rows] = await pool.execute(`
        SELECT e.*, 
               c.case_number,
               c.title as case_title,
               u.name as collected_by_name
        FROM evidence e
        JOIN cases c ON e.case_id = c.id
        JOIN users u ON e.collected_by = u.id
        WHERE e.original_name LIKE ? 
           OR e.original_name LIKE ?
           OR e.original_name LIKE ?
        ORDER BY e.collected_at DESC
        LIMIT 10
      `, [
        `%${fileName}%`,
        `%${fileName.replace(/\.[^/.]+$/, "")}%`, // Remove extension
        `%${fileName.split('.')[0]}%` // Get name before first dot
      ]);

      return rows;
    } catch (error) {
      throw new Error(`Error finding similar files: ${error.message}`);
    }
  }

  /**
   * Mark evidence as duplicate reference
   * @param {number} evidenceId - ID of the evidence to mark
   * @param {number} originalId - ID of the original evidence
   * @returns {Promise<boolean>} - Success status
   */
  static async markAsDuplicate(evidenceId, originalId) {
    try {
      const pool = require('../config/database');
      const [result] = await pool.execute(
        'UPDATE evidence SET is_duplicate = 1, original_evidence_id = ? WHERE id = ?',
        [originalId, evidenceId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error marking as duplicate: ${error.message}`);
    }
  }

  /**
   * Get duplicate chain (all related duplicates)
   * @param {number} evidenceId - Starting evidence ID
   * @returns {Promise<Array>} - Array of all related evidence
   */
  static async getDuplicateChain(evidenceId) {
    try {
      const pool = require('../config/database');
      
      // First get the hash of the starting evidence
      const [evidence] = await pool.execute(
        'SELECT file_hash_sha256 FROM evidence WHERE id = ?',
        [evidenceId]
      );

      if (evidence.length === 0) {
        return [];
      }

      // Get all evidence with the same hash
      const [chain] = await pool.execute(`
        SELECT e.*, 
               c.case_number,
               c.title as case_title,
               u.name as collected_by_name
        FROM evidence e
        JOIN cases c ON e.case_id = c.id
        JOIN users u ON e.collected_by = u.id
        WHERE e.file_hash_sha256 = ?
        ORDER BY e.collected_at ASC
      `, [evidence[0].file_hash_sha256]);

      return chain;
    } catch (error) {
      throw new Error(`Error getting duplicate chain: ${error.message}`);
    }
  }

  /**
   * Calculate similarity between two file names
   * @param {string} name1 - First file name
   * @param {string} name2 - Second file name
   * @returns {number} - Similarity percentage (0-100)
   */
  static calculateSimilarity(name1, name2) {
    const longer = name1.length > name2.length ? name1 : name2;
    const shorter = name1.length > name2.length ? name2 : name1;
    
    if (longer.length === 0) return 100.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return ((longer.length - editDistance) / longer.length) * 100;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Levenshtein distance
   */
  static levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Generate duplicate report
   * @returns {Promise<Object>} - Comprehensive duplicate report
   */
  static async generateDuplicateReport() {
    try {
      const stats = await this.getDuplicateStats();
      const duplicateGroups = stats.duplicate_groups_details;

      const report = {
        summary: {
          total_files: stats.total_files,
          unique_files: stats.unique_files,
          duplicate_files: stats.duplicate_files,
          duplicate_percentage: stats.total_files > 0 
            ? ((stats.duplicate_files / stats.total_files) * 100).toFixed(2) + '%'
            : '0%',
          duplicate_groups: stats.duplicate_groups
        },
        duplicate_groups: [],
        recommendations: []
      };

      // Process each duplicate group
      for (const group of duplicateGroups) {
        const duplicates = await this.getAllDuplicates(group.file_hash_sha256);
        
        report.duplicate_groups.push({
          hash: group.file_hash_sha256,
          count: group.duplicate_count,
          first_uploaded: group.first_uploaded,
          last_uploaded: group.last_uploaded,
          files: duplicates.map(dup => ({
            id: dup.id,
            case_number: dup.case_number,
            case_title: dup.case_title,
            file_name: dup.original_name,
            collected_by: dup.collected_by_name,
            collected_at: dup.collected_at,
            file_size: dup.file_size
          }))
        });
      }

      // Generate recommendations
      if (stats.duplicate_files > 0) {
        report.recommendations.push(
          'Review duplicate files to determine if any can be safely removed',
          'Consider implementing file deduplication policies',
          'Add duplicate warnings during file upload process'
        );
      }

      if (stats.duplicate_files > stats.total_files * 0.1) {
        report.recommendations.push(
          'High duplicate rate detected. Consider implementing automatic duplicate detection'
        );
      }

      return report;
    } catch (error) {
      throw new Error(`Error generating duplicate report: ${error.message}`);
    }
  }
}

module.exports = DuplicateDetection;
