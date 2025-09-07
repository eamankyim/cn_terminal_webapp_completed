import React, { useState } from 'react';
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
  Upload, 
  Select,
  message,
  Tooltip,
  Statistic,
  Drawer,
  Tabs,
  Timeline,
  Descriptions,
  Avatar,
  Divider,
  Dropdown,
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UserOutlined,
  ContainerOutlined,
  CalendarOutlined,
  DollarOutlined,
  MoreOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CustomerSelector from '../components/common/CustomerSelector';
import { useCustomers } from '../contexts/CustomerContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const JobsPage = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isStatusUpdateModalVisible, setIsStatusUpdateModalVisible] = useState(false);
  const [statusUpdateForm] = Form.useForm();
  const [isDocumentViewerVisible, setIsDocumentViewerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedCustomerConsignments, setSelectedCustomerConsignments] = useState([]);



  // Mock data for jobs
  const [jobs, setJobs] = useState([
    {
      key: '1',
      trackingId: 'CN001',
      clientName: 'John Smith',
      clientEmail: 'john@example.com',
      clientPhone: '+233 24 123 4567',
      commercialInvoice: 'INV-2024-001',
      goodsType: 'Electronics',
      
      ghanaCard: 'GHA-123456789-0',
      tin: '123456789',
            status: 'Submitted',
      submittedDate: '2024-01-20',
      createdBy: 'Staff 1',
      documents: [
        'packing-list.pdf',
        'commercial-invoice.pdf',
        'bill-of-lading.pdf',
        'certificate-of-origin.pdf'
      ],
      estimatedValue: 5000,
      port: 'Tema Port',
      assignedTo: 'Unassigned',
      statusHistory: [
        {
          date: '2024-01-20',
          status: 'Submitted',
          comment: 'Job created',
          updatedBy: 'Staff 1'
         }
       ]
     },
     {
       key: '2',
      trackingId: 'CN002',
      clientName: 'Sarah Johnson',
      clientEmail: 'sarah@example.com',
      clientPhone: '+233 26 987 6543',
      commercialInvoice: 'INV-2024-002',
      goodsType: 'Textiles',
      
      ghanaCard: 'GHA-987654321-0',
      tin: '987654321',
      status: 'Under Review',
      submittedDate: '2024-01-19',
      createdBy: 'Staff 1',
      documents: [
        'packing-list.pdf',
        'commercial-invoice.pdf',
        'technical-specifications.pdf',
        'quality-certificate.pdf',
        'shipping-manifest.pdf'
      ],
      estimatedValue: 3000,
      port: 'Kotoka Airport',
      assignedTo: 'Staff 1',
      statusHistory: [
        {
          date: '2024-01-19',
          status: 'Submitted',
          comment: 'Job created',
          updatedBy: 'Staff 1'
        },
        {
          date: '2024-01-20',
          status: 'Under Review',
          comment: 'Documents reviewed and approved',
          updatedBy: 'Staff 2'
         }
       ]
     },
     {
       key: '3',
      trackingId: 'CN003',
      clientName: 'Mike Wilson',
      clientEmail: 'mike@example.com',
      clientPhone: '+233 20 555 1234',
      commercialInvoice: 'INV-2024-003',
      goodsType: 'Machinery',
      
      ghanaCard: 'GHA-555123456-0',
      tin: '555123456',
      status: 'Quoted',
      submittedDate: '2024-01-18',
      createdBy: 'Staff 1',
      documents: [
        'packing-list.pdf',
        'commercial-invoice.pdf',
        'technical-specifications.pdf',
        'safety-certificate.pdf',
        'inspection-report.pdf',
        'warranty-document.pdf'
      ],
      estimatedValue: 15000,
      port: 'Tema Port',
      assignedTo: 'Staff 2',
      statusHistory: [
        {
          date: '2024-01-18',
          status: 'Submitted',
          comment: 'Job created',
          updatedBy: 'Staff 1'
        },
        {
          date: '2024-01-19',
          status: 'Under Review',
          comment: 'Initial review completed',
          updatedBy: 'Staff 2'
        },
        {
          date: '2024-01-20',
          status: 'Quoted',
          comment: 'Duty calculation completed and quote prepared',
          updatedBy: 'Staff 2'
        }
      ]
    }
  ]);

  // Available staff members for assignment
  const staffMembers = [
    'Unassigned',
    'Staff 1',
    'Staff 2',
    'Admin',
    'Delivery Team'
  ];

  const getStatusColor = (status) => {
    const statusColors = {
      'Submitted': 'blue',
      'Under Review': 'orange',
      'Quoted': 'purple',
      'Awaiting Payment': 'magenta',
      'Paid': 'green',
      'Clearing': 'green',
      'Cleared': 'green',
      'Out for Delivery': 'cyan',
      'Delivered': 'green',
      'Closed': 'default'
    };
    return statusColors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'Submitted': <FileTextOutlined />,
      'Under Review': <CalendarOutlined />,
      'Quoted': <DollarOutlined />,
      'Awaiting Payment': <DollarOutlined />,
      'Paid': <DollarOutlined />,
      'Clearing': <ContainerOutlined />,
      'Cleared': <ContainerOutlined />,
      'Out for Delivery': <ContainerOutlined />,
      'Delivered': <ContainerOutlined />,
      'Closed': <ContainerOutlined />
    };
    return statusIcons[status] || <FileTextOutlined />;
  };

  const getDocumentIcon = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileTextOutlined style={{ color: '#ff4d4f' }} />;
      case 'doc':
      case 'docx':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'xls':
      case 'xlsx':
        return <FileTextOutlined style={{ color: '#52c41a' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileTextOutlined style={{ color: '#722ed1' }} />;
      default:
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getDocumentTypeLabel = (filename) => {
    const name = filename.toLowerCase();
    if (name.includes('packing')) return 'Packing List';
    if (name.includes('invoice')) return 'Commercial Invoice';
    if (name.includes('lading')) return 'Bill of Lading';
    if (name.includes('certificate')) return 'Certificate';
    if (name.includes('specification')) return 'Technical Specification';
    if (name.includes('report')) return 'Report';
    if (name.includes('warranty')) return 'Warranty Document';
    if (name.includes('manifest')) return 'Shipping Manifest';
    if (name.includes('safety')) return 'Safety Certificate';
    if (name.includes('inspection')) return 'Inspection Report';
    if (name.includes('origin')) return 'Certificate of Origin';
    return 'Document';
  };

  const columns = [
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.clientEmail}
          </Text>
        </Space>
      )
    },
    {
      title: 'Goods',
      dataIndex: 'goodsType',
      key: 'goodsType',
      render: (text, record) => (
        <Tag color="blue">{text}</Tag>
      )
    },
    {
      title: 'Documents',
      dataIndex: 'documents',
      key: 'documents',
      render: (docs) => (
        <Space>
          {docs.map((doc, index) => (
            <Tooltip key={index} title={doc}>
              <FileTextOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          ))}
          <Text type="secondary">({docs.length})</Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedDate',
      key: 'submittedDate'
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo) => (
        <Tag 
          color={assignedTo === 'Unassigned' ? 'default' : 'blue'}
          icon={assignedTo === 'Unassigned' ? null : <UserOutlined />}
        >
          {assignedTo}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewJob(record)}
        >
          View
        </Button>
      )
    }
  ];

  const handleNewJob = () => {
    setEditingJob(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    form.setFieldsValue({
      clientName: job.clientName,
      clientEmail: job.clientEmail,
      clientPhone: job.clientPhone,
      commercialInvoice: job.commercialInvoice,
      goodsType: job.goodsType,

      ghanaCard: job.ghanaCard,
      tin: job.tin,
      estimatedValue: job.estimatedValue,
      port: job.port
    });
    setIsModalVisible(true);
  };

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setIsDetailsDrawerVisible(true);
  };

  const handleDeleteJob = (job) => {
    Modal.confirm({
      title: 'Delete Job',
      content: `Are you sure you want to delete job ${job.trackingId}?`,
      onOk: () => {
        setJobs(jobs.filter(j => j.key !== job.key));
        message.success('Job deleted successfully');
      }
    });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingJob) {
        // Update existing job
        const updatedJobs = jobs.map(j => 
          j.key === editingJob.key 
            ? { ...j, ...values }
            : j
        );
        setJobs(updatedJobs);
        message.success('Job updated successfully');
      } else {
        // Create new job
        const newJob = {
          key: Date.now().toString(),
          trackingId: `CN${String(jobs.length + 1).padStart(3, '0')}`,
          ...values,
          status: values.status || 'Submitted',
          submittedDate: new Date().toISOString().split('T')[0],
          documents: [],
          statusHistory: [
            {
              date: new Date().toISOString().split('T')[0],
              status: values.status || 'Submitted',
              comment: 'Job created',
              updatedBy: 'Current User'
            }
          ]
        };
        setJobs([newJob, ...jobs]);
        message.success('Job created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customerId, customer) => {
    // Auto-fill client details when customer is selected
    form.setFieldsValue({
      clientName: customer.name,
      clientEmail: customer.email,
      clientPhone: customer.phone
    });
    
    // Get consignments for the selected customer
    // In a real implementation, this would be fetched from API
    // For now, using mock data based on customer name
    const mockConsignments = getMockConsignmentsForCustomer(customer.name);
    setSelectedCustomerConsignments(mockConsignments);
    
    // Clear previously selected consignment
    form.setFieldsValue({ consignmentId: undefined });
  };

  const handleConsignmentSelect = (consignmentId) => {
    const selectedConsignment = selectedCustomerConsignments.find(c => c.id === consignmentId);
    if (selectedConsignment) {
      // Auto-fill only the estimated value from consignment
      form.setFieldsValue({
        estimatedValue: selectedConsignment.value
      });
    }
  };

  const handleStatusUpdate = async (values) => {
    setLoading(true);
    try {
      const newStatusEntry = {
        date: new Date().toISOString().split('T')[0],
        status: values.status,
        comment: values.comment,
        updatedBy: 'Current User'
      };

      const updatedJobs = jobs.map(j => 
        j.key === selectedJob.key 
          ? { 
              ...j, 
              status: values.status,
              statusHistory: [...(j.statusHistory || []), newStatusEntry]
            }
          : j
      );
      setJobs(updatedJobs);
      message.success('Job status updated successfully');
      setIsStatusUpdateModalVisible(false);
      statusUpdateForm.resetFields();
    } catch (error) {
      message.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setIsDocumentViewerVisible(true);
  };



  // Mock function to get consignments for a customer
  const getMockConsignmentsForCustomer = (customerName) => {
    const mockConsignmentsData = {
      'John Smith': [
        {
          id: 'CON-001',
          trackingId: 'TRK-2024-001',
          consigneeName: 'John Smith',
          goodsType: 'Electronics',
          status: 'In Transit',
          value: 25000,
          date: '2024-01-20',
          tin: '123456789',
          ghanaCard: 'GHA-123456789-0'
        },
        {
          id: 'CON-002',
          trackingId: 'TRK-2024-002',
          consigneeName: 'John Smith',
          goodsType: 'Textiles',
          status: 'Pending',
          value: 15000,
          date: '2024-01-25',
          tin: '123456789',
          ghanaCard: 'GHA-123456789-0'
        }
      ],
      'Sarah Johnson': [
        {
          id: 'CON-003',
          trackingId: 'TRK-2024-003',
          consigneeName: 'Sarah Johnson',
          goodsType: 'Textiles',
          status: 'Delivered',
          value: 18000,
          date: '2024-01-15',
          tin: '987654321',
          ghanaCard: 'GHA-987654321-0'
        }
      ],
      'Mike Wilson': [
        {
          id: 'CON-004',
          trackingId: 'TRK-2024-004',
          consigneeName: 'Mike Wilson',
          goodsType: 'Machinery',
          status: 'Pending',
          value: 85000,
          date: '2024-01-25',
          tin: '555123456',
          ghanaCard: 'GHA-555123456-0'
        }
      ]
    };
    
    return mockConsignmentsData[customerName] || [];
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    action: 'https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188',
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
        <Title level={2}>Jobs Management</Title>
          <Text type="secondary">Manage client jobs and document submissions</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={handleNewJob}
        >
          New Job
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
              title="Total Jobs"
              value={jobs.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Review"
              value={jobs.filter(j => j.status === 'Submitted').length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#00072D' }}
            />
          </Card>
          </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Under Review"
              value={jobs.filter(j => j.status === 'Under Review').length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
          </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Quoted"
              value={jobs.filter(j => j.status === 'Quoted').length}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
      </Card>
        </Col>
      </Row>

      {/* Jobs Table */}
      <Card title="All Jobs">
        <Table
          columns={columns}
          dataSource={jobs}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} jobs`
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '16px', marginBottom: '8px' }}>
                      No jobs found
                    </Text>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      Get started by creating your first job
                    </Text>
                  </div>
                }
              >
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                  size="large"
                >
                  Create First Job
                </Button>
                </Empty>
            )
          }}
        />
      </Card>

      {/* Create/Edit Job Modal */}
      <Modal
        title={editingJob ? 'Edit Job' : 'New Job'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            port: 'Tema Port'
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="customerId"
                label="Select Client"
                rules={[{ required: true, message: 'Please select a client' }]}
              >
                <CustomerSelector
                  onChange={handleCustomerSelect}
                  placeholder="Search and select client..."
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="consignmentId"
                label="Select Consignment"
                rules={[{ required: true, message: 'Please select a consignment' }]}
              >
                <Select 
                  placeholder="Select a consignment for this client"
                  onChange={handleConsignmentSelect}
                  disabled={selectedCustomerConsignments.length === 0}
                >
                  {selectedCustomerConsignments.map(consignment => (
                    <Option key={consignment.id} value={consignment.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{consignment.trackingId} - {consignment.goodsType}</span>
                        <span style={{ fontSize: '12px', color: '#999' }}>
                          GHS {consignment.value.toLocaleString()}
                        </span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>



          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="trackingId"
                label="Tracking ID"
                rules={[{ required: true, message: 'Please enter tracking ID' }]}
              >
                <Input placeholder="Enter tracking ID for this job" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="goodsType"
                label="Type of Goods"
                rules={[{ required: true, message: 'Please select goods type' }]}
              >
                <Select placeholder="Select goods type for this job">
                  <Option value="Electronics">Electronics</Option>
                  <Option value="Textiles">Textiles</Option>
                  <Option value="Machinery">Machinery</Option>
                  <Option value="Pharmaceuticals">Pharmaceuticals</Option>
                  <Option value="Food & Beverages">Food & Beverages</Option>
                  <Option value="Automotive">Automotive</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="port"
                label="Port of Entry"
                rules={[{ required: true, message: 'Please select port' }]}
              >
                <Select placeholder="Select port">
                  <Option value="Tema Port">Tema Port</Option>
                  <Option value="Kotoka Airport">Kotoka Airport</Option>
                  <Option value="Takoradi Port">Takoradi Port</Option>
                  <Option value="Kumasi Airport">Kumasi Airport</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assignedTo"
                label="Assign To"
                rules={[{ required: true, message: 'Please assign the job' }]}
              >
                <Select placeholder="Select staff member">
                  {staffMembers.map(member => (
                    <Option key={member} value={member}>
                      {member}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
          <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  <Option value="Submitted">Submitted</Option>
                  <Option value="Under Review">Under Review</Option>
                  <Option value="Quoted">Quoted</Option>
                  <Option value="Awaiting Client Payment">Awaiting Client Payment</Option>
                  <Option value="Paid">Paid</Option>
                  <Option value="Clearing">Clearing</Option>
                  <Option value="Cleared">Cleared</Option>
                  <Option value="Out for Delivery">Out for Delivery</Option>
                  <Option value="Delivered">Delivered</Option>
                  <Option value="Closed">Closed</Option>
                  <Option value="On Hold">On Hold</Option>
                  <Option value="Rejected">Rejected</Option>
                </Select>
          </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="estimatedValue"
                label="Estimated Value (GHS)"
                rules={[{ required: true, message: 'Please enter estimated value' }]}
              >
                <Input 
                type="number" 
                placeholder="Auto-filled when consignment is selected"
                min={0}
              />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Documents"
                name="documents"
              >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>Upload Documents</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>



          <Row gutter={16}>
            <Col span={12}>
          <Form.Item
                label="Documents"
            name="documents"
          >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>Upload Documents</Button>
            </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingJob ? 'Update Job' : 'Create Job'}
              </Button>
            </Space>
          </Form.Item>
                                   </Form>
        </Modal>

        {/* Status Update Modal */}
        <Modal
          title="Update Job Status"
        open={isStatusUpdateModalVisible}
        onCancel={() => setIsStatusUpdateModalVisible(false)}
        footer={null}
        >
          <Form
            form={statusUpdateForm}
            layout="vertical"
          onFinish={handleStatusUpdate}
          >
            <Form.Item
              name="status"
              label="New Status"
            rules={[{ required: true, message: 'Please select new status' }]}
          >
            <Select placeholder="Select new status">
              <Option value="Submitted">Submitted</Option>
              <Option value="Under Review">Under Review</Option>
              <Option value="Quoted">Quoted</Option>
              <Option value="Awaiting Client Payment">Awaiting Client Payment</Option>
              <Option value="Paid">Paid</Option>
              <Option value="Clearing">Clearing</Option>
              <Option value="Cleared">Cleared</Option>
              <Option value="Out for Delivery">Out for Delivery</Option>
              <Option value="Delivered">Delivered</Option>
              <Option value="Closed">Closed</Option>
              <Option value="On Hold">On Hold</Option>
              <Option value="Rejected">Rejected</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="comment"
              label="Comment"
            rules={[{ required: true, message: 'Please add a comment for this status update' }]}
          >
            <TextArea rows={4} placeholder="Describe why the status is being updated..." />
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsStatusUpdateModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Status
              </Button>
            </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Document Viewer Modal */}
        <Modal
          title={
            <div>
              <Title level={4} style={{ margin: 0 }}>Document Viewer</Title>
              <Text type="secondary">{selectedDocument}</Text>
            </div>
          }
          open={isDocumentViewerVisible}
          onCancel={() => setIsDocumentViewerVisible(false)}
          footer={null}
          width={800}
        >
          {selectedDocument && (
            <div>
              {/* Document Header */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    {getDocumentIcon(selectedDocument)}
                    <br />
                    <Text strong style={{ fontSize: '16px' }}>
                      {selectedDocument}
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>File Type</Text>
                    <br />
                    <Tag color="blue" style={{ marginTop: '8px' }}>
                      {selectedDocument.split('.').pop()?.toUpperCase()}
                    </Tag>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>Job</Text>
                    <br />
                    <Text style={{ fontSize: '16px', color: '#1890ff' }}>
                      {selectedJob?.trackingId}
                    </Text>
                  </div>
                </Col>
              </Row>

              <Divider />

              {/* Document Actions */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Button 
                    type="primary" 
                    icon={<EyeOutlined />} 
                    block
                    size="large"
                  >
                    Preview Document
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    icon={<DownloadOutlined />} 
                    block
                    size="large"
                  >
                    Download
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    icon={<ShareAltOutlined />} 
                    block
                    size="large"
                  >
                    Share
                  </Button>
                </Col>
              </Row>

              {/* Document Information */}
              <Card size="small" title="Document Information">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="File Name">
                    {selectedDocument}
                  </Descriptions.Item>
                  <Descriptions.Item label="File Extension">
                    <Tag color="blue">{selectedDocument.split('.').pop()?.toUpperCase()}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Job Reference">
                    {selectedJob?.trackingId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Client">
                    {selectedJob?.clientName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Upload Date">
                    {selectedJob?.submittedDate}
                  </Descriptions.Item>
                  <Descriptions.Item label="Document Type">
                    {getDocumentTypeLabel(selectedDocument)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Document Preview Placeholder */}
              <Card size="small" title="Document Preview" style={{ marginTop: 16 }}>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  background: '#fafafa', 
                  border: '2px dashed #d9d9d9',
                  borderRadius: '8px'
                }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <br />
                  <Text type="secondary">Document preview will be displayed here</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    PDF, images, and other supported formats will show actual content
                  </Text>
                </div>
              </Card>
            </div>
          )}
        </Modal>

      {/* Job Details Drawer */}
       <Drawer
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>Job Details</Title>
            <Text type="secondary">Tracking ID: {selectedJob?.trackingId}</Text>
          </div>
        }
         placement="right"
         onClose={() => setIsDetailsDrawerVisible(false)}
         open={isDetailsDrawerVisible}
         width={800}
                extra={
          <Space>
            <Button 
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                statusUpdateForm.setFieldsValue({ status: selectedJob.status });
                setIsStatusUpdateModalVisible(true);
              }}
            >
              Update Status
            </Button>
           <Dropdown
             menu={{
               items: [
                 {
                   key: 'edit',
                    label: 'Edit Job',
                   icon: <EditOutlined />,
                   onClick: () => {
                     setIsDetailsDrawerVisible(false);
                     handleEditJob(selectedJob);
                   },
                 },
                 {
                    key: 'delete',
                    label: 'Delete Job',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => {
                      setIsDetailsDrawerVisible(false);
                      handleDeleteJob(selectedJob);
                    },
                 },
               ],
             }}
             placement="bottomRight"
             arrow
           >
              <Button 
                type="text" 
                icon={<MoreOutlined />}
                size="large"
              />
            </Dropdown>
          </Space>
        }
       >
         {selectedJob && (
          <Tabs defaultActiveKey="details" style={{ marginTop: '16px' }}>
            <TabPane 
              tab={
                <span>
                  <ClockCircleOutlined />
                  Timeline
                </span>
              } 
              key="timeline"
            >
              <Card title="Status Timeline" size="small">
                {selectedJob.statusHistory && selectedJob.statusHistory.length > 0 ? (
                       <Timeline>
                    {selectedJob.statusHistory.map((entry, index) => (
                           <Timeline.Item 
                             key={index} 
                        color={getStatusColor(entry.status)}
                        dot={<UserOutlined style={{ color: getStatusColor(entry.status) }} />}
                           >
                             <div>
                          <Text strong>{entry.status}</Text>
                               <br />
                          <Text type="secondary">{entry.comment}</Text>
                               <br />
                               <Text type="secondary" style={{ fontSize: '12px' }}>
                            {entry.date} - Updated by {entry.updatedBy}
                               </Text>
                             </div>
                           </Timeline.Item>
                         ))}
                       </Timeline>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <ClockCircleOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
                    <br />
                    <Text type="secondary">No status updates yet</Text>
                  </div>
                )}
                     </Card>
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <UserOutlined />
                  Activities
                </span>
              } 
              key="activities"
            >
                     <Card title="User Activities" size="small">
                       <Timeline>
                                             <Timeline.Item 
                    color="blue"
                    dot={<UserOutlined style={{ color: '#1890ff' }} />}
                  >
                    <div>
                      <Text strong>Job Created</Text>
                      <br />
                      <Text type="secondary">Job request submitted by {selectedJob.createdBy}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {selectedJob.submittedDate} - {selectedJob.createdBy}
                      </Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item 
                    color="green"
                    dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  >
                    <div>
                      <Text strong>Assigned to Staff</Text>
                      <br />
                      <Text type="secondary">Job assigned to {selectedJob.assignedTo}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {selectedJob.submittedDate} - Admin
                      </Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item 
                    color="blue"
                    dot={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}
                  >
                    <div>
                      <Text strong>Documents Reviewed</Text>
                      <br />
                      <Text type="secondary">All required documents verified</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {selectedJob.submittedDate} - Staff 2
                      </Text>
                    </div>
                  </Timeline.Item>
                       </Timeline>
                     </Card>
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <FileTextOutlined />
                  Details
                </span>
              } 
              key="details"
            >
              {/* Job Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <Title level={3}>{selectedJob.trackingId}</Title>
                  <Tag color={getStatusColor(selectedJob.status)} size="large">
                    {selectedJob.status}
                                  </Tag>
                </div>
              </div>

              {/* Job Overview */}
              <div style={{ 
                marginBottom: '24px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <Title level={4} style={{ 
                  marginBottom: '20px', 
                  borderBottom: '1px solid #d9d9d9',
                  paddingBottom: '8px'
                }}>
                  Job Overview
                </Title>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Created By:</div>
                  <div>{selectedJob.createdBy}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Assigned To:</div>
                  <div>{selectedJob.assignedTo}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Submitted Date:</div>
                  <div>{selectedJob.submittedDate}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Port of Entry:</div>
                  <div>{selectedJob.port}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Estimated Value:</div>
                  <div>GHS {selectedJob.estimatedValue.toLocaleString()}</div>
                </div>
              </div>

              {/* Client Information */}
              <div style={{ 
                marginBottom: '24px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <Title level={4} style={{ 
                  marginBottom: '20px', 
                  borderBottom: '1px solid #d9d9d9',
                  paddingBottom: '8px'
                }}>
                  Client Information
                </Title>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Name:</div>
                  <div>{selectedJob.clientName}</div>
                     </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Email:</div>
                  <div>{selectedJob.clientEmail}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Phone:</div>
                  <div>{selectedJob.clientPhone}</div>
                </div>
              </div>

              {/* Job Information */}
              <div style={{ 
                marginBottom: '24px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <Title level={4} style={{ 
                  marginBottom: '20px', 
                  borderBottom: '1px solid #d9d9d9',
                  paddingBottom: '8px'
                }}>
                  Job Information
                </Title>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Commercial Invoice:</div>
                  <div>{selectedJob.commercialInvoice}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Ghana Card:</div>
                  <div>{selectedJob.ghanaCard}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>TIN:</div>
                  <div>{selectedJob.tin}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Goods Type:</div>
                  <div><Tag color="blue">{selectedJob.goodsType}</Tag></div>
                </div>
              </div>

              {/* Documents */}
              <div style={{ 
                marginBottom: '24px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <Title level={4} style={{ 
                  marginBottom: '20px', 
                  borderBottom: '1px solid #d9d9d9',
                  paddingBottom: '8px'
                }}>
                  Attached Documents
                </Title>
                {selectedJob.documents && selectedJob.documents.length > 0 ? (
                  <div>
                    {selectedJob.documents.map((doc, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '8px 0',
                        borderBottom: index < selectedJob.documents.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <div style={{ marginRight: '8px' }}>
                          {getDocumentIcon(doc)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text strong>{doc}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Document attached
                          </Text>
                        </div>
                        <Button 
                          type="text" 
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDocument(doc)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <FileTextOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
                    <br />
                    <Text type="secondary">No documents attached</Text>
           </div>
                )}
              </div>
            </TabPane>
          </Tabs>
         )}
       </Drawer>
     </div>
   );
 };

export default JobsPage;
