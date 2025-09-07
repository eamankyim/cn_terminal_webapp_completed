import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Timeline,
  Descriptions,
  Divider,
  Progress,
  Badge,
  InputNumber,
  DatePicker,
  Empty,
  Dropdown,
  Menu
} from 'antd';
import { 
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UserOutlined,
  ContainerOutlined,
  CalendarOutlined,
  DollarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  UploadOutlined,
  MoreOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ShipmentsPage = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Active shipments data - will be replaced with API call
  const [shipments, setShipments] = useState([]);

  const getStatusColor = (status) => {
    const statusColors = {
      'Under Review': 'orange',
      'Quoted': 'purple',
      'Awaiting Client Payment': 'magenta',
      'Paid': 'green',
      'Agent Payments In Progress': 'blue',
      'Arrival Confirmed': 'cyan',
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
      'Under Review': <ClockCircleOutlined />,
      'Quoted': <DollarOutlined />,
      'Awaiting Client Payment': <DollarOutlined />,
      'Paid': <CheckCircleOutlined />,
      'Agent Payments In Progress': <DollarOutlined />,
      'Arrival Confirmed': <ContainerOutlined />,
      'Clearing': <ContainerOutlined />,
      'Cleared': <CheckCircleOutlined />,
      'Out for Delivery': <CarOutlined />,
      'Delivered': <CheckCircleOutlined />,
      'Closed': <CheckCircleOutlined />
    };
    return statusIcons[status] || <ClockCircleOutlined />;
  };

  const getPaymentStatusColor = (status) => {
    return status === 'Paid' ? 'green' : 'orange';
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
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
      render: (eta) => (
        <Text>{eta}</Text>
      )
    },
    {
      title: 'Payment',
      dataIndex: 'clientPaymentStatus',
      key: 'clientPaymentStatus',
      render: (status) => (
        <Tag color={getPaymentStatusColor(status)}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => (
        <Text strong>GHS {amount.toLocaleString()}</Text>
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
          onClick={() => handleViewShipment(record)}
        >
          View
        </Button>
      )
    }
  ];

  const handleViewShipment = (shipment) => {
    setSelectedShipment(shipment);
    setIsDetailsDrawerVisible(true);
  };

  const handleUpdateStatus = (shipment) => {
    setSelectedShipment(shipment);
    statusForm.setFieldsValue({ status: shipment.status });
    setIsStatusModalVisible(true);
  };

  const handleCreateInvoice = (shipment) => {
    setSelectedShipment(shipment);
    invoiceForm.setFieldsValue({
      dutyAmount: shipment.dutyAmount,
      serviceFee: shipment.serviceFee,
      vat: shipment.vat,
      totalAmount: shipment.totalAmount
    });
    setIsInvoiceModalVisible(true);
  };

  const handleRecordAgentPayment = (shipment) => {
    setSelectedShipment(shipment);
    setIsPaymentModalVisible(true);
  };

  const handleStatusUpdate = async (values) => {
    setLoading(true);
    try {
      const updatedShipments = shipments.map(s => 
        s.key === selectedShipment.key 
          ? { ...s, status: values.status }
          : s
      );
      setShipments(updatedShipments);
      message.success('Shipment status updated successfully');
      setIsStatusModalVisible(false);
      statusForm.resetFields();
    } catch (error) {
      message.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSubmit = async (values) => {
    setLoading(true);
    try {
      const updatedShipments = shipments.map(s => 
        s.key === selectedShipment.key 
          ? { 
              ...s, 
              status: 'Awaiting Client Payment',
              dutyAmount: values.dutyAmount,
              serviceFee: values.serviceFee,
              vat: values.vat,
              totalAmount: values.totalAmount
            }
          : s
      );
      setShipments(updatedShipments);
      message.success('Invoice created and sent to client');
      setIsInvoiceModalVisible(false);
      invoiceForm.resetFields();
    } catch (error) {
      message.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (values) => {
    setLoading(true);
    try {
      const newPayment = {
        id: Date.now(),
        purpose: values.purpose,
        amount: values.amount,
        reference: values.reference,
        date: values.date,
        description: values.description
      };

      const updatedShipments = shipments.map(s => 
        s.key === selectedShipment.key 
          ? { 
              ...s, 
              agentPayments: [...s.agentPayments, newPayment]
            }
          : s
      );
      setShipments(updatedShipments);
      message.success('Agent payment recorded successfully');
      setIsPaymentModalVisible(false);
      paymentForm.resetFields();
    } catch (error) {
      message.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleEditShipment = (shipment) => {
    setEditingShipment(shipment);
    // In a real app, you would navigate to a form page to edit the shipment
    // For now, we'll just show a message
    message.info('Edit functionality not yet implemented.');
    setIsDetailsDrawerVisible(false);
  };

  const handleDeleteShipment = (key) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this shipment?',
      content: `This action cannot be undone. This will permanently delete shipment with Tracking ID: ${key}.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setShipments(shipments.filter(s => s.key !== key));
        message.success('Shipment deleted successfully');
      },
      onCancel: () => {
        console.log('Cancel delete');
      },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>Shipments Management</Title>
          <Text type="secondary">Manage active shipments and workflow progression</Text>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Shipments"
              value={shipments.length}
              prefix={<ContainerOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Under Review"
              value={shipments.filter(s => s.status === 'Under Review').length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Awaiting Payment"
              value={shipments.filter(s => s.status === 'Awaiting Client Payment').length}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Paid"
              value={shipments.filter(s => s.status === 'Paid').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Shipments Table */}
      <Card title="Active Shipments">
        <Table 
          columns={columns} 
          dataSource={shipments}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} shipments`
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '16px', marginBottom: '8px' }}>
                      No shipments found
                    </Text>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      Shipments will appear here once jobs are moved to shipment status
                    </Text>
                  </div>
                }
              >
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/jobs')}
                  size="large"
                >
                  View Jobs
                </Button>
              </Empty>
            )
          }}
        />
      </Card>

      {/* Status Update Modal */}
      <Modal
        title="Update Shipment Status"
        open={isStatusModalVisible}
        onCancel={() => setIsStatusModalVisible(false)}
        footer={null}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleStatusUpdate}
        >
          <Form.Item
            name="status"
            label="New Status"
            rules={[{ required: true, message: 'Please select new status' }]}
          >
            <Select placeholder="Select new status">
              <Option value="Under Review">Under Review</Option>
              <Option value="Quoted">Quoted</Option>
              <Option value="Awaiting Client Payment">Awaiting Client Payment</Option>
              <Option value="Paid">Paid</Option>
              <Option value="Agent Payments In Progress">Agent Payments In Progress</Option>
              <Option value="Arrival Confirmed">Arrival Confirmed</Option>
              <Option value="Clearing">Clearing</Option>
              <Option value="Cleared">Cleared</Option>
              <Option value="Out for Delivery">Out for Delivery</Option>
              <Option value="Delivered">Delivered</Option>
              <Option value="Closed">Closed</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsStatusModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Status
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        title="Create Invoice"
        open={isInvoiceModalVisible}
        onCancel={() => setIsInvoiceModalVisible(false)}
        footer={null}
      >
        <Form
          form={invoiceForm}
          layout="vertical"
          onFinish={handleInvoiceSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dutyAmount"
                label="Duty Amount (GHS)"
                rules={[{ required: true, message: 'Please enter duty amount' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="Enter duty amount" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="serviceFee"
                label="Service Fee (GHS)"
                rules={[{ required: true, message: 'Please enter service fee' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="Enter service fee" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vat"
                label="VAT (GHS)"
                rules={[{ required: true, message: 'Please enter VAT' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="Enter VAT" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="Total Amount (GHS)"
                rules={[{ required: true, message: 'Please enter total amount' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="Enter total amount" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsInvoiceModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Invoice
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Record Agent Payment Modal */}
      <Modal
        title="Record Agent Payment"
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        footer={null}
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handlePaymentSubmit}
        >
          <Form.Item
            name="purpose"
            label="Payment Purpose"
            rules={[{ required: true, message: 'Please select payment purpose' }]}
          >
            <Select placeholder="Select payment purpose">
              <Option value="Shipping Line">Shipping Line</Option>
              <Option value="Terminal Charges">Terminal Charges</Option>
              <Option value="Customs Duty">Customs Duty</Option>
              <Option value="Port Charges">Port Charges</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount (GHS)"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="Enter amount" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Payment Date"
                rules={[{ required: true, message: 'Please select payment date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reference"
            label="Payment Reference"
            rules={[{ required: true, message: 'Please enter payment reference' }]}
          >
            <Input placeholder="Enter payment reference" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter payment description" />
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsPaymentModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Record Payment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Shipment Details Drawer */}
      <Drawer
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>Shipment Details</Title>
            <Text type="secondary">Tracking ID: {selectedShipment?.trackingId}</Text>
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
                setIsDetailsDrawerVisible(false);
                handleUpdateStatus(selectedShipment);
              }}
            >
              Update Status
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'edit',
                    label: 'Edit Shipment',
                    icon: <EditOutlined />,
                    onClick: () => {
                      setIsDetailsDrawerVisible(false);
                      handleEditShipment(selectedShipment);
                    },
                  },
                  {
                    key: 'delete',
                    label: 'Delete Shipment',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => {
                      setIsDetailsDrawerVisible(false);
                      handleDeleteShipment(selectedShipment.key);
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
        {selectedShipment && (
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
              <Card title="Shipment Timeline" size="small">
                <Timeline>
                  {selectedShipment.timeline.map((item, index) => (
                    <Timeline.Item 
                      key={index}
                      color={item.status === 'completed' ? 'green' : item.status === 'in-progress' ? 'blue' : 'gray'}
                      dot={<UserOutlined style={{ color: item.status === 'completed' ? '#52c41a' : '#1890ff' }} />}
                    >
                      <div>
                        <Text strong>{item.event}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.date}
                        </Text>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
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
                      <Text strong>Shipment Created</Text>
                      <br />
                      <Text type="secondary">Shipment created from job request by Staff 1</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {selectedShipment.submittedDate} - Staff 1
                      </Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item 
                    color="green"
                    dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  >
                    <div>
                      <Text strong>Documents Processed</Text>
                      <br />
                      <Text type="secondary">All customs documents processed</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {selectedShipment.submittedDate} - Customs Officer
                      </Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item 
                    color="blue"
                    dot={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}
                  >
                    <div>
                      <Text strong>Duty Calculated</Text>
                      <br />
                      <Text type="secondary">Duty and taxes calculated</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {selectedShipment.submittedDate} - Finance Officer
                      </Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item 
                    color="green"
                    dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  >
                    <div>
                      <Text strong>Ready for Delivery</Text>
                      <br />
                      <Text type="secondary">Shipment cleared and ready for delivery</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {selectedShipment.submittedDate} - Warehouse Manager
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
              {/* Shipment Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <Title level={3}>{selectedShipment.trackingId}</Title>
                  <Tag color={getStatusColor(selectedShipment.status)} size="large">
                    {selectedShipment.status}
                  </Tag>
                </div>
              </div>

              {/* Shipment Overview */}
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
                  Shipment Overview
                </Title>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Client:</div>
                  <div>{selectedShipment.clientName}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Goods Type:</div>
                  <div><Tag color="blue">{selectedShipment.goodsType}</Tag></div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Port of Entry:</div>
                  <div>{selectedShipment.port}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>ETA:</div>
                  <div>{selectedShipment.eta}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Status:</div>
                  <div><Tag color={getStatusColor(selectedShipment.status)}>{selectedShipment.status}</Tag></div>
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
                  <div>{selectedShipment.clientName}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Email:</div>
                  <div>{selectedShipment.clientEmail}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Phone:</div>
                  <div>{selectedShipment.clientPhone}</div>
                </div>
              </div>



              {/* Agent Payments */}
              {selectedShipment.agentPayments.length > 0 && (
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
                    Agent Payments
                  </Title>
                  <Table
                    dataSource={selectedShipment.agentPayments}
                    columns={[
                      { title: 'Purpose', dataIndex: 'purpose', key: 'purpose' },
                      { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount) => `GHS ${amount.toLocaleString()}` },
                      { title: 'Reference', dataIndex: 'reference', key: 'reference' },
                      { title: 'Date', dataIndex: 'date', key: 'date' }
                    ]}
                    pagination={false}
                    size="small"
                  />
                </div>
              )}
            </TabPane>
          </Tabs>
        )}
      </Drawer>
    </div>
  );
};

export default ShipmentsPage;
