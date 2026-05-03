const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Configuration with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

// Role hierarchy for permissions
const roleHierarchy = {
  admin: ['admin', 'officer', 'forensic'],
  officer: ['officer', 'forensic'],
  forensic: ['forensic']
};

// Check if user has required role or higher
const hasRolePermission = (userRole, requiredRole) => {
  return roleHierarchy[userRole]?.includes(requiredRole) || false;
};

// Role-based authentication middleware
const roleAuth = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid.'
        });
      }

      // Check if user has required role
      const hasPermission = Array.isArray(requiredRoles) 
        ? requiredRoles.some(role => hasRolePermission(user.role, role))
        : hasRolePermission(user.role, requiredRoles);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid.'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired.'
        });
      }

      console.error('Role authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authentication.'
      });
    }
  };
};

// Resource ownership middleware
const requireOwnership = (resourceType, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = parseInt(req.params[resourceIdParam]);
      
      if (!resourceId || isNaN(resourceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid resource ID.'
        });
      }

      // Admins can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Check ownership based on resource type
      let hasOwnership = false;
      
      switch (resourceType) {
        case 'case':
          const Case = require('../models/Case');
          const caseItem = await Case.findById(resourceId);
          hasOwnership = caseItem && (caseItem.assigned_officer_id === req.user.id || caseItem.created_by === req.user.id);
          break;
          
        case 'evidence':
          const Evidence = require('../models/Evidence');
          const evidence = await Evidence.findById(resourceId);
          hasOwnership = evidence && evidence.collected_by === req.user.id;
          break;
          
        case 'user':
          hasOwnership = resourceId === req.user.id;
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type.'
          });
      }

      if (!hasOwnership) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during ownership verification.'
      });
    }
  };
};

// Rate limiting middleware for sensitive operations
const rateLimitSensitive = (req, res, next) => {
  // Simple in-memory rate limiter for sensitive operations
  const sensitiveOperations = new Map();
  const key = `${req.user?.id || req.ip}:${req.path}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 10; // Max 10 sensitive operations per 15 minutes

  if (!sensitiveOperations.has(key)) {
    sensitiveOperations.set(key, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const data = sensitiveOperations.get(key);
  
  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + windowMs;
    return next();
  }

  if (data.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((data.resetTime - now) / 1000)
    });
  }

  data.count++;
  next();
};

// Audit logging middleware
const auditLog = (action, resourceType) => {
  return (req, res, next) => {
    // Store audit information for later use
    req.auditInfo = {
      action,
      resourceType,
      resourceId: req.params.id || req.body.id || null,
      userId: req.user?.id || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    };
    
    // Override res.json to log the response
    const originalJson = res.json;
    res.json = function(data) {
      if (req.auditInfo && req.user) {
        // Log audit trail asynchronously
        setImmediate(() => {
          const AuditLog = require('../models/AuditLog');
          AuditLog.create({
            ...req.auditInfo,
            details: JSON.stringify({
              method: req.method,
              url: req.originalUrl,
              body: req.body,
              response: data
            })
          }).catch(err => {
            console.error('Audit log error:', err);
          });
        });
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Base authentication middleware for reuse
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Specific role middleware functions
const adminOnly = [authenticateToken, roleAuth(['admin'])];
const adminOrOfficer = [authenticateToken, roleAuth(['admin', 'officer'])];
const anyAuthenticated = [authenticateToken, roleAuth(['admin', 'officer', 'forensic'])];

// Ownership-based access
const ownResourceOnly = (resourceType, resourceIdParam) => [
  authenticateToken,
  requireOwnership(resourceType, resourceIdParam)
];

// Admin or resource owner
const adminOrOwner = (resourceType, resourceIdParam) => {
  return async (req, res, next) => {
    try {
      await authenticateToken(req, res, async () => {
        if (req.user.role === 'admin') {
          return next();
        }
        
        await requireOwnership(resourceType, resourceIdParam)(req, res, next);
      });
    } catch (error) {
      next(error);
    }
  };
};

// Define requireRole function for export
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const hasPermission = Array.isArray(roles) 
      ? roles.some(role => hasRolePermission(req.user.role, role))
      : hasRolePermission(req.user.role, roles);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = {
  roleAuth,
  authenticateToken,
  requireRole,
  requireOwnership,
  adminOnly,
  adminOrOfficer,
  anyAuthenticated,
  ownResourceOnly,
  adminOrOwner,
  rateLimitSensitive,
  auditLog,
  hasRolePermission
};
