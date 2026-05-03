const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Logs
console.log('JWT Configuration:');
console.log('- Secret:', JWT_SECRET ? '✅ Loaded' : '❌ Missing (using fallback)');
console.log('- Expire:', JWT_EXPIRE);
console.log('- Environment:', process.env.NODE_ENV || 'development');

// ✅ FIXED CORS (supports Vite + others)
const corsOptions = {
  origin: [
    'http://localhost:5173',  // 🔥 Vite frontend
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Preflight
app.options('*', cors(corsOptions));

// Serve uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ✅ TEST ROUTE
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'Backend working 🚀',
    origin: req.headers.origin
  });
});

// ROUTES
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cases', require('./routes/caseRoutes'));
app.use('/api/evidence', require('./routes/evidenceRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/intelligence', require('./routes/intelligenceRoutes'));

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    time: new Date()
  });
});

// DOCS ROUTE
app.get('/docs', (req, res) => {
  res.status(200).json({
    message: 'DEMS API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      cases: '/api/cases',
      evidence: '/api/evidence',
      audit: '/api/audit',
      intelligence: '/api/intelligence',
      health: '/health',
      test: '/api/test'
    }
  });
});

// ERROR HANDLING
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 Handler
app.use('*', notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server started successfully!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`✨ Ready!\n`);
});

module.exports = app;