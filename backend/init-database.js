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

async function initializeDatabase() {
  console.log('🔧 Initializing DEMS Database...');
  
  let connection;
  try {
    // Connect to MySQL server (without database first)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'dems';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created or already exists`);

    // Close current connection and reconnect to the specific database
    await connection.end();
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: dbName
    });
    console.log(`✅ Connected to database '${dbName}'`);

    // Read and execute SQL schema
    const schemaPath = path.join(__dirname, '../database/init.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      let statements = schema.split(';').filter(stmt => stmt.trim());
      
      // Remove USE statement as we're already connected to the database
      statements = statements.filter(stmt => !stmt.trim().toUpperCase().startsWith('USE '));
      
      for (const statement of statements) {
        if (statement) {
          try {
            await connection.execute(statement);
          } catch (err) {
            // Ignore "already exists" errors
            if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
              console.warn('⚠️ Schema warning:', err.message);
            }
          }
        }
      }
      console.log('✅ Database schema executed successfully');
    } else {
      console.error('❌ Schema file not found:', schemaPath);
    }

    // Create admin user if none exists
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

    // Add sample cases if none exist
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
    
    console.log('\n🎉 Database initialization complete!');
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
    console.error('❌ Database initialization failed:', error.message);
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

// Run the initialization
initializeDatabase();
