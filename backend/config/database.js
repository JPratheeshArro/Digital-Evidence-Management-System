const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 🔍 Debug logs (temporary - remove later)
console.log("ENV CHECK:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "[SET]" : "[NOT SET]");
console.log("DB_NAME:", process.env.DB_NAME);

// ✅ Strong config (no weak defaults)
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1', // 🔥 force TCP
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'dems',
  port: 3306, // 🔥 explicit port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log('\nDatabase Configuration:');
console.log('Host:', dbConfig.host);
console.log('User:', dbConfig.user);
console.log('Database:', dbConfig.database);

// ✅ Create pool
const pool = mysql.createPool(dbConfig);

// ✅ Test connection immediately
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('\n✅ Database connected successfully!');
    console.log(`📍 Host: ${dbConfig.host}`);
    console.log(`👤 User: ${dbConfig.user}`);
    console.log(`💾 Database: ${dbConfig.database}`);
    connection.release();
  } catch (err) {
    console.error('\n❌ Database connection failed:', err.message);

    console.log('\n💡 Troubleshooting tips:');
    console.log('- Check if MySQL service is running');
    console.log('- Verify DB_HOST is 127.0.0.1 (not localhost)');
    console.log('- Confirm DB_USER and DB_PASSWORD are correct');
    console.log('- Ensure MySQL is listening on port 3306');
  }
})();

module.exports = pool;