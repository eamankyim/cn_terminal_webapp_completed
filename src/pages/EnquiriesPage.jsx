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
  Badge,
  Tooltip,
  Avatar,
  Progress,
  Statistic
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
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CustomerSelector from '../components/common/CustomerSelector';
import { useCustomers } from '../contexts/CustomerContext';
import apiService from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EnquiriesPage = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Mock data for enquiries
  const [enquiries, setEnquiries] = useState([
    {
      key: '1',
      trackingId: 'CN001',
      clientName: 'John Smith',
      clientEmail: 'john@example.com',
      clientPhone: '+233 24 123 4567',
      commercialInvoice: 'INV-2024-001',
      goodsType: 'Electronics',
      goodsDescription: 'Mobile phones and accessories',
      ghanaCard: 'GHA-123456789-0',
      tin: '123456789',
      status: 'Submitted',
      submittedDate: '2024-01-20',
      documents: ['packing-list.pdf'],
      estimatedValue: 5000,
      port: 'Tema Port'
    },
    {
      key: '2',
      trackingId: 'CN002',
      clientName: 'Sarah Johnson',
      clientEmail: 'sarah@example.com',
      clientPhone: '+233 26 987 6543',
      commercialInvoice: 'INV-2024-002',
      goodsType: 'Textiles',
      goodsDescription: 'Cotton fabrics and garments',
      ghanaCard: 'GHA-987654321-0',
      tin: '987654321',
      status: 'Under Review',
      submittedDate: '2024-01-19',
      documents: ['packing-list.pdf', 'invoice.pdf'],
      estimatedValue: 3000,
      port: 'Kotoka Airport'
    },
    {
      key: '3',
      trackingId: 'CN003',
      clientName: 'Mike Wilson',
      clientEmail: 'mike@example.com',
      clientPhone: '+233 20 555 1234',
      commercialInvoice: 'INV-2024-003',
      goodsType: 'Machinery',
      goodsDescription: 'Industrial equipment parts',
      ghanaCard: 'GHA-555123456-0',
      tin: '555123456',
      status: 'Quoted',
      submittedDate: '2024-01-18',
      documents: ['packing-list.pdf', 'invoice.pdf', 'specs.pdf'],
      estimatedValue: 15000,
      port: 'Tema Port'
    }
  ]);

  const { customers } = useCustomers();

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
        <Space direction="vertical" size="small">
          <Tag color="blue">{text}</Tag>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.goodsDescription}
          </Text>
        </Space>
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleViewEnquiry(record)}
          >
            View
          </Button>
          {record.status === 'Submitted' && (
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditEnquiry(record)}
            >
              Edit
            </Button>
          )}
          <Button 
            type="text" 
            icon={<DeleteOutlined />} 
            size="small"
            danger
            onClick={() => handleDeleteEnquiry(record)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  const handleNewEnquiry = () => {
    setEditingEnquiry(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditEnquiry = (enquiry) => {
    setEditingEnquiry(enquiry);
    form.setFieldsValue({
      clientName: enquiry.clientName,
      clientEmail: enquiry.clientEmail,
      clientPhone: enquiry.clientPhone,
      commercialInvoice: enquiry.commercialInvoice,
      goodsType: enquiry.goodsType,
      goodsDescription: enquiry.goodsDescription,
      ghanaCard: enquiry.ghanaCard,
      tin: enquiry.tin,
      estimatedValue: enquiry.estimatedValue,
      port: enquiry.port
    });
    setIsModalVisible(true);
  };

  const handleViewEnquiry = (enquiry) => {
    navigate(`/shipments/${enquiry.trackingId}`);
  };

  const handleDeleteEnquiry = (enquiry) => {
    Modal.confirm({
      title: 'Delete Enquiry',
      content: `Are you sure you want to delete enquiry ${enquiry.trackingId}?`,
      onOk: () => {
        setEnquiries(enquiries.filter(e => e.key !== enquiry.key));
        message.success('Enquiry deleted successfully');
      }
    });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingEnquiry) {
        // Update existing enquiry
        const response = await apiService.updateEnquiry(editingEnquiry.id, values);
        const updatedEnquiries = enquiries.map(e => 
          e.key === editingEnquiry.key 
            ? { ...e, ...response.enquiry }
            : e
        );
        setEnquiries(updatedEnquiries);
        message.success('Enquiry updated successfully');
      } else {
        // Create new enquiry
        const response = await apiService.createEnquiry(values);
        const newEnquiry = {
          key: response.enquiry.id,
          trackingId: `CN${String(enquiries.length + 1).padStart(3, '0')}`,
          ...response.enquiry,
          status: 'Submitted',
          submittedDate: new Date().toISOString().split('T')[0],
          documents: []
        };
        setEnquiries([newEnquiry, ...enquiries]);
        message.success('Enquiry created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to save enquiry:', error);
      message.error(error.message || 'Failed to save enquiry');
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
          <Title level={2}>Enquiries Management</Title>
          <Text type="secondary">Manage client enquiries and document submissions</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={handleNewEnquiry}
        >
          New Enquiry
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Enquiries"
              value={enquiries.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Review"
              value={enquiries.filter(e => e.status === 'Submitted').length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#00072D' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Under Review"
              value={enquiries.filter(e => e.status === 'Under Review').length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Quoted"
              value={enquiries.filter(e => e.status === 'Quoted').length}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Enquiries Table */}
      <Card title="All Enquiries">
        <Table 
          columns={columns} 
          dataSource={enquiries}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} enquiries`
          }}
        />
      </Card>

      {/* Create/Edit Enquiry Modal */}
      <Modal
        title={editingEnquiry ? 'Edit Enquiry' : 'New Enquiry'}
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
            <Col span={12}>
              <Form.Item
                name="ghanaCard"
                label="Ghana Card Number"
                rules={[{ required: true, message: 'Please enter Ghana Card number' }]}
              >
                <Input placeholder="GHA-XXXXXXXXX-X" />
              </Form.Item>
            </Col>

          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="goodsType"
                label="Type of Goods"
                rules={[{ required: true, message: 'Please select goods type' }]}
              >
                <Select placeholder="Select goods type">
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

          <Form.Item
            name="goodsDescription"
            label="Goods Description"
            rules={[{ required: true, message: 'Please enter goods description' }]}
          >
            <TextArea rows={3} placeholder="Detailed description of goods" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="estimatedValue"
                label="Estimated Value (GHS)"
                rules={[{ required: true, message: 'Please enter estimated value' }]}
              >
                <Input type="number" placeholder="Enter value in GHS" />
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

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingEnquiry ? 'Update Enquiry' : 'Create Enquiry'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnquiriesPage;
