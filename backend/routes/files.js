const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

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
    const folder = req.body.folder || 'general';
    const uploadPath = path.join(uploadsDir, folder);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
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
    console.log('\n' + '='.repeat(80));
    console.log('📤 FILE UPLOAD - BACKEND');
    console.log('='.repeat(80));
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { folder = 'general', category, entityId, entityType } = req.body;
    
    console.log('🔍 Upload details:');
    console.log('  - File name:', req.file.originalname);
    console.log('  - File size:', req.file.size);
    console.log('  - File type:', req.file.mimetype);
    console.log('  - Folder:', folder);
    console.log('  - Category:', category);
    console.log('  - Entity ID:', entityId);
    console.log('  - Entity Type:', entityType);
    console.log('  - Uploaded by:', req.user.id);
    
    // Create file record in database
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
        entityId: entityId ? parseInt(entityId) : null,
        entityType: entityType,
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      }
    });

    console.log('✅ File record created in database:');
    console.log('  - File ID:', fileRecord.id);
    console.log('  - Entity ID:', fileRecord.entityId);
    console.log('  - Entity Type:', fileRecord.entityType);
    console.log('  - URL:', fileRecord.url);

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

    console.log('📤 Response being sent:', response);
    console.log('='.repeat(80) + '\n');

    res.json(response);
  } catch (error) {
    console.log('\n' + '='.repeat(80));
    console.log('💥 FILE UPLOAD ERROR - BACKEND');
    console.log('='.repeat(80));
    console.error('❌ File upload error:', error);
    console.log('📄 Error message:', error.message);
    console.log('📊 Error stack:', error.stack);
    console.log('='.repeat(80) + '\n');
    
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
          entityId: entityId ? parseInt(entityId) : null,
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
    console.error('Multiple file upload error:', error);
    
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
    console.error('Get file error:', error);
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
    console.log('\n' + '='.repeat(80));
    console.log('📁 GET FILES BY ENTITY - BACKEND');
    console.log('='.repeat(80));
    
    const { entityType, entityId } = req.params;
    const entityIdInt = parseInt(entityId);
    
    console.log('🔍 Request params:');
    console.log('  - entityType:', entityType);
    console.log('  - entityId (string):', entityId);
    console.log('  - entityId (int):', entityIdInt);
    console.log('  - user ID:', req.user.id);

    const files = await prisma.file.findMany({
      where: {
        entityType: entityType,
        entityId: entityIdInt
      },
      orderBy: { uploadedAt: 'desc' }
    });

    console.log('📄 Files found in database:', files.length);
    console.log('📄 Files details:', files.map(f => ({
      id: f.id,
      originalName: f.originalName,
      entityType: f.entityType,
      entityId: f.entityId,
      url: f.url
    })));

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

    console.log('📤 Response being sent:', {
      success: response.success,
      filesCount: response.files.length
    });
    console.log('='.repeat(80) + '\n');

    res.json(response);
  } catch (error) {
    console.log('\n' + '='.repeat(80));
    console.log('💥 GET FILES BY ENTITY ERROR - BACKEND');
    console.log('='.repeat(80));
    console.error('❌ Get files by entity error:', error);
    console.log('📄 Error message:', error.message);
    console.log('📊 Error stack:', error.stack);
    console.log('='.repeat(80) + '\n');
    
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
    console.error('File download error:', error);
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
    console.error('File delete error:', error);
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





