# File Upload System Guide

## Overview

The CN Terminal Web App now includes a comprehensive file upload and management system that allows users to upload, organize, preview, and manage files across the application.

## Features

### 🚀 Core Features
- **Multi-file Upload**: Upload multiple files simultaneously
- **File Type Validation**: Support for images, PDFs, documents, spreadsheets, and archives
- **File Size Limits**: Configurable file size limits (default: 10MB)
- **Progress Tracking**: Real-time upload progress indicators
- **File Preview**: Built-in preview for images and file information
- **File Management**: Organize files by folders and categories
- **Search & Filter**: Advanced search and filtering capabilities
- **Download Support**: Easy file downloading with proper naming

### 📁 File Organization
- **Folders**: Organize files into logical folders (documents, images, invoices, etc.)
- **Categories**: Tag files with custom categories
- **Entity Association**: Link files to specific entities (jobs, consignments, customers)
- **Metadata Tracking**: Track uploader, upload date, file size, and type

## Components

### FileUpload Component
Located at `src/components/common/FileUpload.jsx`

**Props:**
- `multiple` (boolean): Allow multiple file selection
- `maxCount` (number): Maximum number of files (default: 5)
- `accept` (string): Accepted file types (default: '*')
- `listType` (string): Display type ('text' or 'picture-card')
- `showPreview` (boolean): Enable file preview (default: true)
- `showProgress` (boolean): Show upload progress (default: true)
- `onFileChange` (function): Callback when file list changes
- `onFileRemove` (function): Callback when file is removed
- `value` (array): Current file list
- `disabled` (boolean): Disable upload functionality
- `uploadText` (string): Custom upload button text

**Usage Example:**
```jsx
import FileUpload from '../components/common/FileUpload';

<FileUpload
  multiple={true}
  maxCount={5}
  accept="image/*,application/pdf"
  onFileChange={(fileList) => setFiles(fileList)}
  uploadText="Upload Documents"
/>
```

### File Service
Located at `src/services/fileService.js`

**Methods:**
- `uploadFile(file, options)`: Upload a single file
- `uploadMultipleFiles(files, options)`: Upload multiple files
- `deleteFile(fileUrl)`: Delete a file
- `getFileInfo(fileId)`: Get file information
- `getFilesByEntity(entityType, entityId)`: Get files by entity
- `downloadFile(fileId)`: Download a file
- `createDownloadLink(fileUrl, fileName)`: Create download link
- `validateFileType(file, allowedTypes)`: Validate file type
- `validateFileSize(file, maxSizeInMB)`: Validate file size

## Backend API

### File Upload Endpoints

#### Upload Single File
```
POST /api/files/upload
Content-Type: multipart/form-data

Body:
- file: File object
- folder: string (optional)
- category: string (optional)
- entityId: string (optional)
- entityType: string (optional)
```

#### Upload Multiple Files
```
POST /api/files/upload-multiple
Content-Type: multipart/form-data

Body:
- files: File[] array
- folder: string (optional)
- category: string (optional)
- entityId: string (optional)
- entityType: string (optional)
```

#### Get File Information
```
GET /api/files/:id
```

#### Get Files by Entity
```
GET /api/files/entity/:entityType/:entityId
```

#### Download File
```
GET /api/files/download/:id
```

#### Delete File
```
DELETE /api/files/delete
Body: { fileUrl: string }
```

### File Storage
- Files are stored in `backend/uploads/` directory
- Organized by folders (general, documents, images, etc.)
- Unique filenames generated to prevent conflicts
- Database records track file metadata

## Database Schema

### File Model
```prisma
model File {
  id           String   @id @default(cuid())
  originalName String
  filename     String
  path         String
  url          String
  mimeType     String
  size         Int
  folder       String   @default("general")
  category     String?
  entityId     String?
  entityType   String?
  uploadedBy   String
  uploadedAt   DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  uploadedByUser User @relation(fields: [uploadedBy], references: [id])
}
```

## Integration Examples

### Jobs Page Integration
```jsx
import FileUpload from '../components/common/FileUpload';

const handleFileChange = (fileList) => {
  form.setFieldsValue({ documents: fileList });
};

<Form.Item label="Documents" name="documents">
  <FileUpload
    multiple={true}
    maxCount={5}
    accept="*"
    onFileChange={handleFileChange}
    uploadText="Upload Documents"
  />
</Form.Item>
```

### Consignment Form Integration
```jsx
<FileUpload
  multiple={true}
  maxCount={3}
  accept="image/*,application/pdf"
  folder="consignments"
  category="consignment-docs"
  entityType="consignment"
  entityId={consignmentId}
  onFileChange={handleFileChange}
/>
```

## File Management Page

A dedicated file management page is available at `/files` that provides:
- File listing with search and filters
- File statistics and analytics
- Bulk file operations
- File preview and download
- File organization tools

## Security Features

- **File Type Validation**: Only allowed file types can be uploaded
- **Size Limits**: Configurable file size restrictions
- **Authentication**: All upload operations require authentication
- **Path Sanitization**: File paths are sanitized to prevent directory traversal
- **Unique Filenames**: Generated unique filenames prevent conflicts

## Configuration

### File Type Restrictions
```javascript
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
```

### Size Limits
- Default maximum file size: 10MB
- Maximum files per request: 5
- Configurable in multer configuration

## Error Handling

The system includes comprehensive error handling:
- File type validation errors
- File size limit errors
- Upload progress errors
- Network connectivity issues
- Server-side processing errors

## Performance Considerations

- **Chunked Uploads**: Large files are handled efficiently
- **Progress Tracking**: Real-time upload progress
- **Async Processing**: Non-blocking file operations
- **Database Indexing**: Optimized queries for file retrieval
- **Caching**: File metadata caching for better performance

## Future Enhancements

- **Cloud Storage**: Integration with AWS S3, Google Cloud Storage
- **Image Processing**: Automatic image resizing and optimization
- **File Versioning**: Track file versions and changes
- **Bulk Operations**: Mass file operations and management
- **Advanced Search**: Full-text search within files
- **File Sharing**: Generate shareable links for files
- **Virus Scanning**: Automatic virus scanning for uploaded files

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check file type and size limits
2. **Preview Not Working**: Ensure file URL is accessible
3. **Download Issues**: Verify file exists on server
4. **Permission Errors**: Check user authentication and file permissions

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.






