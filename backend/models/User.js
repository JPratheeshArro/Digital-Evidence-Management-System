const pool = require('../config/database');

class User {
  static async findAll() {
    try {
      const [rows] = await pool.execute('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  static async findByRole(role) {
    try {
      const [rows] = await pool.execute('SELECT id, name, email, role, created_at, updated_at FROM users WHERE role = ? ORDER BY created_at DESC', [role]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching users by role: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const { name, email, password, role = 'officer' } = userData;
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, password, role]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async update(id, userData) {
    try {
      const { name, email, role } = userData;
      const [result] = await pool.execute(
        'UPDATE users SET name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, email, role, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  static async updateRole(id, role) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [role, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating user role: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  static async getRoleStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching role statistics: ${error.message}`);
    }
  }
}

module.exports = User;
