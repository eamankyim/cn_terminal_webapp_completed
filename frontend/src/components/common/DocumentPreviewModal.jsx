import React, { useState } from 'react';
import { Modal, Image, Button, Space, Typography, Tag, Spin, Alert } from 'antd';
import {
  FileTextOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * DocumentPreviewModal Component
 * Displays documents in a modal instead of opening new tabs
 * 
 * Supports:
 * - Images: Rendered directly using Ant Design Image component
 * - PDFs: Embedded via iframe
 * - Office/Other: Shows metadata with download option
 * - Responsive: Full-screen on mobile
 */
const DocumentPreviewModal = ({
  visible,
  onClose,
  file,
  apiBaseUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!file) return null;

  // Build full URL
  const getFileUrl = () => {
    if (!file.url) return null;
    return file.url.startsWith('http') ? file.url : `${apiBaseUrl}${file.url}`;
  };

  const fileUrl = getFileUrl();

  // Detect file type
  const getFileType = () => {
    const mimeType = file.mimeType || file.type || '';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word')) return 'word';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'ppt';
    return 'other';
  };

  const fileType = getFileType();

  // Get file icon
  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <FileImageOutlined style={{ fontSize: '64px', color: '#1890ff' }} />;
      case 'pdf':
        return <FilePdfOutlined style={{ fontSize: '64px', color: '#ff4d4f' }} />;
      case 'word':
        return <FileWordOutlined style={{ fontSize: '64px', color: '#1890ff' }} />;
      case 'excel':
        return <FileExcelOutlined style={{ fontSize: '64px', color: '#52c41a' }} />;
      default:
        return <FileOutlined style={{ fontSize: '64px', color: '#999' }} />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle download
  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.originalName || file.name || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Render based on file type
  const renderContent = () => {
    if (!fileUrl) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Alert
            message="File Not Available"
            description="The file URL is not available or cannot be loaded."
            type="warning"
            showIcon
          />
        </div>
      );
    }

    switch (fileType) {
      case 'image':
        return (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <Image
              src={fileUrl}
              alt={file.originalName || file.name}
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
              preview={true}
            />
          </div>
        );

      case 'pdf':
        return (
          <div style={{ width: '100%', height: '70vh' }}>
            <iframe
              src={fileUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={file.originalName || file.name}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError('Failed to load PDF');
              }}
            />
          </div>
        );

      case 'word':
      case 'excel':
      case 'ppt':
      case 'other':
      default:
        return (
          <div style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ marginBottom: '24px' }}>
              {getFileIcon()}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '18px' }}>
                {file.originalName || file.name}
              </Text>
            </div>
            <Space direction="vertical" size="small" style={{ marginBottom: '24px' }}>
              <Tag color="blue">
                {file.mimeType || file.type || 'Unknown type'}
              </Tag>
              {file.size && (
                <Text type="secondary">
                  {formatFileSize(file.size)}
                </Text>
              )}
            </Space>
            <div style={{ marginTop: '24px' }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                This file type cannot be previewed directly.
                Please download to view.
              </Text>
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
              >
                Download File
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={handleDownload}>
          Download
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={window.innerWidth < 768 ? '100%' : '90%'}
      style={{
        maxWidth: '1200px',
        top: window.innerWidth < 768 ? 0 : 20,
        paddingBottom: 0
      }}
      bodyStyle={{
        padding: window.innerWidth < 768 ? '12px' : '24px',
        maxHeight: '85vh',
        overflow: 'hidden'
      }}
      centered={window.innerWidth < 768 ? false : true}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {getFileIcon()}
          <Text strong style={{ fontSize: '16px' }}>
            {file.originalName || file.name}
          </Text>
        </div>
      }
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Loading document...</Text>
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ marginBottom: '16px' }}>
          <Alert
            message="Error Loading Document"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        </div>
      )}

      {!loading && !error && renderContent()}
    </Modal>
  );
};

export default DocumentPreviewModal;

