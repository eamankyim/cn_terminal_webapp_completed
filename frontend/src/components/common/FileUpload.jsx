import React, { useState, useEffect } from 'react';
import { Upload, Button, message, Modal, Image, Typography, Space, Tag, Progress } from 'antd';
import { 
  UploadOutlined, 
  EyeOutlined, 
  DeleteOutlined, 
  FileTextOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined
} from '@ant-design/icons';
import { fileService } from '../../services/fileService';

const { Text } = Typography;

const FileUpload = ({
  multiple = true,
  maxCount = 5,
  accept = '*',
  listType = 'text',
  showPreview = true,
  showProgress = true,
  onFileChange,
  onFileRemove,
  onFileUpload,
  value = [],
  disabled = false,
  uploadText = 'Upload Files',
  ...props
}) => {
  const [fileList, setFileList] = useState(Array.isArray(value) ? value : []);
  
  // Update fileList when value prop changes
  useEffect(() => {
    if (value && Array.isArray(value) && value !== fileList) {
      setFileList(value);
    }
  }, [value]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const getFileIcon = (file) => {
    const type = file.type || '';
    if (type.startsWith('image/')) return <FileImageOutlined />;
    if (type.includes('pdf')) return <FilePdfOutlined />;
    if (type.includes('word') || type.includes('document')) return <FileWordOutlined />;
    if (type.includes('sheet') || type.includes('excel')) return <FileExcelOutlined />;
    return <FileOutlined />;
  };

  const getFileTypeColor = (file) => {
    const type = file.type || '';
    if (type.startsWith('image/')) return 'blue';
    if (type.includes('pdf')) return 'red';
    if (type.includes('word') || type.includes('document')) return 'blue';
    if (type.includes('sheet') || type.includes('excel')) return 'green';
    return 'default';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async (file) => {
    console.log('\n' + '='.repeat(60));
    console.log('📤 FILE UPLOAD COMPONENT');
    console.log('='.repeat(60));
    console.log('📄 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      uid: file.uid
    });
    console.log('⚙️ Upload options:', {
      hasCustomHandler: !!onFileUpload,
      multiple,
      maxCount,
      accept
    });

    setUploading(true);
    try {
      let response;
      
      if (onFileUpload) {
        console.log('🔧 Using custom upload handler...');
        response = await onFileUpload(file);
      } else {
        console.log('🔧 Using default upload handler...');
        response = await fileService.uploadFile(file, {
          folder: 'general',
          category: 'document'
        });
      }
      
      console.log('✅ Upload response received:', response);
      
      const newFile = {
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: response.file?.url || response.url,
        response: response,
        size: file.size,
        type: file.type,
        originFileObj: file // Keep reference to original file
      };

      console.log('📄 New file object created:', newFile);

      const newFileList = [...fileList, newFile];
      console.log('📋 Updated file list:', newFileList);
      
      setFileList(newFileList);
      
      if (onFileChange) {
        console.log('📞 Calling onFileChange callback...');
        onFileChange(newFileList);
      }

      console.log('✅ File upload completed successfully!');
      console.log('='.repeat(60) + '\n');
      
      message.success(`${file.name} uploaded successfully`);
      return false; // Prevent default upload
    } catch (error) {
      console.log('\n' + '='.repeat(60));
      console.log('💥 FILE UPLOAD COMPONENT ERROR');
      console.log('='.repeat(60));
      console.error('❌ Upload failed:', error);
      console.log('📄 Error details:', {
        message: error.message,
        stack: error.stack
      });
      console.log('='.repeat(60) + '\n');
      
      message.error(`Failed to upload ${file.name}`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (file) => {
    try {
      if (file.url) {
        await fileService.deleteFile(file.url);
      }
      
      const newFileList = fileList.filter(item => item.uid !== file.uid);
      setFileList(newFileList);
      
      if (onFileChange) {
        onFileChange(newFileList);
      }

      if (onFileRemove) {
        onFileRemove(file);
      }

      message.success('File removed successfully');
    } catch (error) {
      message.error('Failed to remove file');
      console.error('Remove error:', error);
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewFile(file);
    setPreviewVisible(true);
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const uploadProps = {
    name: 'file',
    multiple,
    accept,
    fileList: Array.isArray(fileList) ? fileList : [],
    beforeUpload: handleUpload,
    onRemove: handleRemove,
    onPreview: showPreview ? handlePreview : undefined,
    disabled,
    showUploadList: {
      showPreviewIcon: showPreview,
      showRemoveIcon: !disabled,
      showDownloadIcon: false,
    },
    ...props
  };

  const renderFileList = () => {
    if (listType === 'picture-card') {
      return (
        <Upload {...uploadProps}>
          {Array.isArray(fileList) && fileList.length >= maxCount ? null : (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>{uploadText}</div>
            </div>
          )}
        </Upload>
      );
    }

    return (
      <div>
        <Upload {...uploadProps}>
          <Button 
            icon={<UploadOutlined />} 
            disabled={disabled || fileList.length >= maxCount}
            loading={uploading}
          >
            {uploadText}
          </Button>
        </Upload>
        
        {Array.isArray(fileList) && fileList.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {fileList.map((file, index) => (
              <div 
                key={file.uid || index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  backgroundColor: '#fafafa'
                }}
              >
                <div style={{ marginRight: 12, fontSize: '16px' }}>
                  {getFileIcon(file)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {file.name}
                  </div>
                  <Space size="small">
                    <Tag color={getFileTypeColor(file)} size="small">
                      {file.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {formatFileSize(file.size)}
                    </Text>
                    {file.status === 'uploading' && showProgress && (
                      <Progress 
                        percent={file.percent || 0} 
                        size="small" 
                        style={{ width: '100px' }}
                      />
                    )}
                  </Space>
                </div>
                <Space>
                  {showPreview && (
                    <Button 
                      type="text" 
                      icon={<EyeOutlined />} 
                      size="small"
                      onClick={() => handlePreview(file)}
                    />
                  )}
                  {!disabled && (
                    <Button 
                      type="text" 
                      icon={<DeleteOutlined />} 
                      size="small"
                      danger
                      onClick={() => handleRemove(file)}
                    />
                  )}
                </Space>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderFileList()}
      
      <Modal
        open={previewVisible}
        title="File Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        {previewFile && (
          <div>
            {previewFile.type?.startsWith('image/') ? (
              <Image
                alt={previewFile.name}
                style={{ width: '100%' }}
                src={previewFile.url || previewFile.preview}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {getFileIcon(previewFile)}
                </div>
                <Text strong>{previewFile.name}</Text>
                <br />
                <Text type="secondary">
                  {formatFileSize(previewFile.size)} • {previewFile.type}
                </Text>
                <br />
                <Button 
                  type="primary" 
                  href={previewFile.url} 
                  target="_blank"
                  style={{ marginTop: '16px' }}
                >
                  Download File
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FileUpload;

