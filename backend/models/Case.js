const pool = require('../config/database');

class Case {
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT c.*, 
               u1.name as assigned_officer_name,
               u2.name as created_by_name
        FROM cases c
        LEFT JOIN users u1 ON c.assigned_officer_id = u1.id
        LEFT JOIN users u2 ON c.created_by = u2.id
        ORDER BY c.created_at DESC
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching cases: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT c.*, 
               u1.name as assigned_officer_name,
               u2.name as created_by_name
        FROM cases c
        LEFT JOIN users u1 ON c.assigned_officer_id = u1.id
        LEFT JOIN users u2 ON c.created_by = u2.id
        WHERE c.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching case: ${error.message}`);
    }
  }

  static async findByCaseNumber(caseNumber) {
    try {
      const [rows] = await pool.execute(`
        SELECT c.*, 
               u1.name as assigned_officer_name,
               u2.name as created_by_name
        FROM cases c
        LEFT JOIN users u1 ON c.assigned_officer_id = u1.id
        LEFT JOIN users u2 ON c.created_by = u2.id
        WHERE c.case_number = ?
      `, [caseNumber]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching case by number: ${error.message}`);
    }
  }

  static async create(caseData) {
    try {
      const { case_number, title, description, assigned_officer_id, created_by } = caseData;
      const [result] = await pool.execute(
        'INSERT INTO cases (case_number, title, description, assigned_officer_id, created_by) VALUES (?, ?, ?, ?, ?)',
        [case_number, title, description, assigned_officer_id, created_by]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating case: ${error.message}`);
    }
  }

  static async update(id, caseData) {
    try {
      const { title, description, status, assigned_officer_id } = caseData;
      const [result] = await pool.execute(
        'UPDATE cases SET title = ?, description = ?, status = ?, assigned_officer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, description, status, assigned_officer_id, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating case: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM cases WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting case: ${error.message}`);
    }
  }

  static async getCaseStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT status, COUNT(*) as count 
        FROM cases 
        GROUP BY status
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching case statistics: ${error.message}`);
    }
  }
}

module.exports = Case;
