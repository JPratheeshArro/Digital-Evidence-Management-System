const crypto = require('crypto');
const fs = require('fs');

class FileIntegrity {
  /**
   * Generate SHA-256 hash for a file
   * @param {string} filePath - Path to the file
   * @returns {Promise<string>} - SHA-256 hash
   */
  static async generateSHA256(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => {
        hash.update(data);
      });
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Verify file integrity by comparing current hash with stored hash
   * @param {string} filePath - Path to the file
   * @param {string} storedHash - Stored SHA-256 hash
   * @returns {Promise<{valid: boolean, currentHash: string}>}
   */
  static async verifyIntegrity(filePath, storedHash) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist');
      }

      // Generate current hash
      const currentHash = await this.generateSHA256(filePath);
      
      // Compare hashes
      const isValid = currentHash === storedHash;
      
      return {
        valid: isValid,
        currentHash: currentHash,
        storedHash: storedHash
      };
    } catch (error) {
      throw new Error(`Integrity verification failed: ${error.message}`);
    }
  }

  /**
   * Batch verify multiple files
   * @param {Array} files - Array of {filePath, storedHash} objects
   * @returns {Promise<Array>} - Array of verification results
   */
  static async batchVerifyIntegrity(files) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.verifyIntegrity(file.filePath, file.storedHash);
        results.push({
          filePath: file.filePath,
          ...result,
          status: 'success'
        });
      } catch (error) {
        results.push({
          filePath: file.filePath,
          error: error.message,
          status: 'error'
        });
      }
    }
    
    return results;
  }

  /**
   * Get integrity status color for UI
   * @param {string} status - Integrity status
   * @returns {object} - Color classes and icon
   */
  static getIntegrityStatusInfo(status) {
    switch (status) {
      case 'valid':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: '✓',
          label: 'Valid'
        };
      case 'tampered':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: '✗',
          label: 'Tampered'
        };
      case 'pending':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: '⏳',
          label: 'Pending'
        };
      case 'error':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: '⚠',
          label: 'Error'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: '?',
          label: 'Unknown'
        };
    }
  }

  /**
   * Update integrity status in database
   * @param {object} db - Database connection pool
   * @param {number} evidenceId - Evidence ID
   * @param {string} status - New integrity status
   * @returns {Promise<void>}
   */
  static async updateIntegrityStatus(db, evidenceId, status) {
    try {
      await db.execute(
        'UPDATE evidence SET integrity_status = ?, last_verified = CURRENT_TIMESTAMP WHERE id = ?',
        [status, evidenceId]
      );
    } catch (error) {
      throw new Error(`Failed to update integrity status: ${error.message}`);
    }
  }

  /**
   * Generate hash for buffer (useful for in-memory files)
   * @param {Buffer} buffer - File buffer
   * @returns {string} - SHA-256 hash
   */
  static generateSHA256FromBuffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Create integrity report
   * @param {Array} verificationResults - Results from batch verification
   * @returns {object} - Summary report
   */
  static createIntegrityReport(verificationResults) {
    const report = {
      total: verificationResults.length,
      valid: 0,
      tampered: 0,
      errors: 0,
      pending: 0,
      details: verificationResults
    };

    verificationResults.forEach(result => {
      if (result.status === 'success') {
        if (result.valid) {
          report.valid++;
        } else {
          report.tampered++;
        }
      } else {
        report.errors++;
      }
    });

    return report;
  }
}

module.exports = FileIntegrity;
