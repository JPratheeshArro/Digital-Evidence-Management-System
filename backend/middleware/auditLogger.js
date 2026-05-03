const AuditLog = require('../models/AuditLog');

const auditLogger = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original res.json to intercept responses
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the action after response is sent
      setImmediate(async () => {
        try {
          await logAuditEntry(req, action, resourceType, data);
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      });
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Function to log audit entries
const logAuditEntry = async (req, action, resourceType, responseData) => {
  try {
    // Only log successful operations
    if (responseData && responseData.success === false) {
      return;
    }

    const userId = req.user ? req.user.id : null;
    const resourceId = req.params.id || null;
    
    // Extract relevant details based on action and resource type
    let details = extractDetails(req, action, resourceType, responseData);

    const logData = {
      user_id: userId,
      action: action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details,
      ip_address: getClientIp(req),
      user_agent: req.get('User-Agent')
    };

    await AuditLog.create(logData);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// Extract relevant details from request and response
const extractDetails = (req, action, resourceType, responseData) => {
  const details = {};

  try {
    switch (action) {
      case 'UPLOAD':
        details = {
          file_name: req.file ? req.file.originalname : 'Multiple files',
          file_size: req.file ? req.file.size : 'Multiple files',
          case_id: req.body.case_id,
          description: req.body.description
        };
        break;

      case 'UPDATE':
        details = {
          updated_fields: Object.keys(req.body),
          case_id: req.body.case_id,
          description: req.body.description,
          location: req.body.location
        };
        break;

      case 'VIEW':
        details = {
          evidence_id: req.params.id,
          file_name: responseData.data ? responseData.data.original_name : null
        };
        break;

      case 'DOWNLOAD':
        details = {
          evidence_id: req.params.id,
          file_name: responseData.data ? responseData.data.original_name : null,
          file_size: responseData.data ? responseData.data.file_size : null
        };
        break;

      case 'VERIFY':
        details = {
          evidence_id: req.params.id,
          integrity_status: responseData.data ? responseData.data.status : null,
          verification_result: responseData.data ? responseData.data.valid : null
        };
        break;

      case 'DELETE':
        details = {
          evidence_id: req.params.id,
          file_name: responseData.data ? responseData.data.original_name : null
        };
        break;

      case 'LOGIN':
        details = {
          email: req.body.email,
          login_success: responseData.success
        };
        break;

      case 'LOGOUT':
        details = {
          user_id: req.user ? req.user.id : null
        };
        break;

      default:
        details = {
          method: req.method,
          url: req.originalUrl,
          body: sanitizeRequestBody(req.body)
        };
    }
  } catch (error) {
    console.error('Error extracting audit details:', error);
    details = { error: 'Failed to extract details' };
  }

  return JSON.stringify(details);
};

// Sanitize request body to remove sensitive information
const sanitizeRequestBody = (body) => {
  if (!body) return null;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

// Get client IP address
const getClientIp = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         null;
};

// Manual audit logging function for custom actions
const logAction = async (userId, action, resourceType, resourceId, details, req = null) => {
  try {
    const logData = {
      user_id: userId,
      action: action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: typeof details === 'string' ? details : JSON.stringify(details),
      ip_address: req ? getClientIp(req) : null,
      user_agent: req ? req.get('User-Agent') : null
    };

    await AuditLog.create(logData);
  } catch (error) {
    console.error('Failed to create manual audit log:', error);
  }
};

// Middleware to log all requests (optional, for comprehensive logging)
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    // Only log successful requests
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const duration = Date.now() - start;
        const action = mapMethodToAction(req.method);
        
        if (action) {
          await logAuditEntry(req, action, getRequestResourceType(req), {
            statusCode: res.statusCode,
            duration: duration
          });
        }
      } catch (error) {
        console.error('Request logging error:', error);
      }
    }
  });
  
  next();
};

// Helper function to map HTTP methods to actions
const mapMethodToAction = (method) => {
  const methodMap = {
    'GET': 'VIEW',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };
  
  return methodMap[method] || null;
};

// Helper function to determine resource type from request
const getRequestResourceType = (req) => {
  const path = req.path;
  
  if (path.includes('/evidence')) return 'evidence';
  if (path.includes('/cases')) return 'case';
  if (path.includes('/users')) return 'user';
  if (path.includes('/auth')) return 'auth';
  
  return 'system';
};

module.exports = {
  auditLogger,
  logAction,
  requestLogger
};
