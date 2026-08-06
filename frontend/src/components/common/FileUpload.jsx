import React, { useState, useEffect, useRef } from 'react';
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
import DocumentPreviewModal from './DocumentPreviewModal';

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
  onChange, // Ant Design Form.Item injects this; keep off <Upload> to avoid param shape clashes
  disabled = false,
  uploadText = 'Upload Files',
  ...props
}) => {
  const [fileList, setFileList] = useState(() => Array.isArray(value) ? value : []);
  const prevValueRef = useRef(null);
  const isUpdatingFromPropsRef = useRef(false);
  const isInternalUpdateRef = useRef(false);
  
  // Helper to create a stable key from file array for comparison
  const getFileArrayKey = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return arr.map(f => `${f.uid || ''}-${f.name || ''}-${f.size || 0}-${f.url || ''}`).join('|');
  };
  
  // Update fileList when value prop changes (only if content actually changed)
  useEffect(() => {
    // Skip if this is an internal update (from our own state changes)
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    
    const currentValue = Array.isArray(value) ? value : [];
    const currentKey = getFileArrayKey(currentValue);
    const prevKey = prevValueRef.current;
    
    // Only update if the key actually changed
    if (currentKey !== prevKey) {
      console.log('🔷 [FileUpload] Value prop changed, updating fileList');
      console.log('  - Previous value length:', prevKey ? prevKey.split('|').length : 0);
      console.log('  - New value length:', currentValue.length);
      
      isUpdatingFromPropsRef.current = true;
      setFileList(currentValue);
      prevValueRef.current = currentKey;
      
      // Reset flag in next tick
      requestAnimationFrame(() => {
        isUpdatingFromPropsRef.current = false;
      });
    }
  }, [value]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documentPreviewVisible, setDocumentPreviewVisible] = useState(false);
  const [documentPreviewFile, setDocumentPreviewFile] = useState(null);

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
    console.log('🔷 [FileUpload] handleUpload called');
    console.log('  - File name:', file?.name);
    console.log('  - File size:', file?.size, 'bytes');
    console.log('  - File type:', file?.type);
    console.log('  - File uid:', file?.uid);
    console.log('  - Current fileList length:', fileList.length);
    console.log('  - Has onFileUpload callback:', !!onFileUpload);
    
    // Prevent duplicate uploads by checking if file already exists
    const fileExists = fileList.some(f => f.uid === file.uid || (f.name === file.name && f.size === file.size));
    if (fileExists) {
      console.log('⚠️ [FileUpload] File already in list, skipping:', file.name);
      console.log('  - Existing files:', fileList.map(f => ({ name: f.name, uid: f.uid })));
      return Promise.resolve(); // Return resolved promise
    }

    console.log('  - File is new, proceeding with upload...');
    setUploading(true);
    try {
      let response;
      
      if (onFileUpload) {
        console.log('  - Calling onFileUpload callback...');
        const uploadStartTime = Date.now();
        response = await onFileUpload(file);
        const uploadTime = Date.now() - uploadStartTime;
        console.log('  - onFileUpload completed in', uploadTime, 'ms');
        console.log('  - Response received:', response);
        
        const newFile = {
          uid: file.uid,
          name: file.name,
          status: 'done',
          url: response?.file?.url || response?.url || null,
          response: response,
          size: file.size,
          type: file.type,
          originFileObj: file // Keep reference to original file
        };

        // Check again before adding to prevent duplicates (using current fileList state)
        console.log('  - Updating fileList state...');
        isInternalUpdateRef.current = true;
        setFileList(currentList => {
          console.log('    - Current list length:', currentList.length);
          const alreadyExists = currentList.some(f => f.uid === newFile.uid || (f.name === newFile.name && f.size === newFile.size));
          if (alreadyExists) {
            console.log('⚠️ [FileUpload] File already exists after upload, skipping add:', newFile.name);
            isInternalUpdateRef.current = false;
            return currentList; // Return unchanged list
          }

          const newFileList = [...currentList, newFile];
          console.log('    - New list length:', newFileList.length);
          console.log('    - New file added:', { name: newFile.name, uid: newFile.uid, url: newFile.url });
          
          // Update ref to track this value (using stable key)
          prevValueRef.current = getFileArrayKey(newFileList);
          
          // Only notify parents if this update is from user action, not from props
          if (!isUpdatingFromPropsRef.current) {
            console.log('    - Calling change callbacks...');
            // Use setTimeout to avoid blocking
            setTimeout(() => {
              if (onFileChange) onFileChange(newFileList);
              if (onChange) onChange(newFileList);
              console.log('    - Change callbacks completed');
            }, 0);
          } else {
            console.log('    - Skipping change callbacks (update from props)');
          }

          return newFileList;
        });

        console.log('✅ [FileUpload] File uploaded and added successfully');
        message.success(`${file.name} uploaded successfully`);
        return Promise.resolve();
      } else {
        console.log('  - No onFileUpload callback, storing file locally for later upload');
        // For new jobs, store the file locally without uploading
        const newFile = {
          uid: file.uid,
          name: file.name,
          status: 'done',
          url: '', // No URL yet
          response: null,
          size: file.size,
          type: file.type,
          originFileObj: file // Keep reference to original file for later upload
        };

        console.log('  - Created new file object:', { name: newFile.name, uid: newFile.uid, hasOriginFileObj: !!newFile.originFileObj });

        // Check again before adding to prevent duplicates (using current fileList state)
        console.log('  - Updating fileList state...');
        isInternalUpdateRef.current = true;
        setFileList(currentList => {
          console.log('    - Current list length:', currentList.length);
          const alreadyExists = currentList.some(f => f.uid === newFile.uid || (f.name === newFile.name && f.size === newFile.size));
          if (alreadyExists) {
            console.log('⚠️ [FileUpload] File already exists, skipping add:', newFile.name);
            isInternalUpdateRef.current = false;
            return currentList; // Return unchanged list
          }

          const newFileList = [...currentList, newFile];
          console.log('    - New list length:', newFileList.length);
          console.log('    - New file added:', { name: newFile.name, uid: newFile.uid });
          
          // Update ref to track this value (using stable key)
          prevValueRef.current = getFileArrayKey(newFileList);
          
          // Only notify parents if this update is from user action, not from props
          if (!isUpdatingFromPropsRef.current) {
            console.log('    - Calling change callbacks...');
            // Use setTimeout to avoid blocking
            setTimeout(() => {
              if (onFileChange) onFileChange(newFileList);
              if (onChange) onChange(newFileList);
              console.log('    - Change callbacks completed');
            }, 0);
          } else {
            console.log('    - Skipping change callbacks (update from props)');
          }

          return newFileList;
        });

        console.log('✅ [FileUpload] File added to list (will upload when job is created)');
        message.success(`${file.name} added (will upload when job is created)`);
        return Promise.resolve();
      }
    } catch (error) {
      console.error('❌ [FileUpload] Upload error:', error);
      console.error('  - Error name:', error.name);
      console.error('  - Error message:', error.message);
      console.error('  - Error stack:', error.stack);
      message.error(`Failed to upload ${file.name}`);
      return Promise.reject(error);
    } finally {
      setUploading(false);
      console.log('  - Upload state reset (uploading = false)');
    }
  };

  const handleRemove = async (file) => {
    try {
      if (file.url) {
        await fileService.deleteFile(file.url);
      }
      
      const newFileList = fileList.filter(item => item.uid !== file.uid);
      isInternalUpdateRef.current = true;
      prevValueRef.current = getFileArrayKey(newFileList);
      setFileList(newFileList);
      
      // Only notify parents if this update is from user action, not from props
      if (!isUpdatingFromPropsRef.current) {
        // Use setTimeout to avoid blocking
        setTimeout(() => {
          if (onFileChange) onFileChange(newFileList);
          if (onChange) onChange(newFileList);
        }, 0);
      }

      if (onFileRemove) {
        onFileRemove(file);
      }

      message.success('File removed successfully');
    } catch (error) {
      message.error('Failed to remove file');

    }
  };

  const handlePreview = async (file) => {
    // Show file in modal using DocumentPreviewModal
    if (file.url) {
      // For uploaded files with URLs, use DocumentPreviewModal
      setDocumentPreviewFile(file);
      setDocumentPreviewVisible(true);
    } else if (file.originFileObj) {
      // For new files that haven't been uploaded yet, show in local modal
      if (!file.preview) {
        file.preview = await getBase64(file.originFileObj);
      }
      setPreviewFile(file);
      setPreviewVisible(true);
    }
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Custom request handler to prevent default upload behavior
  const customRequest = async ({ file, onSuccess, onError }) => {
    console.log('🔷 [FileUpload] customRequest called');
    console.log('  - File:', file?.name);
    console.log('  - File size:', file?.size);
    console.log('  - Has onSuccess:', !!onSuccess);
    console.log('  - Has onError:', !!onError);
    
    try {
      // Check if file already exists before processing
      const fileExists = fileList.some(f => f.uid === file.uid || (f.name === file.name && f.size === file.size));
      if (fileExists) {
        console.log('⚠️ [FileUpload] File already in list, skipping:', file.name);
        if (onSuccess) {
          console.log('  - Calling onSuccess (file already exists)');
          onSuccess({}, file);
        }
        return;
      }

      console.log('  - Calling handleUpload...');
      // Call handleUpload which will process the file
      await handleUpload(file);
      console.log('  - handleUpload completed');
      
      // Always call onSuccess to prevent retries and mark as uploaded
      if (onSuccess) {
        console.log('  - Calling onSuccess callback');
        onSuccess({}, file);
        console.log('  - onSuccess callback completed');
      }
      console.log('✅ [FileUpload] customRequest completed successfully');
    } catch (error) {
      console.error('❌ [FileUpload] Custom request error:', error);
      console.error('  - Error name:', error.name);
      console.error('  - Error message:', error.message);
      console.error('  - Error stack:', error.stack);
      if (onError) {
        console.log('  - Calling onError callback');
        onError(error);
      }
    }
  };

  const uploadProps = {
    name: 'file',
    multiple,
    accept,
    fileList: Array.isArray(fileList) ? fileList : [],
    // customRequest replaces default XHR; do NOT return false from beforeUpload
    // (that skips customRequest entirely in rc-upload).
    customRequest,
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

      {/* Document Preview Modal for uploaded files */}
      <DocumentPreviewModal
        visible={documentPreviewVisible}
        onClose={() => setDocumentPreviewVisible(false)}
        file={documentPreviewFile}
      />
    </div>
  );
};

export default FileUpload;

