import React, { useState, useEffect } from 'react';
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
  Dropdown,
  Spin,
  Alert,
  Tabs,
  Empty
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
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import invoiceService from '../services/invoiceService';
import jobService from '../services/jobService';

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
  const [invoices, setInvoices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('invoices');

  useEffect(() => {
    loadInvoices();
  }, []);

  // Reload jobs when invoices change to update filtering
  useEffect(() => {
    if (invoices.length >= 0) { // Only load jobs after invoices are loaded
      loadJobs();
    }
  }, [invoices]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading invoices...');
      console.log('🔑 Token present:', !!localStorage.getItem('cn_terminal_token'));
      console.log('🔑 Token preview:', localStorage.getItem('cn_terminal_token') ? `${localStorage.getItem('cn_terminal_token').substring(0, 20)}...` : 'None');
      
      const response = await invoiceService.getInvoices({ limit: 100 });
      console.log('✅ Invoices loaded successfully:', response);
      setInvoices(response.invoices || []);
    } catch (error) {
      console.error('❌ Error loading invoices:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Check if it's an authentication error
      if (error.message.includes('Access token required') || error.message.includes('401')) {
        setError('Authentication required. Please log in again.');
      } else if (error.message.includes('403')) {
        setError('Access denied. You do not have permission to view invoices.');
      } else if (error.message.includes('500')) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Failed to load invoices: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      console.log('🔄 Loading all jobs for invoice creation...');
      
      // Fetch all jobs and filter client-side for now
      const response = await jobService.getJobs({ limit: 100 });
      console.log('✅ All jobs loaded successfully:', response);
      
      // Filter out jobs that already have invoices
      const jobsWithoutInvoices = (response.jobs || []).filter(job => 
        !invoices.some(invoice => invoice.jobId === job.id)
      );
      
      console.log(`📊 Found ${jobsWithoutInvoices.length} jobs without invoices`);
      setJobs(jobsWithoutInvoices);
    } catch (error) {
      console.error('❌ Error loading jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

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

  const getJobStatusColor = (status, isDraft) => {
    if (isDraft) return 'default';
    const statusColors = {
      'NEW': 'green',
      'PREINVOICED': 'blue',
      'INVOICED': 'purple',
      'ENTRY': 'orange',
      'RELEASE': 'cyan',
      'CLEARED': 'green',
      'DELIVERED': 'green'
    };
    return statusColors[status] || 'default';
  };

  const getJobStatusIcon = (status, isDraft) => {
    if (isDraft) return <FileTextOutlined />;
    const statusIcons = {
      'NEW': <PlusOutlined />,
      'PREINVOICED': <FileTextOutlined />,
      'INVOICED': <DollarOutlined />,
      'ENTRY': <CalendarOutlined />,
      'RELEASE': <CheckCircleOutlined />,
      'CLEARED': <CheckCircleOutlined />,
      'DELIVERED': <CheckCircleOutlined />
    };
    return statusIcons[status] || <FileTextOutlined />;
  };


  const handleSearch = (value) => {
    setSearchText(value);
    // In a real implementation, this would trigger an API call with search parameters
    // For now, we'll do client-side filtering
    if (value) {
      const filtered = invoices.filter(invoice =>
        invoice.invoiceNumber?.toLowerCase().includes(value.toLowerCase()) ||
        invoice.customer?.name?.toLowerCase().includes(value.toLowerCase()) ||
        invoice.customer?.email?.toLowerCase().includes(value.toLowerCase())
      );
      setInvoices(filtered);
    } else {
      loadInvoices(); // Reload all invoices
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalVisible(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    form.setFieldsValue({
      customerId: invoice.customerId,
      jobId: invoice.jobId,
      shipmentId: invoice.shipmentId,
      amount: invoice.amount,
      issueDate: invoice.issueDate ? new Date(invoice.issueDate) : null,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null
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
      onOk: async () => {
        try {
          await invoiceService.deleteInvoice(invoiceId);
          message.success('Invoice deleted successfully');
          loadInvoices(); // Reload invoices
        } catch (error) {
          message.error('Failed to delete invoice');
        }
      }
    });
  };

  const handleCreateInvoice = async (values) => {
    try {
      if (editingInvoice) {
        // Update existing invoice
        await invoiceService.updateInvoice(editingInvoice.id, values);
        message.success('Invoice updated successfully');
      } else {
        // Create new invoice with job linking
        const invoiceData = {
          ...values,
          jobId: values.jobId, // Ensure jobId is included
          customerId: values.customerId || jobs.find(job => job.id === values.jobId)?.customerId,
          issueDate: values.issueDate?.toISOString(),
          dueDate: values.dueDate?.toISOString()
        };
        
        console.log('📄 Creating invoice with data:', invoiceData);
        await invoiceService.createInvoice(invoiceData);
        message.success('Invoice created successfully');
      }
      setIsCreateModalVisible(false);
      setEditingInvoice(null);
      form.resetFields();
      loadInvoices(); // Reload invoices (this will also reload jobs due to useEffect)
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      message.error(error.message || 'Failed to save invoice');
    }
  };

  const handleCreateInvoiceFromJob = (job) => {
    console.log('📄 Creating invoice for job:', job);
    
    // Pre-fill form with job data
    form.setFieldsValue({
      jobId: job.id,
      customerId: job.customerId,
      clientName: job.customer?.name || 'N/A',
      clientEmail: job.customer?.email || 'N/A',
      trackingId: job.trackingId,
      consignmentId: job.consignmentId,
      goodsTypes: job.goodsTypes?.join(', ') || 'N/A',
      amount: 0, // Will be calculated
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: `Invoice for job ${job.trackingId}`
    });
    
    setEditingInvoice(null);
    setIsCreateModalVisible(true);
  };

  const jobColumns = [
    {
      title: 'Job ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Client',
      key: 'clientName',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.customer?.name || 'N/A'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.customer?.email || 'N/A'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Goods',
      dataIndex: 'goodsTypes',
      key: 'goodsTypes',
      render: (goodsTypes) => (
        <div>
          {goodsTypes && goodsTypes.length > 0 ? (
            goodsTypes.slice(0, 2).map((type, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: '2px' }}>
                {type}
              </Tag>
            ))
          ) : (
            <Tag color="default">No goods types</Tag>
          )}
          {goodsTypes && goodsTypes.length > 2 && (
            <Tag color="default">+{goodsTypes.length - 2} more</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const displayStatus = record.isDraft ? 'DRAFT' : status;
        return (
          <Tag color={getJobStatusColor(status, record.isDraft)} icon={getJobStatusIcon(status, record.isDraft)}>
            {displayStatus}
          </Tag>
        );
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => handleCreateInvoiceFromJob(record)}
            size="small"
          >
            Create Invoice
          </Button>
        </Space>
      )
    }
  ];

  const columns = [
    {
      title: 'Invoice',
      key: 'invoice',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.invoiceNumber}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.issueDate ? new Date(record.issueDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Client',
      key: 'client',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.customer?.name || 'N/A'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.customer?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>GHS {record.amount?.toLocaleString() || '0'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.job?.trackingId ? `Job: ${record.job.trackingId}` : 'Direct Invoice'}
          </div>
        </div>
      ),
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      render: (_, record) => (
        <div>
          <div>{record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.status === 'OVERDUE' ? 'Overdue' : 'Due'}
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
              title="Jobs with Invoices"
              value={invoices.filter(invoice => invoice.jobId).length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Invoicing"
              value={jobs.length}
              valueStyle={{ color: '#f5222d' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'invoices',
              label: 'All Invoices',
              children: (
                <div>
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
                              setInvoices(invoices.filter(i => i.status === value));
                            } else {
                              loadInvoices();
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
                              const filtered = invoices.filter(i => new Date(i.invoiceDate) >= date.toDate());
                              setInvoices(filtered);
                            } else {
                              loadInvoices();
                            }
                          }}
                        />
                      </Col>
                    </Row>
                  </Card>

                  {/* Invoices Table */}
                  {error && (
                    <Alert
                      message="Error Loading Invoices"
                      description={error}
                      type="error"
                      showIcon
                      style={{ marginBottom: '16px' }}
                      action={
                        <Button size="small" onClick={loadInvoices}>
                          Retry
                        </Button>
                      }
                    />
                  )}
                  <Table
                    columns={columns}
                    dataSource={invoices}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`
                    }}
                  />
                </div>
              )
            },
            {
              key: 'jobs',
              label: 'Jobs for Invoicing',
              children: (
                <div>
                  {/* Jobs Table */}
                  <Table
                    columns={jobColumns}
                    dataSource={jobs}
                    loading={jobsLoading}
                    rowKey="id"
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
                                Jobs will appear here once they are created
                              </Text>
                            </div>
                          }
                        />
                      )
                    }}
                  />
                </div>
              )
            }
          ]}
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
          {/* Job Selection */}
          <Card size="small" title="Job Selection" style={{ marginBottom: 16 }}>
            <Form.Item
              name="jobId"
              label="Select Job to Create Invoice For"
              rules={[{ required: true, message: 'Please select a job' }]}
            >
              <Select
                placeholder="Choose a job to create invoice for"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                loading={jobsLoading}
                notFoundContent={jobsLoading ? 'Loading jobs...' : 'No jobs available for invoicing'}
                onChange={(jobId) => {
                  const selectedJob = jobs.find(job => job.id === jobId);
                  if (selectedJob) {
                    // Auto-populate form with job data
                    form.setFieldsValue({
                      customerId: selectedJob.customerId,
                      clientName: selectedJob.customer?.name || 'N/A',
                      clientEmail: selectedJob.customer?.email || 'N/A',
                      trackingId: selectedJob.trackingId,
                      consignmentId: selectedJob.consignmentId,
                      goodsTypes: selectedJob.goodsTypes?.join(', ') || 'N/A',
                      notes: `Invoice for job ${selectedJob.trackingId}`
                    });
                  }
                }}
              >
                {jobs.map(job => (
                  <Option key={job.id} value={job.id}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{job.trackingId}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {job.customer?.name || 'N/A'} • {job.goodsTypes?.join(', ') || 'No goods types'}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>

          {/* Job Information (if creating from job) */}
          {form.getFieldValue('jobId') && (
            <Card size="small" title="Job Information" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="trackingId"
                    label="Job ID"
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="goodsTypes"
                    label="Goods Types"
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {/* Client Information */}
          <Card size="small" title="Client Information" style={{ marginBottom: 16 }}>
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
          </Card>

          {/* Invoice Details */}
          <Card size="small" title="Invoice Details" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="amount"
                  label="Amount (GHS)"
                  rules={[{ required: true, message: 'Please enter amount' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.01}
                    formatter={value => `GHS ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/GHS\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="Invoice Status"
                  initialValue="DRAFT"
                >
                  <Select>
                    <Option value="DRAFT">Draft</Option>
                    <Option value="PENDING">Pending</Option>
                    <Option value="PAID">Paid</Option>
                  </Select>
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
          </Card>

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
