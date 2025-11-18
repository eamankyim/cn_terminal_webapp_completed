const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { hasPermission, PERMISSIONS } = require('../utils/permissions');

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const folder = req.body?.folder || 'general';
      const uploadPath = path.join(uploadsDir, folder);
      
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    } catch (error) {
      console.error('❌ [Multer] Destination error:', error.message);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const filename = file.fieldname + '-' + uniqueSuffix + extension;
      cb(null, filename);
    } catch (error) {
      console.error('❌ [Multer] Filename error:', error.message);
      cb(error);
    }
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('🔷 [Multer] File filter checking:', file.originalname);
  console.log('  - MIME type:', file.mimetype);
  console.log('  - Field name:', file.fieldname);
  
  // Define allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    console.log('  ✅ File type allowed');
    cb(null, true);
  } else {
    console.error('  ❌ File type not allowed:', file.mimetype);
    cb(new Error('Invalid file type. Only images, PDFs, documents, and archives are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Upload single file
router.post('/upload', authenticateToken, (req, res, next) => {
  console.log('\n🔷 [Files API] ========== FILE UPLOAD REQUEST START ==========');
  console.log('  - Timestamp:', new Date().toISOString());
  console.log('  - Request method:', req.method);
  console.log('  - Request URL:', req.originalUrl);
  console.log('  - User:', req.user?.email || 'NOT AUTHENTICATED');
  console.log('  - User ID:', req.user?.id || 'N/A');
  console.log('  - Request headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers['authorization'] ? 'Bearer ***' : 'MISSING'
  });
  console.log('  - Request body keys:', Object.keys(req.body || {}));
  console.log('  - Request body:', req.body);
  console.log('  - Has file in request (before multer):', !!req.file);
  console.log('  - Has files in request (before multer):', !!req.files);
  next();
}, upload.single('file'), async (req, res) => {
  try {
    console.log('\n🔷 [Files API] After multer processing:');
    console.log('  - Has file in request:', !!req.file);
    console.log('  - Has files in request:', !!req.files);
    
    if (!req.file) {
      console.error('❌ [Files API] No file in request after multer processing');
      console.error('  - Request body:', req.body);
      console.error('  - Request files:', req.files);
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    console.log('\n✅ [Files API] File received successfully:');
    console.log('  - Original name:', req.file.originalname);
    console.log('  - File size:', req.file.size, 'bytes');
    console.log('  - File mimetype:', req.file.mimetype);
    console.log('  - File encoding:', req.file.encoding);
    console.log('  - Saved to:', req.file.path);
    console.log('  - Filename:', req.file.filename);
    console.log('  - Fieldname:', req.file.fieldname);
    console.log('  - Destination:', req.file.destination);
    
    const { folder = 'general', category, entityId, entityType } = req.body;
    console.log('\n🔷 [Files API] Upload metadata:');
    console.log('  - Folder:', folder);
    console.log('  - Category:', category);
    console.log('  - Entity ID:', entityId);
    console.log('  - Entity Type:', entityType);

    // Create file record in database
    console.log('\n🔷 [Files API] Creating file record in database...');
    const dbStartTime = Date.now();
    const fileData = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      url: `/uploads/${folder}/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      folder: folder,
      category: category,
      entityId: entityId || null,  // Keep as string to match database schema
      entityType: entityType,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };
    console.log('  - File data to insert:', {
      originalName: fileData.originalName,
      filename: fileData.filename,
      url: fileData.url,
      size: fileData.size,
      folder: fileData.folder,
      category: fileData.category,
      entityId: fileData.entityId,
      entityType: fileData.entityType,
      uploadedBy: fileData.uploadedBy
    });
    
    const fileRecord = await prisma.file.create({
      data: fileData
    });
    
    const dbTime = Date.now() - dbStartTime;
    console.log('\n✅ [Files API] File record created successfully in', dbTime, 'ms');
    console.log('  - File record ID:', fileRecord.id);
    console.log('  - Original Name:', fileRecord.originalName);
    console.log('  - Filename:', fileRecord.filename);
    console.log('  - URL:', fileRecord.url);
    console.log('  - Entity ID:', fileRecord.entityId);
    console.log('  - Entity Type:', fileRecord.entityType);
    console.log('  - Uploaded By:', fileRecord.uploadedBy);
    console.log('  - Uploaded At:', fileRecord.uploadedAt);

    const response = {
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        filename: fileRecord.filename,
        url: fileRecord.url,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        folder: fileRecord.folder,
        category: fileRecord.category,
        entityId: fileRecord.entityId,
        entityType: fileRecord.entityType,
        uploadedAt: fileRecord.uploadedAt
      }
    };

    console.log('\n✅ [Files API] Sending success response:');
    console.log('  - Success:', response.success);
    console.log('  - File ID:', response.file.id);
    console.log('  - File URL:', response.file.url);
    console.log('  - File size:', response.file.size, 'bytes');
    console.log('  - Entity ID:', response.file.entityId);
    console.log('  - Entity Type:', response.file.entityType);
    console.log('🔷 [Files API] ========== FILE UPLOAD REQUEST END (SUCCESS) ==========\n');
    
    res.json(response);
  } catch (error) {
    console.error('\n❌ [Files API] ========== FILE UPLOAD ERROR ==========');
    console.error('  - Error name:', error.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error code:', error.code);
    console.error('  - Error stack:', error.stack);
    
    // Log Prisma-specific errors
    if (error.code) {
      console.error('  - Prisma error code:', error.code);
      console.error('  - Prisma meta:', error.meta);
    }
    
    // Log request context for debugging
    console.error('  - Request context:');
    console.error('    - User:', req.user?.email);
    console.error('    - File received:', !!req.file);
    console.error('    - File path:', req.file?.path);
    console.error('    - Body:', req.body);

    // Clean up uploaded file if database operation fails
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        console.log('  - Attempting to clean up uploaded file:', req.file.path);
        fs.unlinkSync(req.file.path);
        console.log('  ✅ Cleaned up uploaded file successfully');
      } catch (cleanupError) {
        console.error('  ❌ Failed to clean up file:', cleanupError.message);
        console.error('    - Cleanup error stack:', cleanupError.stack);
      }
    }

    console.error('🔷 [Files API] ========== FILE UPLOAD REQUEST END (ERROR) ==========\n');
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload file',
      error: error.message 
    });
  }
});

// Upload multiple files
router.post('/upload-multiple', authenticateToken, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { folder = 'general', category, entityId, entityType } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      const fileRecord = await prisma.file.create({
        data: {
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          url: `/uploads/${folder}/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          folder: folder,
          category: category,
          entityId: entityId || null,  // Keep as string to match database schema
          entityType: entityType,
          uploadedBy: req.user.id,
          uploadedAt: new Date()
        }
      });

      uploadedFiles.push({
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        filename: fileRecord.filename,
        url: fileRecord.url,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        folder: fileRecord.folder,
        category: fileRecord.category,
        uploadedAt: fileRecord.uploadedAt
      });
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('❌ [Files API] Multiple upload error:', error);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);

    // Clean up uploaded files if database operation fails
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
          fs.unlinkSync(file.path);
            console.log('✅ Cleaned up uploaded file:', file.path);
          } catch (cleanupError) {
            console.error('❌ Failed to clean up file:', file.path, cleanupError.message);
          }
        }
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload files',
      error: error.message 
    });
  }
});

