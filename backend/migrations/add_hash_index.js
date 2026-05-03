const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
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

async function addHashIndex() {
  console.log('Adding hash index to evidence table...');
  
  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'dems'
    });

    console.log('Connected to database');

    // Check if index already exists
    const [indexes] = await connection.execute(`
      SHOW INDEX FROM evidence WHERE Key_name = 'idx_file_hash_sha256'
    `);

    if (indexes.length > 0) {
      console.log('Hash index already exists');
      return;
    }

    // Add index on file_hash_sha256 column
    await connection.execute(`
      ALTER TABLE evidence ADD INDEX idx_file_hash_sha256 (file_hash_sha256)
    `);

    console.log('Hash index added successfully');

    // Verify index was created
    const [verifyIndexes] = await connection.execute(`
      SHOW INDEX FROM evidence WHERE Key_name = 'idx_file_hash_sha256'
    `);

    if (verifyIndexes.length > 0) {
      console.log('Hash index verified successfully');
    } else {
      throw new Error('Failed to create hash index');
    }

  } catch (error) {
    console.error('Error adding hash index:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
if (require.main === module) {
  addHashIndex()
    .then(() => {
      console.log('Hash index migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addHashIndex;
