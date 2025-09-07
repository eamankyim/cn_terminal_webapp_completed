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
  Drawer,
  Dropdown
} from 'antd';
import { 
  FileTextOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SendOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  MoreOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const InvoicesPage = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [form] = Form.useForm();

  // Invoice data - will be replaced with API call
  const mockInvoices = [];

  const [invoices, setInvoices] = useState(mockInvoices);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'orange';
      case 'overdue': return 'red';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return '✓';
      case 'pending': return '⏳';
      case 'overdue': return '⚠';
      case 'draft': return '📝';
      default: return '?';
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value) {
      const filtered = mockInvoices.filter(invoice =>
        invoice.id.toLowerCase().includes(value.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(value.toLowerCase()) ||
        invoice.clientEmail.toLowerCase().includes(value.toLowerCase())
      );
      setInvoices(filtered);
    } else {
      setInvoices(mockInvoices);
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalVisible(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    form.setFieldsValue({
      ...invoice,
      items: invoice.items.map(item => ({ ...item, key: Math.random() }))
    });
    setIsCreateModalVisible(true);
  };

  const handleDeleteInvoice = (invoiceId) => {
    Modal.confirm({
      title: 'Delete Invoice',
      content: 'Are you sure you want to delete this invoice? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setInvoices(invoices.filter(i => i.id !== invoiceId));
        message.success('Invoice deleted successfully');
      }
    });
  };

  const handleCreateInvoice = (values) => {
    if (editingInvoice) {
      // Update existing invoice
      const updatedInvoices = invoices.map(i => 
        i.id === editingInvoice.id ? { ...i, ...values } : i
      );
      setInvoices(updatedInvoices);
      message.success('Invoice updated successfully');
    } else {
      // Create new invoice
      const newInvoice = {
        id: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
        ...values,
        status: 'draft',
        paymentDate: null
      };
      setInvoices([...invoices, newInvoice]);
      message.success('Invoice created successfully');
    }
    setIsCreateModalVisible(false);
    setEditingInvoice(null);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Invoice',
      key: 'invoice',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.id}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {new Date(record.invoiceDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Client',
      key: 'client',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.clientName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.clientEmail}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>GHS {record.total.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Base: GHS {record.amount.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      render: (_, record) => (
        <div>
          <div>{new Date(record.dueDate).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.status === 'overdue' ? 'Overdue' : 'Due'}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusIcon(record.status)} {record.status}
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
          onClick={() => handleViewInvoice(record)}
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
          <Title level={2}>Invoice Management</Title>
          <Text type="secondary">Create, manage, and track client invoices and payments</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={() => {
            setEditingInvoice(null);
            form.resetFields();
            setIsCreateModalVisible(true);
          }}
        >
          New Invoice
        </Button>
      </div>

      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={invoices.length}
              valueStyle={{ color: '#2FA2EE' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Paid Invoices"
              value={invoices.filter(i => i.status === 'paid').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Amount"
              value={invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0)}
              valueStyle={{ color: '#fa8c16' }}
              prefix="GHS"
              formatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0)}
              valueStyle={{ color: '#722ed1' }}
              prefix="GHS"
              formatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Search invoices by ID, client, or email"
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
                  setInvoices(mockInvoices.filter(i => i.status === value));
                } else {
                  setInvoices(mockInvoices);
                }
              }}
            >
              <Option value="paid">Paid</Option>
              <Option value="pending">Pending</Option>
              <Option value="overdue">Overdue</Option>
              <Option value="draft">Draft</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <DatePicker
              placeholder="From Date"
              style={{ width: '100%' }}
              onChange={(date) => {
                if (date) {
                  const filtered = mockInvoices.filter(i => new Date(i.invoiceDate) >= date.toDate());
                  setInvoices(filtered);
                } else {
                  setInvoices(mockInvoices);
                }
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* Invoices Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`
          }}
        />
      </Card>

      {/* Invoice Details Modal */}
      <Drawer
        title="Invoice Details"
        placement="right"
        onClose={() => setIsModalVisible(false)}
        open={isModalVisible}
        width={600}
      >
        {selectedInvoice && (
          <div>
            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <Title level={3}>Invoice #{selectedInvoice.id}</Title>
                <Tag color={getStatusColor(selectedInvoice.status)} size="large">
                  {getStatusIcon(selectedInvoice.status)} {selectedInvoice.status}
                </Tag>
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit',
                      label: 'Edit Invoice',
                      icon: <EditOutlined />,
                      onClick: () => {
                        setIsModalVisible(false);
                        handleEditInvoice(selectedInvoice);
                      },
                    },
                    {
                      key: 'delete',
                      label: 'Delete Invoice',
                      icon: <DeleteOutlined />,
                      danger: true,
                      onClick: () => {
                        setIsModalVisible(false);
                        handleDeleteInvoice(selectedInvoice.id);
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

            {/* Invoice Overview */}
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
                Invoice Overview
              </Title>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Invoice Date:</div>
                <div>{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Due Date:</div>
                <div>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</div>
              </div>
              {selectedInvoice.paymentDate && (
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Payment Date:</div>
                  <div>{new Date(selectedInvoice.paymentDate).toLocaleDateString()}</div>
                </div>
              )}
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
                <div style={{ width: '140px', fontWeight: 'bold' }}>Client Name:</div>
                <div>{selectedInvoice.clientName}</div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Client Email:</div>
                <div>{selectedInvoice.clientEmail}</div>
              </div>
            </div>

            {/* Invoice Items */}
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
                Invoice Items
              </Title>
              <Table
                dataSource={selectedInvoice.items}
                pagination={false}
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 80 },
                  { title: 'Rate (GHS)', dataIndex: 'rate', key: 'rate', width: 120 },
                  { title: 'Amount (GHS)', dataIndex: 'amount', key: 'amount', width: 120 }
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <strong>Subtotal</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}></Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <strong>GHS {selectedInvoice.amount.toLocaleString()}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </div>

            {/* Financial Summary */}
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
                Financial Summary
              </Title>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Subtotal:</div>
                <div>GHS {selectedInvoice.amount.toLocaleString()}</div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Tax (15%):</div>
                <div>GHS {selectedInvoice.tax.toLocaleString()}</div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Total:</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>GHS {selectedInvoice.total.toLocaleString()}</div>
              </div>
            </div>

            {/* Notes */}
            {selectedInvoice.notes && (
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
                <div>{selectedInvoice.notes}</div>
              </div>
            )}

            {/* Actions */}
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
                Actions
              </Title>
              <Space>
                <Button icon={<DownloadOutlined />}>
                  Download PDF
                </Button>
                <Button type="primary" icon={<SendOutlined />}>
                  Send to Client
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create/Edit Invoice Modal */}
      <Modal
        title={editingInvoice ? 'Edit Invoice' : 'New Invoice'}
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setEditingInvoice(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateInvoice}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="clientName"
                label="Client Name"
                rules={[{ required: true, message: 'Please enter client name' }]}
              >
                <Input placeholder="Enter client name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="clientEmail"
                label="Client Email"
                rules={[
                  { required: true, message: 'Please enter client email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter client email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="invoiceDate"
                label="Invoice Date"
                rules={[{ required: true, message: 'Please select invoice date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea placeholder="Enter invoice notes" rows={3} />
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                setEditingInvoice(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoicesPage;
