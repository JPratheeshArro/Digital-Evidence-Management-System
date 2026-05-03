const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileIntegrity = require('../utils/fileIntegrity');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create a subdirectory based on date
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateDir = path.join(uploadsDir, year.toString(), month, day);
    
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
    
    cb(null, dateDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Enhanced file filter with stricter security validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images - more restrictive for security
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    // Documents - only safe formats
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Videos - common formats only
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    // Audio - safe formats
    'audio/mp3',
    'audio/wav',
    'audio/mpeg',
    // Archives - limited to safe formats
    'application/zip',
    'application/x-7z-compressed'
  ];

  // Check file extension matches MIME type (prevents MIME type spoofing)
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeToExt = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/bmp': ['.bmp'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    'video/mp4': ['.mp4'],
    'video/avi': ['.avi'],
    'video/mov': ['.mov'],
    'video/wmv': ['.wmv'],
    'audio/mp3': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/mpeg': ['.mpeg'],
    'application/zip': ['.zip'],
    'application/x-7z-compressed': ['.7z']
  };

  // Validate MIME type is allowed
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: images (JPG, PNG, GIF, BMP, WEBP), documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV), videos (MP4, AVI, MOV, WMV), audio (MP3, WAV, MPEG), and archives (ZIP, 7Z).`), false);
  }

  // Validate extension matches MIME type
  const allowedExts = mimeToExt[file.mimetype] || [];
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`File extension ${ext} does not match the declared file type ${file.mimetype}. This could indicate a malicious file.`), false);
  }

  // Check for dangerous file names
  const dangerousPatterns = [
    /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|php|asp|aspx|jsp|sh|py|pl|rb)$/i,
    /\.(hta|msi|deb|rpm|dmg|pkg|app|img|iso)$/i,
    /\.(reg|inf|sys|dll|ocx|cpl)$/i
  ];

  const isDangerous = dangerousPatterns.some(pattern => pattern.test(file.originalname));
  if (isDangerous) {
    return cb(new Error(`File name contains potentially dangerous extension. Executable and script files are not allowed.`), false);
  }

  // Check for suspicious file names
  const suspiciousNames = [
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
    /^\./,
    /[<>:"|?*\x00-\x1f]/
  ];

  const isSuspicious = suspiciousNames.some(pattern => pattern.test(file.originalname));
  if (isSuspicious) {
    return cb(new Error(`File name contains invalid characters or reserved names. Please rename the file.`), false);
  }

  cb(null, true);
};

// Configure multer with enhanced security limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size (reduced for security)
    files: 5, // Maximum 5 files at once (reduced for security)
    fields: 20, // Maximum 20 form fields
    fieldNameSize: 100, // Maximum field name size
    fieldSize: 1024 * 1024 // Maximum field value size (1MB)
  }
});

// Middleware to generate file hash after upload
const generateFileHash = async (req, res, next) => {
  try {
    if (req.file) {
      // Generate SHA-256 hash for the uploaded file
      const hash = await FileIntegrity.generateSHA256(req.file.path);
      req.file.hash = hash;
    }
    
    if (req.files && Array.isArray(req.files)) {
      // Generate hashes for multiple files
      req.files = await Promise.all(req.files.map(async (file) => {
        const hash = await FileIntegrity.generateSHA256(file.path);
        return { ...file, hash };
      }));
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware for single file upload
const uploadSingle = [
  upload.single('file'),
  generateFileHash
];

// Middleware for multiple files upload
const uploadMultiple = [
  upload.array('files', 10),
  generateFileHash
];

// Helper function to get file type from MIME type
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('text')) return 'document';
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) return 'archive';
  return 'other';
};

// Helper function to get relative file path
const getRelativeFilePath = (filePath) => {
  return path.relative(process.cwd(), filePath);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  getFileType,
  getRelativeFilePath,
  uploadsDir
};
