const pool = require('../config/database');

class AuditLog {
  static async create(logData) {
    try {
      const {
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent
      } = logData;

      const [result] = await pool.execute(
        `INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, details, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          action,
          resource_type,
          resource_id || null,
          details || null,
          ip_address || null,
          user_agent || null
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating audit log: ${error.message}`);
    }
  }

  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT al.*, 
               u.name as user_name,
               u.email as user_email,
               u.role as user_role
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
      `;
      
      const params = [];
      const conditions = [];

      if (filters.user_id) {
        conditions.push('al.user_id = ?');
        params.push(filters.user_id);
      }

      if (filters.action) {
        conditions.push('al.action = ?');
        params.push(filters.action);
      }

      if (filters.resource_type) {
        conditions.push('al.resource_type = ?');
        params.push(filters.resource_type);
      }

      if (filters.resource_id) {
        conditions.push('al.resource_id = ?');
        params.push(filters.resource_id);
      }

      if (filters.date_from) {
        conditions.push('DATE(al.created_at) >= ?');
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push('DATE(al.created_at) <= ?');
        params.push(filters.date_to);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY al.created_at DESC';

      // Add limit if specified
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching audit logs: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT al.*, 
               u.name as user_name,
               u.email as user_email,
               u.role as user_role
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching audit log: ${error.message}`);
    }
  }

  static async findByResource(resourceType, resourceId) {
    try {
      const [rows] = await pool.execute(`
        SELECT al.*, 
               u.name as user_name,
               u.email as user_email,
               u.role as user_role
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.resource_type = ? AND al.resource_id = ?
        ORDER BY al.created_at DESC
      `, [resourceType, resourceId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching audit logs for resource: ${error.message}`);
    }
  }

  static async getAuditStats(filters = {}) {
    try {
      let query = `
        SELECT 
          action,
          resource_type,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM audit_logs
      `;
      
      const params = [];
      const conditions = [];

      if (filters.user_id) {
        conditions.push('user_id = ?');
        params.push(filters.user_id);
      }

      if (filters.date_from) {
        conditions.push('DATE(created_at) >= ?');
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push('DATE(created_at) <= ?');
        params.push(filters.date_to);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY action, resource_type, DATE(created_at) ORDER BY date DESC, count DESC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching audit statistics: ${error.message}`);
    }
  }

  static async getRecentActivity(limit = 50) {
    try {
      const [rows] = await pool.execute(`
        SELECT al.*, 
               u.name as user_name,
               u.email as user_email,
               u.role as user_role
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching recent activity: ${error.message}`);
    }
  }

  static async getTimeline(resourceType, resourceId) {
    try {
      const [rows] = await pool.execute(`
        SELECT al.*, 
               u.name as user_name,
               u.email as user_email,
               u.role as user_role
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.resource_type = ? AND al.resource_id = ?
        ORDER BY al.created_at ASC
      `, [resourceType, resourceId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching timeline: ${error.message}`);
    }
  }

  // Helper method to format action descriptions
  static formatActionDescription(action, resourceType, details) {
    const actionMap = {
      'CREATE': 'created',
      'UPDATE': 'updated',
      'DELETE': 'deleted',
      'VIEW': 'viewed',
      'DOWNLOAD': 'downloaded',
      'UPLOAD': 'uploaded',
      'VERIFY': 'verified integrity',
      'LOGIN': 'logged in',
      'LOGOUT': 'logged out'
    };

    const resourceMap = {
      'evidence': 'evidence file',
      'case': 'case',
      'user': 'user account',
      'system': 'system'
    };

    const actionText = actionMap[action] || action.toLowerCase();
    const resourceText = resourceMap[resourceType] || resourceType;

    return `${actionText} ${resourceText}`;
  }

  // Helper method to get action icon
  static getActionIcon(action) {
    const iconMap = {
      'CREATE': '➕',
      'UPDATE': '✏️',
      'DELETE': '🗑️',
      'VIEW': '👁️',
      'DOWNLOAD': '⬇️',
      'UPLOAD': '⬆️',
      'VERIFY': '🔍',
      'LOGIN': '🔑',
      'LOGOUT': '🚪'
    };

    return iconMap[action] || '📋';
  }

  // Helper method to get action color
  static getActionColor(action) {
    const colorMap = {
      'CREATE': 'success',
      'UPDATE': 'warning',
      'DELETE': 'danger',
      'VIEW': 'info',
      'DOWNLOAD': 'primary',
      'UPLOAD': 'success',
      'VERIFY': 'info',
      'LOGIN': 'secondary',
      'LOGOUT': 'secondary'
    };

    return colorMap[action] || 'secondary';
  }
}

module.exports = AuditLog;
