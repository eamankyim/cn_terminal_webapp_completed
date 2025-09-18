import api from './api';

class FileService {
  async uploadFile(file, options = {}) {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('📁 FILE UPLOAD REQUEST');
      console.log('='.repeat(60));
      console.log('📄 File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      console.log('⚙️ Upload options:', options);

      const formData = new FormData();
      formData.append('file', file);
      
      // Add additional options
      if (options.folder) {
        formData.append('folder', options.folder);
        console.log('📁 Folder:', options.folder);
      }
      if (options.category) {
        formData.append('category', options.category);
        console.log('🏷️ Category:', options.category);
      }
      if (options.entityId) {
        formData.append('entityId', options.entityId);
        console.log('🔗 Entity ID:', options.entityId);
      }
      if (options.entityType) {
        formData.append('entityType', options.entityType);
        console.log('📋 Entity Type:', options.entityType);
      }

      console.log('📤 Sending upload request...');
      console.log('📋 FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      const response = await api.post('/files/upload', formData, {
        // Don't set Content-Type for FormData - let the browser set it with boundary
        onUploadProgress: (progressEvent) => {
          if (options.onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`📊 Upload progress: ${percentCompleted}%`);
            options.onProgress(percentCompleted);
          }
        },
      });

      console.log('✅ Upload successful!');
      console.log('📄 Response data:', response);
      console.log('='.repeat(60) + '\n');

      return response;
    } catch (error) {
      console.log('\n' + '='.repeat(60));
      console.log('💥 FILE UPLOAD ERROR');
      console.log('='.repeat(60));
      console.error('❌ Upload failed:', error);
      console.log('📄 Error response:', error.response?.data);
      console.log('📊 Error status:', error.response?.status);
      console.log('='.repeat(60) + '\n');
      
      throw new Error(error.message || 'Failed to upload file');
    }
  }

  async uploadMultipleFiles(files, options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Multiple file upload error:', error);
      throw new Error('Failed to upload files');
    }
  }

  async deleteFile(fileUrl) {
    try {
      const response = await api.delete('/files/delete', {
        data: { fileUrl }
      });
      return response;
    } catch (error) {
      console.error('File delete error:', error);
      throw new Error('Failed to delete file');
    }
  }

  async getFileInfo(fileId) {
    try {
      const response = await api.get(`/files/${fileId}`);
      return response;
    } catch (error) {
      console.error('Get file info error:', error);
      throw new Error('Failed to get file information');
    }
  }

  async getFilesByEntity(entityType, entityId) {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('📁 GET FILES BY ENTITY REQUEST');
      console.log('='.repeat(60));
      console.log('📋 Entity Type:', entityType);
      console.log('🔗 Entity ID:', entityId);
      
      const response = await api.get(`/files/entity/${entityType}/${entityId}`);
      
      console.log('✅ Files retrieved successfully!');
      console.log('📄 Response data:', response);
      console.log('📊 Files count:', response?.files?.length || 0);
      console.log('='.repeat(60) + '\n');
      
      return response;
    } catch (error) {
      console.log('\n' + '='.repeat(60));
      console.log('💥 GET FILES BY ENTITY ERROR');
      console.log('='.repeat(60));
      console.error('❌ Failed to get files:', error);
      console.log('📄 Error response:', error.response?.data);
      console.log('📊 Error status:', error.response?.status);
      console.log('='.repeat(60) + '\n');
      
      throw new Error('Failed to get files');
    }
  }

  async downloadFile(fileId) {
    try {
      const response = await api.get(`/files/download/${fileId}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('File download error:', error);
      throw new Error('Failed to download file');
    }
  }

  // Utility function to create download link
  createDownloadLink(fileUrl, fileName) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    return link;
  }

  // Utility function to validate file type
  validateFileType(file, allowedTypes) {
    if (!allowedTypes || allowedTypes.length === 0) return true;
    
    const fileType = file.type;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    return allowedTypes.some(type => 
      fileType.includes(type) || type.includes(fileExtension)
    );
  }

  // Utility function to validate file size
  validateFileSize(file, maxSizeInMB) {
    if (!maxSizeInMB) return true;
    
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  // Utility function to get file extension
  getFileExtension(fileName) {
    return fileName.split('.').pop().toLowerCase();
  }

  // Utility function to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileService = new FileService();

