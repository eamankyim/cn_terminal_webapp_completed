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
    cb(null, true);
  } else {
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
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log('🔷 [Files API] POST /files/upload');
    console.log('  - User:', req.user?.email);
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('✅ File received:', req.file.originalname);
    console.log('  - Size:', req.file.size, 'bytes');
    console.log('  - Saved to:', req.file.path);
    console.log('  - Filename:', req.file.filename);
    
    const { folder = 'general', category, entityId, entityType } = req.body;
    
    console.log('  - Metadata:');
    console.log('    - folder:', folder);
    console.log('    - category:', category);
    console.log('    - entityId:', entityId);
    console.log('    - entityType:', entityType);

    // Create file record in database
    console.log('  - Creating file record in database...');
    const fileRecord = await prisma.file.create({
      data: {
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
      }
    });
    
    console.log('✅ File record created:');
    console.log('  - ID:', fileRecord.id);
    console.log('  - Original Name:', fileRecord.originalName);
    console.log('  - Entity ID:', fileRecord.entityId);
    console.log('  - Entity Type:', fileRecord.entityType);

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
        uploadedAt: fileRecord.uploadedAt
      }
    };

    res.json(response);
  } catch (error) {

    // Clean up uploaded file if database operation fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
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

    // Clean up uploaded files if database operation fails
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
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
      fs.unlinkSync(file.path);
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

