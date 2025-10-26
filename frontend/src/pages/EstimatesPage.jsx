import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Table, 
  Input, 
  Tag, 
  Modal, 
  Descriptions, 
  Row, 
  Col,
  Statistic,
  Select,
  DatePicker,
  Form,
  message,
  InputNumber,
  Divider,
  Drawer,
  Dropdown,
  Spin,
  Empty
} from 'antd';
import { 
  FileTextOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalculatorOutlined
} from '@ant-design/icons';
import estimateService from '../services/estimateService';
import { getCustomers } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../utils/permissions';
import PermissionGate from '../components/common/PermissionGate';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const EstimatesPage = () => {
  const { currentUser } = useAuth();
  const [estimates, setEstimates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadEstimates();
    loadCustomers();
  }, []);

  const loadEstimates = async () => {
    try {
      setLoading(true);
      const response = await estimateService.getEstimates();
      setEstimates(response.estimates || []);
    } catch (error) {
      console.error('Error loading estimates:', error);
      message.error('Failed to load estimates');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleCreateEstimate = () => {
    setEditingEstimate(null);
    form.resetFields();
    form.setFieldsValue({
      issueDate: dayjs(),
      validUntil: dayjs().add(30, 'days'),
      status: 'DRAFT'
    });
    setIsFormVisible(true);
  };

  const handleEditEstimate = (estimate) => {
    setEditingEstimate(estimate);
    form.setFieldsValue({
      customerId: estimate.customerId,
      amount: estimate.amount,
      description: estimate.description,
      comments: estimate.comments,
      terms: estimate.terms,
      issueDate: estimate.issueDate ? dayjs(estimate.issueDate) : null,
      validUntil: estimate.validUntil ? dayjs(estimate.validUntil) : null,
      status: estimate.status,
      charges: estimate.charges
    });
    setIsFormVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        issueDate: values.issueDate?.toISOString(),
        validUntil: values.validUntil?.toISOString()
      };

      if (editingEstimate) {
        await estimateService.updateEstimate(editingEstimate.id, data);
        message.success('Estimate updated successfully');
      } else {
        await estimateService.createEstimate(data);
        message.success('Estimate created successfully');
      }

      setIsFormVisible(false);
      form.resetFields();
      loadEstimates();
    } catch (error) {
      console.error('Error saving estimate:', error);
      message.error('Failed to save estimate');
    }
  };

  const handleDeleteEstimate = async (id) => {
    Modal.confirm({
      title: 'Delete Estimate',
      content: 'Are you sure you want to delete this estimate?',
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await estimateService.deleteEstimate(id);
          message.success('Estimate deleted successfully');
          loadEstimates();
          setIsModalVisible(false);
        } catch (error) {
          console.error('Error deleting estimate:', error);
          message.error('Failed to delete estimate');
        }
      }
    });
  };

  const handleSendEstimate = async (id) => {
    try {
      await estimateService.sendEstimate(id);
      message.success('Estimate sent to customer');
      loadEstimates();
      if (selectedEstimate && selectedEstimate.id === id) {
        setSelectedEstimate({ ...selectedEstimate, status: 'SENT' });
      }
    } catch (error) {
      console.error('Error sending estimate:', error);
      message.error('Failed to send estimate');
    }
  };

  const handleViewEstimate = (estimate) => {
    setSelectedEstimate(estimate);
    setIsModalVisible(true);
  };

  const getEstimateStatusColor = (status) => {
    const statusColors = {
      'DRAFT': 'default',
      'SENT': 'blue',
      'ACCEPTED': 'green',
      'REJECTED': 'red',
      'EXPIRED': 'orange'
    };
    return statusColors[status] || 'default';
  };

  const columns = [
    {
      title: 'Estimate #',
      dataIndex: 'estimateNumber',
      key: 'estimateNumber',
      fixed: 'left',
      width: 180,
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      width: 200,
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.customer?.email}
          </Text>
        </div>
      )
    },
    {
      title: 'Amount (GHS)',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          ₵{amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getEstimateStatusColor(status)}>
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Draft', value: 'DRAFT' },
        { text: 'Sent', value: 'SENT' },
        { text: 'Accepted', value: 'ACCEPTED' },
        { text: 'Rejected', value: 'REJECTED' },
        { text: 'Expired', value: 'EXPIRED' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 130,
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => new Date(a.issueDate) - new Date(b.issueDate)
    },
    {
      title: 'Valid Until',
      dataIndex: 'validUntil',
      key: 'validUntil',
      width: 130,
      render: (date) => {
        const isExpired = dayjs(date).isBefore(dayjs());
        return (
          <Text type={isExpired ? 'danger' : 'secondary'}>
            {dayjs(date).format('MMM DD, YYYY')}
          </Text>
        );
      },
      sorter: (a, b) => new Date(a.validUntil) - new Date(b.validUntil)
    },
    {
      title: 'Created By',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      width: 150
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewEstimate(record)}
          >
            View
          </Button>
          <PermissionGate
            userRole={currentUser?.role}
            userPermissions={currentUser?.permissions}
            permissions={PERMISSIONS.ESTIMATE_EDIT}
          >
            <Button 
              type="link" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditEstimate(record)}
              disabled={record.convertedToInvoice}
            >
              Edit
            </Button>
          </PermissionGate>
          {record.status === 'DRAFT' && (
            <PermissionGate
              userRole={currentUser?.role}
              userPermissions={currentUser?.permissions}
              permissions={PERMISSIONS.ESTIMATE_SEND}
            >
              <Button 
                type="link" 
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSendEstimate(record.id)}
              >
                Send
              </Button>
            </PermissionGate>
          )}
        </Space>
      )
    }
  ];

  const filteredEstimates = estimates.filter(estimate => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      estimate.estimateNumber?.toLowerCase().includes(search) ||
      estimate.customer?.name?.toLowerCase().includes(search) ||
      estimate.customer?.email?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: estimates.length,
    draft: estimates.filter(e => e.status === 'DRAFT').length,
    sent: estimates.filter(e => e.status === 'SENT').length,
    accepted: estimates.filter(e => e.status === 'ACCEPTED').length,
    totalValue: estimates.reduce((sum, e) => sum + (e.amount || 0), 0)
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <CalculatorOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          Estimates
        </Title>
        <Text type="secondary">Create and manage estimates for customers</Text>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Estimates"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Draft"
              value={stats.draft}
              valueStyle={{ color: '#8c8c8c' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sent"
              value={stats.sent}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats.totalValue}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              prefix="₵"
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <Search
            placeholder="Search estimates..."
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <PermissionGate
            userRole={currentUser?.role}
            userPermissions={currentUser?.permissions}
            permissions={PERMISSIONS.ESTIMATE_CREATE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateEstimate}
            >
              New Estimate
            </Button>
          </PermissionGate>
        </div>

        <Table
          columns={columns}
          dataSource={filteredEstimates}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} estimates`
          }}
        />
      </Card>

      {/* Estimate Form Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CalculatorOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            {editingEstimate ? 'Edit Estimate' : 'New Estimate'}
          </div>
        }
        open={isFormVisible}
        onCancel={() => {
          setIsFormVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
        okText={editingEstimate ? 'Update' : 'Create'}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="customerId"
            label="Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select
              showSearch
              placeholder="Select customer"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="issueDate"
                label="Issue Date"
                rules={[{ required: true, message: 'Please select issue date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="validUntil"
                label="Valid Until"
                rules={[{ required: true, message: 'Please select validity date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Brief description of services/products" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Total Amount (GHS)"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              formatter={value => `₵ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₵\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="terms"
            label="Terms & Conditions"
          >
            <TextArea rows={3} placeholder="Payment terms, delivery conditions, etc." />
          </Form.Item>

          <Form.Item
            name="comments"
            label="Comments"
          >
            <TextArea rows={2} placeholder="Internal comments (not visible to customer)" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
          >
            <Select>
              <Option value="DRAFT">Draft</Option>
              <Option value="SENT">Sent</Option>
              <Option value="ACCEPTED">Accepted</Option>
              <Option value="REJECTED">Rejected</Option>
              <Option value="EXPIRED">Expired</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Estimate Details Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalculatorOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <span>Estimate Details</span>
            {selectedEstimate && (
              <Tag color={getEstimateStatusColor(selectedEstimate.status)} style={{ marginLeft: 'auto' }}>
                {selectedEstimate.status}
              </Tag>
            )}
          </div>
        }
        placement="right"
        onClose={() => setIsModalVisible(false)}
        open={isModalVisible}
        width={700}
        extra={
          selectedEstimate && (
            <Space>
              {selectedEstimate.status === 'DRAFT' && (
                <PermissionGate
                  userRole={currentUser?.role}
                  userPermissions={currentUser?.permissions}
                  permissions={PERMISSIONS.ESTIMATE_SEND}
                >
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleSendEstimate(selectedEstimate.id)}
                  >
                    Send
                  </Button>
                </PermissionGate>
              )}
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit',
                      label: 'Edit',
                      icon: <EditOutlined />,
                      disabled: selectedEstimate.convertedToInvoice,
                      onClick: () => {
                        setIsModalVisible(false);
                        handleEditEstimate(selectedEstimate);
                      },
                    },
                    {
                      key: 'delete',
                      label: 'Delete',
                      icon: <DeleteOutlined />,
                      danger: true,
                      disabled: selectedEstimate.convertedToInvoice,
                      onClick: () => handleDeleteEstimate(selectedEstimate.id),
                    },
                  ],
                }}
                placement="bottomRight"
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          )
        }
      >
        {selectedEstimate && (
          <div>
            {/* Estimate Information */}
            <div style={{ 
              marginBottom: '24px',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fafafa'
            }}>
              <Title level={4} style={{ marginBottom: '16px' }}>Estimate Information</Title>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Estimate Number">
                  <Text strong>{selectedEstimate.estimateNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Issue Date">
                  {dayjs(selectedEstimate.issueDate).format('MMMM DD, YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Valid Until">
                  {dayjs(selectedEstimate.validUntil).format('MMMM DD, YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getEstimateStatusColor(selectedEstimate.status)}>
                    {selectedEstimate.status}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Customer Information */}
            <div style={{ 
              marginBottom: '24px',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#ffffff'
            }}>
              <Title level={4} style={{ marginBottom: '16px' }}>Customer Information</Title>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Name">
                  <Text strong>{selectedEstimate.customer?.name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedEstimate.customer?.email}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {selectedEstimate.customer?.phone}
                </Descriptions.Item>
                <Descriptions.Item label="Address">
                  {selectedEstimate.customer?.address}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Amount Details */}
            <div style={{ 
              marginBottom: '24px',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#f6ffed'
            }}>
              <Title level={4} style={{ marginBottom: '16px' }}>Amount</Title>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                ₵{selectedEstimate.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Description & Terms */}
            {selectedEstimate.description && (
              <div style={{ 
                marginBottom: '24px',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <Title level={4} style={{ marginBottom: '16px' }}>Description</Title>
                <Text>{selectedEstimate.description}</Text>
              </div>
            )}

            {selectedEstimate.terms && (
              <div style={{ 
                marginBottom: '24px',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff7e6'
              }}>
                <Title level={4} style={{ marginBottom: '16px' }}>Terms & Conditions</Title>
                <Text>{selectedEstimate.terms}</Text>
              </div>
            )}

            {selectedEstimate.comments && (
              <div style={{ 
                marginBottom: '24px',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#f0f0f0'
              }}>
                <Title level={4} style={{ marginBottom: '16px' }}>Internal Comments</Title>
                <Text type="secondary">{selectedEstimate.comments}</Text>
              </div>
            )}

            {/* Created By */}
            <div style={{ 
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #d9d9d9'
            }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Created by <strong>{selectedEstimate.createdBy?.name}</strong> on {dayjs(selectedEstimate.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
              </Text>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default EstimatesPage;

