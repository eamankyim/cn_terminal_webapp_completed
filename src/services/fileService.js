import api from './api';

class FileService {
  async uploadFile(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add additional options
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      if (options.category) {
        formData.append('category', options.category);
      }
      if (options.entityId) {
        formData.append('entityId', options.entityId);
      }
      if (options.entityType) {
        formData.append('entityType', options.entityType);
      }

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            options.onProgress(percentCompleted);
          }
        },
      });

      return response.data;
    } catch (error) {

      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  }

  async uploadMultipleFiles(files, options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {

      throw new Error('Failed to upload files');
    }
  }

  async deleteFile(fileUrl) {
    try {
      const response = await api.delete('/files/delete', {
        data: { fileUrl }
      });
      return response.data;
    } catch (error) {

      throw new Error('Failed to delete file');
    }
  }

  async getFileInfo(fileId) {
    try {
      const response = await api.get(`/files/${fileId}`);
      return response.data;
    } catch (error) {

      throw new Error('Failed to get file information');
    }
  }

  async getFilesByEntity(entityType, entityId) {
    try {
      const response = await api.get(`/files/entity/${entityType}/${entityId}`);
      return response.data;
    } catch (error) {

      throw new Error('Failed to get files');
    }
  }

  async downloadFile(fileId) {
    try {
      const response = await api.get(`/files/download/${fileId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {

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