// Get file by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json({
      success: true,
      file: {
        id: file.id,
        originalName: file.originalName,
        filename: file.filename,
        url: file.url,
        mimeType: file.mimeType,
        size: file.size,
        folder: file.folder,
        category: file.category,
        entityId: file.entityId,
        entityType: file.entityType,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.uploadedAt
      }
    });
  } catch (error) {
    console.error('❌ [Files API] Get file by ID error:', error);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);

    res.status(500).json({ 
      success: false, 
      message: 'Failed to get file',
      error: error.message 
    });
  }
});

// Get files by entity
router.get('/entity/:entityType/:entityId', authenticateToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    console.log('🔷 [Files API] GET /files/entity/:entityType/:entityId');
    console.log('  - Entity Type:', entityType);
    console.log('  - Entity ID:', entityId);
    console.log('  - Requesting User:', req.user?.email);

    console.log('  - Querying database with WHERE conditions:');
    console.log('    entityType:', entityType);
    console.log('    entityId:', entityId);

    const files = await prisma.file.findMany({
      where: {
        entityType: entityType,
        entityId: entityId  // Keep as string to match database schema
      },
      orderBy: { uploadedAt: 'desc' }
    });

    console.log('✅ [Files API] Found', files.length, 'files');
    if (files.length > 0) {
      console.log('  - Files:', files.map(f => ({
        id: f.id,
        originalName: f.originalName,
        entityType: f.entityType,
        entityId: f.entityId
      })));
    } else {
      console.log('⚠️ [Files API] No files found for this entity');
      console.log('  - Let me check all files in database...');
      const allFiles = await prisma.file.findMany({
        select: { id: true, originalName: true, entityType: true, entityId: true }
      });
      console.log('  - Total files in database:', allFiles.length);
      console.log('  - Sample files:', allFiles.slice(0, 5));
    }

    const response = {
      success: true,
      files: files.map(file => ({
        id: file.id,
        originalName: file.originalName,
        filename: file.filename,
        url: file.url,
        mimeType: file.mimeType,
        size: file.size,
        folder: file.folder,
        category: file.category,
        uploadedAt: file.uploadedAt
      }))
    };

    console.log('  - Sending response with', response.files.length, 'files\n');
    res.json(response);
  } catch (error) {
    console.error('❌ [Files API] Error getting files:', error);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get files',
      error: error.message 
    });
  }
});

// Download file
router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    res.download(file.path, file.originalName);
  } catch (error) {
    console.error('❌ [Files API] Download error:', error);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);

    res.status(500).json({ 
      success: false, 
      message: 'Failed to download file',
      error: error.message 
    });
  }
});

// Delete file
router.delete('/delete', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission to delete files
    if (!hasPermission(req.user.role, PERMISSIONS.FILE_DELETE)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions to delete files' 
      });
    }

    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ message: 'File URL is required' });
    }

    const file = await prisma.file.findFirst({
      where: { url: fileUrl }
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      try {
      fs.unlinkSync(file.path);
        console.log('✅ Deleted file from disk:', file.path);
      } catch (diskError) {
        console.error('❌ Failed to delete file from disk:', diskError.message);
        // Continue with database deletion even if disk deletion fails
      }
    }

    // Delete file record from database
    await prisma.file.delete({
      where: { id: file.id }
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('❌ [Files API] Delete error:', error);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);

    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete file',
      error: error.message 
    });
  }
});

// Serve static files
router.use('/uploads', express.static(uploadsDir));

module.exports = router;

