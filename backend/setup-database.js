const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=');
        }
      }
    });
  }
}

loadEnv();

async function setupDatabase() {
  console.log('🔧 Setting up DEMS Database...');
  
  let connection;
  try {
    // Connect to MySQL server (without database first)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    });

    console.log('✅ Connected to MySQL server');

    // Drop and recreate database
    const dbName = process.env.DB_NAME || 'dems';
    await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
    await connection.execute(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created fresh`);

    // Close current connection and reconnect to the specific database
    await connection.end();
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: dbName
    });
    console.log(`✅ Connected to database '${dbName}'`);

    // Create tables manually
    console.log('📋 Creating tables...');

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'officer', 'forensic') NOT NULL DEFAULT 'officer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Users table created');

    // Create cases table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        case_number VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status ENUM('open', 'closed', 'pending') DEFAULT 'open',
        assigned_officer_id INT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_officer_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        INDEX idx_case_number (case_number),
        INDEX idx_status (status),
        INDEX idx_assigned_officer (assigned_officer_id)
      )
    `);
    console.log('✅ Cases table created');

    // Create evidence table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS evidence (
        id INT AUTO_INCREMENT PRIMARY KEY,
        case_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_hash_sha256 VARCHAR(64) NOT NULL,
        integrity_status ENUM('valid', 'tampered', 'pending', 'error') DEFAULT 'valid',
        last_verified TIMESTAMP NULL,
        collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        collected_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id),
        FOREIGN KEY (collected_by) REFERENCES users(id),
        INDEX idx_case_id (case_id),
        INDEX idx_file_type (file_type),
        INDEX idx_collected_by (collected_by),
        INDEX idx_integrity_status (integrity_status),
        INDEX idx_collected_at (collected_at)
      )
    `);
    console.log('✅ Evidence table created');

    // Create audit_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        action ENUM('CREATE', 'VIEW', 'UPDATE', 'DELETE', 'UPLOAD', 'DOWNLOAD', 'VERIFY') NOT NULL,
        resource_type ENUM('case', 'evidence', 'user') NOT NULL,
        resource_id INT NULL,
        details TEXT NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_resource_type (resource_type),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Audit logs table created');

    // Create admin user
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      console.log('👤 Creating admin user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const [result] = await connection.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['System Admin', 'admin@dems.com', hashedPassword, 'admin']
      );
      console.log(`✅ Created admin user with ID: ${result.insertId}`);
    }

    // Get admin user ID
    const [adminUsers] = await connection.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    const adminId = adminUsers[0]?.id;

    if (!adminId) {
      throw new Error('No admin user found');
    }

    // Add sample cases
    const [existingCases] = await connection.execute('SELECT COUNT(*) as count FROM cases');
    if (existingCases[0].count === 0) {
      console.log('📁 Adding sample cases...');
      
      const sampleCases = [
        {
          case_number: 'CASE-2024-001',
          title: 'Cybersecurity Investigation',
          description: 'Investigation of unauthorized access to company network systems',
          status: 'open'
        },
        {
          case_number: 'CASE-2024-002',
          title: 'Data Breach Analysis',
          description: 'Forensic analysis of suspected data breach involving customer information',
          status: 'open'
        },
        {
          case_number: 'CASE-2024-003',
          title: 'Malware Outbreak Investigation',
          description: 'Investigation of malware infection affecting multiple workstations',
          status: 'pending'
        },
        {
          case_number: 'CASE-2024-004',
          title: 'Email Phishing Attack',
          description: 'Analysis of phishing email campaign targeting employees',
          status: 'closed'
        },
        {
          case_number: 'CASE-2024-005',
          title: 'Insider Threat Investigation',
          description: 'Investigation of suspected insider data theft',
          status: 'open'
        }
      ];

      for (const caseData of sampleCases) {
        await connection.execute(
          'INSERT INTO cases (case_number, title, description, status, assigned_officer_id, created_by) VALUES (?, ?, ?, ?, ?, ?)',
          [
            caseData.case_number,
            caseData.title,
            caseData.description,
            caseData.status,
            adminId
          ]
        );
        console.log(`✅ Added case: ${caseData.case_number}`);
      }

      console.log(`✅ Successfully added ${sampleCases.length} sample cases`);
    }

    // Verify everything is working
    const [finalCases] = await connection.execute('SELECT id, case_number, title, status FROM cases ORDER BY created_at');
    const [finalUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    console.log('\n🎉 Database setup complete!');
    console.log(`📊 Database: ${dbName}`);
    console.log(`👥 Users: ${finalUsers[0].count}`);
    console.log(`📁 Cases: ${finalCases.length}`);
    console.log('\n📋 Sample Cases:');
    finalCases.forEach(c => {
      console.log(`   - ${c.case_number}: ${c.title} (${c.status})`);
    });

    console.log('\n🔑 Login Credentials:');
    console.log('   Email: admin@dems.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Access denied solutions:');
      console.log('   1. Check MySQL server is running');
      console.log('   2. Verify DB_USER and DB_PASSWORD in .env');
      console.log('   3. Ensure MySQL user has proper privileges');
      console.log('   4. Try resetting MySQL root password');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupDatabase();
