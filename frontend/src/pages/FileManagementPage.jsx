import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Typography,
  Modal, 
  Form, 
  Input, 
  Select,
  message,
  Tooltip,
  Statistic,
  Drawer,
  Tabs,
  Descriptions,
  Avatar,
  Divider,
  Dropdown,
  Empty,
  Spin,
  Alert,
  Upload,
  Image,
  Progress
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
  FolderOutlined,
  MoreOutlined
} from '@ant-design/icons';
import FileUpload from '../components/common/FileUpload';
import { fileService } from '../services/fileService';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const FileManagementPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [uploadForm] = Form.useForm();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockFiles = [
        {
          id: '1',
          originalName: 'invoice_001.pdf',
          filename: 'file-1234567890.pdf',
          url: '/uploads/documents/file-1234567890.pdf',
          mimeType: 'application/pdf',
          size: 245760,
          folder: 'documents',
          category: 'invoice',
          entityType: 'job',
          entityId: 'job_123',
          uploadedAt: new Date('2024-01-15'),
          uploadedBy: 'John Doe'
        },
        {
          id: '2',
          originalName: 'photo_001.jpg',
          filename: 'file-1234567891.jpg',
          url: '/uploads/images/file-1234567891.jpg',
          mimeType: 'image/jpeg',
          size: 1024000,
          folder: 'images',
          category: 'photo',
          entityType: 'consignment',
          entityId: 'cons_456',
          uploadedAt: new Date('2024-01-16'),
          uploadedBy: 'Jane Smith'
        },
        {
          id: '3',
          originalName: 'contract.docx',
          filename: 'file-1234567892.docx',
          url: '/uploads/documents/file-1234567892.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 512000,
          folder: 'documents',
          category: 'contract',
          entityType: 'customer',
          entityId: 'cust_789',
          uploadedAt: new Date('2024-01-17'),
          uploadedBy: 'Mike Johnson'
        }
      ];
      setFiles(mockFiles);
    } catch (error) {
      message.error('Failed to load files');
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <FileImageOutlined />;
    if (mimeType.includes('pdf')) return <FilePdfOutlined />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileWordOutlined />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileExcelOutlined />;
    return <FileOutlined />;
  };

  const getFileTypeColor = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'blue';
    if (mimeType.includes('pdf')) return 'red';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'blue';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'green';
    return 'default';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async (values) => {
    try {
      // This would be handled by the FileUpload component
      message.success('Files uploaded successfully');
      setIsUploadModalVisible(false);
      uploadForm.resetFields();
      loadFiles();
    } catch (error) {
      message.error('Failed to upload files');
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await fileService.deleteFile(fileId);
      message.success('File deleted successfully');
      loadFiles();
    } catch (error) {
      message.error('Failed to delete file');
    }
  };

  const handlePreview = (file) => {
    setSelectedFile(file);
    setIsPreviewVisible(true);
  };

  const handleDownload = async (file) => {
    try {
      const link = fileService.createDownloadLink(file.url, file.originalName);
      link.click();
    } catch (error) {
      message.error('Failed to download file');
    }
  };

  const columns = [
    {
      title: 'File',
      key: 'file',
      render: (_, record) => (
        <Space>
          <div style={{ fontSize: '20px', color: '#1890ff' }}>
            {getFileIcon(record.mimeType)}
          </div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.originalName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {formatFileSize(record.size)} • {record.mimeType}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category || 'General'}</Tag>
      ),
    },
    {
      title: 'Folder',
      dataIndex: 'folder',
      key: 'folder',
      render: (folder) => (
        <Space>
          <FolderOutlined />
          {folder}
        </Space>
      ),
    },
    {
      title: 'Entity',
      key: 'entity',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.entityType}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.entityId}</div>
        </div>
      ),
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
    },
    {
      title: 'Date',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Preview">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              danger
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchText.toLowerCase()) ||
                         file.category?.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = !filterType || file.mimeType.includes(filterType);
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>File Management</Title>
          <Text type="secondary">Manage and organize uploaded files</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={() => setIsUploadModalVisible(true)}
        >
          Upload Files
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Files"
              value={files.length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Size"
              value={files.reduce((sum, file) => sum + file.size, 0)}
              formatter={(value) => formatFileSize(value)}
              valueStyle={{ color: '#52c41a' }}
              prefix={<FolderOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Documents"
              value={files.filter(f => f.mimeType.includes('pdf') || f.mimeType.includes('document')).length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Images"
              value={files.filter(f => f.mimeType.startsWith('image/')).length}
              valueStyle={{ color: '#722ed1' }}
              prefix={<FileImageOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Search files by name or category"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              placeholder="File Type"
              style={{ width: '100%' }}
              allowClear
              onChange={setFilterType}
            >
              <Option value="image/">Images</Option>
              <Option value="pdf">PDFs</Option>
              <Option value="document">Documents</Option>
              <Option value="sheet">Spreadsheets</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadFiles}
              size="large"
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Files Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredFiles}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} files`
          }}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload Files"
        open={isUploadModalVisible}
        onCancel={() => {
          setIsUploadModalVisible(false);
          uploadForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="files"
            label="Select Files"
            rules={[{ required: true, message: 'Please select files to upload' }]}
          >
            <FileUpload
              multiple={true}
              maxCount={10}
              accept="*"
              onFileChange={(fileList) => {
                uploadForm.setFieldsValue({ files: fileList });
              }}
              uploadText="Select Files"
            />
          </Form.Item>

          <Form.Item
            name="folder"
            label="Folder"
            initialValue="general"
          >
            <Select>
              <Option value="general">General</Option>
              <Option value="documents">Documents</Option>
              <Option value="images">Images</Option>
              <Option value="invoices">Invoices</Option>
              <Option value="contracts">Contracts</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
          >
            <Input placeholder="Enter category (optional)" />
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsUploadModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Upload Files
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* File Preview Drawer */}
      <Drawer
        title="File Preview"
        open={isPreviewVisible}
        onClose={() => setIsPreviewVisible(false)}
        width={800}
        extra={[
          <Button 
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => selectedFile && handleDownload(selectedFile)}
          >
            Download
          </Button>
        ]}
      >
        {selectedFile && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <Title level={4}>{selectedFile.originalName}</Title>
              <Space>
                <Tag color={getFileTypeColor(selectedFile.mimeType)}>
                  {selectedFile.mimeType.split('/')[1]?.toUpperCase()}
                </Tag>
                <Text type="secondary">{formatFileSize(selectedFile.size)}</Text>
                <Text type="secondary">•</Text>
                <Text type="secondary">{selectedFile.folder}</Text>
              </Space>
            </div>

            {selectedFile.mimeType.startsWith('image/') ? (
              <Image
                alt={selectedFile.originalName}
                style={{ width: '100%' }}
                src={selectedFile.url}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px', color: '#1890ff' }}>
                  {getFileIcon(selectedFile.mimeType)}
                </div>
                <Title level={3}>{selectedFile.originalName}</Title>
                <Text type="secondary">
                  {formatFileSize(selectedFile.size)} • {selectedFile.mimeType}
                </Text>
                <br />
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(selectedFile)}
                  style={{ marginTop: '16px' }}
                >
                  Download File
                </Button>
              </div>
            )}

            <Divider />

            <Descriptions title="File Information" column={1}>
              <Descriptions.Item label="Original Name">
                {selectedFile.originalName}
              </Descriptions.Item>
              <Descriptions.Item label="File Type">
                {selectedFile.mimeType}
              </Descriptions.Item>
              <Descriptions.Item label="Size">
                {formatFileSize(selectedFile.size)}
              </Descriptions.Item>
              <Descriptions.Item label="Folder">
                {selectedFile.folder}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                {selectedFile.category || 'None'}
              </Descriptions.Item>
              <Descriptions.Item label="Uploaded By">
                {selectedFile.uploadedBy}
              </Descriptions.Item>
              <Descriptions.Item label="Upload Date">
                {new Date(selectedFile.uploadedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default FileManagementPage;
