import React, { useState } from 'react';
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
  Badge,
  Alert,
  Drawer,
  Dropdown
} from 'antd';
import { 
  DollarOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
  CreditCardOutlined,
  WalletOutlined,
  MoreOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const PaymentsPage = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [form] = Form.useForm();

  // Payment data - will be replaced with API call
  const mockPayments = [];

  const [payments, setPayments] = useState(mockPayments);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'orange';
      case 'overdue': return 'red';
      case 'failed': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      case 'overdue': return <ExclamationCircleOutlined />;
      case 'failed': return <ExclamationCircleOutlined />;
      default: return null;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'bank_transfer': return <BankOutlined />;
      case 'credit_card': return <CreditCardOutlined />;
      case 'cash': return <WalletOutlined />;
      case 'mobile_money': return <WalletOutlined />;
      default: return <DollarOutlined />;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'credit_card': return 'Credit Card';
      case 'cash': return 'Cash';
      case 'mobile_money': return 'Mobile Money';
      case 'pending': return 'Pending';
      default: return method;
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value) {
      const filtered = mockPayments.filter(payment =>
        payment.id.toLowerCase().includes(value.toLowerCase()) ||
        payment.clientName.toLowerCase().includes(value.toLowerCase()) ||
        payment.invoiceId.toLowerCase().includes(value.toLowerCase())
      );
      setPayments(filtered);
    } else {
      setPayments(mockPayments);
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setIsModalVisible(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    form.setFieldsValue(payment);
    setIsCreateModalVisible(true);
  };

  const handleDeletePayment = (paymentId) => {
    Modal.confirm({
      title: 'Delete Payment',
      content: 'Are you sure you want to delete this payment record? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setPayments(payments.filter(p => p.id !== paymentId));
        message.success('Payment record deleted successfully');
      }
    });
  };

  const handleCreatePayment = (values) => {
    if (editingPayment) {
      // Update existing payment
      const updatedPayments = payments.map(p => 
        p.id === editingPayment.id ? { ...p, ...values } : p
      );
      setPayments(updatedPayments);
      message.success('Payment updated successfully');
    } else {
      // Create new payment
      const newPayment = {
        id: `PAY-2024-${String(payments.length + 1).padStart(3, '0')}`,
        ...values,
        status: 'completed',
        paymentDate: new Date().toISOString().split('T')[0]
      };
      setPayments([...payments, newPayment]);
      message.success('Payment recorded successfully');
    }
    setIsCreateModalVisible(false);
    setEditingPayment(null);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Payment ID',
      key: 'paymentId',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.id}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Invoice: {record.invoiceId}
          </div>
        </div>
      ),
    },
    {
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <div style={{ fontWeight: 'bold', color: '#2FA2EE' }}>
          GHS {record.amount.toLocaleString()}
        </div>
      ),
    },
    {
      title: 'Payment Method',
      key: 'paymentMethod',
      render: (_, record) => (
        <Space>
          {getPaymentMethodIcon(record.paymentMethod)}
          {getPaymentMethodLabel(record.paymentMethod)}
        </Space>
      ),
    },
    {
      title: 'Date',
      key: 'date',
      render: (_, record) => (
        <div>
          {record.paymentDate ? 
            new Date(record.paymentDate).toLocaleDateString() : 
            <Text type="secondary">Pending</Text>
          }
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)} icon={getStatusIcon(record.status)}>
          {record.status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewPayment(record)}
          size="small"
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>Payment Management</Title>
          <Text type="secondary">Track and manage client payments, record new payments, and monitor financial status</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={() => {
            setEditingPayment(null);
            form.resetFields();
            setIsCreateModalVisible(true);
          }}
        >
          Record Payment
        </Button>
      </div>

      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Payments"
              value={payments.filter(p => p.status === 'completed').length}
              valueStyle={{ color: '#2FA2EE' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Received"
              value={payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)}
              valueStyle={{ color: '#52c41a' }}
              prefix="GHS"
              formatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Amount"
              value={payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)}
              valueStyle={{ color: '#fa8c16' }}
              prefix="GHS"
              formatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue Amount"
              value={payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0)}
              valueStyle={{ color: '#f5222d' }}
              prefix="GHS"
              formatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {payments.filter(p => p.status === 'overdue').length > 0 && (
        <Alert
          message="Overdue Payments"
          description={`You have ${payments.filter(p => p.status === 'overdue').length} overdue payments totaling GHS ${payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}. Please follow up with clients.`}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Search and Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Search payments by ID, client, or invoice"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => {
                if (value) {
                  setPayments(mockPayments.filter(p => p.status === value));
                } else {
                  setPayments(mockPayments);
                }
              }}
            >
              <Option value="completed">Completed</Option>
              <Option value="pending">Pending</Option>
              <Option value="overdue">Overdue</Option>
              <Option value="failed">Failed</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Select
              placeholder="Payment Method"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => {
                if (value) {
                  setPayments(mockPayments.filter(p => p.paymentMethod === value));
                } else {
                  setPayments(mockPayments);
                }
              }}
            >
              <Option value="bank_transfer">Bank Transfer</Option>
              <Option value="credit_card">Credit Card</Option>
              <Option value="cash">Cash</Option>
              <Option value="mobile_money">Mobile Money</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Payments Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={payments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} payments`
          }}
        />
      </Card>

      {/* Payment Details Modal */}
      <Drawer
        title="Payment Details"
        placement="right"
        onClose={() => setIsModalVisible(false)}
        open={isModalVisible}
        width={700}
      >
        {selectedPayment && (
          <div>
            {/* Payment Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <Title level={3}>Payment #{selectedPayment.id}</Title>
                <Tag color={getStatusColor(selectedPayment.status)} size="large">
                  {getStatusIcon(selectedPayment.status)} {selectedPayment.status}
                </Tag>
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit',
                      label: 'Edit Payment',
                      icon: <EditOutlined />,
                      onClick: () => {
                        setIsModalVisible(false);
                        handleEditPayment(selectedPayment);
                      },
                    },
                    {
                      key: 'delete',
                      label: 'Delete Payment',
                      icon: <DeleteOutlined />,
                      danger: true,
                      onClick: () => {
                        setIsModalVisible(false);
                        handleDeletePayment(selectedPayment.id);
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
            </div>

            {/* Payment Overview */}
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
                Payment Overview
              </Title>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Invoice:</div>
                <div>{selectedPayment.invoiceId}</div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Date:</div>
                <div>{selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString() : 'Pending'}</div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Amount:</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2FA2EE' }}>
                  GHS {selectedPayment.amount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Payment Information */}
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
                Payment Information
              </Title>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Client Name:</div>
                <div>{selectedPayment.clientName}</div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Payment Method:</div>
                <div>
                  <Space>
                    {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                    {getPaymentMethodLabel(selectedPayment.paymentMethod)}
                  </Space>
                </div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Reference Number:</div>
                <div>{selectedPayment.reference || 'N/A'}</div>
              </div>
            </div>

            {/* Bank Details */}
            {selectedPayment.bankDetails && (
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
                  Bank Details
                </Title>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Bank:</div>
                  <div>{selectedPayment.bankDetails.bank}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Account Number:</div>
                  <div>{selectedPayment.bankDetails.account}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Branch:</div>
                  <div>{selectedPayment.bankDetails.branch}</div>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedPayment.notes && (
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
                  Notes
                </Title>
                <div>{selectedPayment.notes}</div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Create/Edit Payment Modal */}
      <Modal
        title={editingPayment ? 'Edit Payment' : 'Record New Payment'}
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setEditingPayment(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreatePayment}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="invoiceId"
                label="Invoice ID"
                rules={[{ required: true, message: 'Please enter invoice ID' }]}
              >
                <Input placeholder="Enter invoice ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="clientName"
                label="Client Name"
                rules={[{ required: true, message: 'Please enter client name' }]}
              >
                <Input placeholder="Enter client name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount (GHS)"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter amount"
                  formatter={value => `GHS ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\GHS\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[{ required: true, message: 'Please select payment method' }]}
              >
                <Select placeholder="Select payment method">
                  <Option value="bank_transfer">Bank Transfer</Option>
                  <Option value="credit_card">Credit Card</Option>
                  <Option value="cash">Cash</Option>
                  <Option value="mobile_money">Mobile Money</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reference"
                label="Reference Number"
              >
                <Input placeholder="Enter reference number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentDate"
                label="Payment Date"
                rules={[{ required: true, message: 'Please select payment date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea placeholder="Enter payment notes" rows={3} />
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                setEditingPayment(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPayment ? 'Update Payment' : 'Record Payment'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentsPage;
