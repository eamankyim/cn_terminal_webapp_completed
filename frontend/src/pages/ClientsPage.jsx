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
  Avatar, 
  Row, 
  Col,
  Statistic,
  Select,
  DatePicker,
  Form,
  message,
  Dropdown,
  Drawer,
  Tabs,
  InputNumber
} from 'antd';
import { 
  UserOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  GlobalOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  StarOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { useCustomers } from '../contexts/CustomerContext';
import { useConsignments } from '../contexts/ConsignmentContext';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ClientsPage = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isConsignmentModalVisible, setIsConsignmentModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editingConsignment, setEditingConsignment] = useState(null);
  const [form] = Form.useForm();
  const [consignmentForm] = Form.useForm();

  // Use CustomerContext for API integration
  const { customers, loading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  
  // Use ConsignmentContext for consignment management
  const { 
    consignments, 
    loading: consignmentsLoading, 
    addConsignment, 
    updateConsignment, 
    deleteConsignment: removeConsignment,
    loadConsignmentsByCustomer 
  } = useConsignments();
  
  // Use customers from context instead of local state
  const clients = customers;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'orange';
      case 'inactive': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '✓';
      case 'pending': return '⏳';
      case 'inactive': return '✗';
      default: return '?';
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // Note: Search filtering will be handled by the table component
    // The actual filtering should be done via API calls for better performance
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setIsModalVisible(true);
    // Load consignments for this client
    loadConsignmentsByCustomer(client.id);
  };

  // Consignment management functions
  const handleCreateConsignment = async (values) => {
    try {
      const consignmentData = {
        ...values,
        customerId: selectedClient.id
      };
      
      await addConsignment(consignmentData);
      message.success('Consignment created successfully');
      setIsConsignmentModalVisible(false);
      setEditingConsignment(null);
      consignmentForm.resetFields();
    } catch (error) {
      message.error('Failed to create consignment');
      console.error('Error creating consignment:', error);
    }
  };

  const handleEditConsignment = (consignment) => {
    setEditingConsignment(consignment);
    consignmentForm.setFieldsValue({
      ...consignment
    });
    setIsConsignmentModalVisible(true);
  };

  const handleDeleteConsignment = async (consignmentId) => {
    Modal.confirm({
      title: 'Delete Consignment',
      content: 'Are you sure you want to delete this consignment? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await removeConsignment(consignmentId);
          message.success('Consignment deleted successfully');
        } catch (error) {
          message.error('Failed to delete consignment');
          console.error('Error deleting consignment:', error);
        }
      }
    });
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    form.setFieldsValue(client);
    setIsCreateModalVisible(true);
  };

  const handleDeleteClient = async (clientId) => {
    Modal.confirm({
      title: 'Delete Client',
      content: 'Are you sure you want to delete this client? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteCustomer(clientId);
          message.success('Client deleted successfully');
        } catch (error) {
          message.error('Failed to delete client');
        }
      }
    });
  };


  const handleCreateClient = async (values) => {
    try {
      if (editingClient) {
        // Update existing client
        await updateCustomer(editingClient.id, values);
        message.success('Client updated successfully');
      } else {
        // Create new client
        await addCustomer(values);
        message.success('Client created successfully');
      }
      setIsCreateModalVisible(false);
      setEditingClient(null);
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to save client');
    }
  };

  const columns = [
    {
      title: 'Client',
      key: 'client',
      render: (_, record) => (
        <Space>
          <Avatar size="large" icon={<UserOutlined />} style={{ backgroundColor: '#2FA2EE' }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div><MailOutlined /> {record.email}</div>
          <div><PhoneOutlined /> {record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Client Type',
      dataIndex: 'customerType',
      key: 'customerType',
      render: (type) => (
        <Tag color={type === 'PREMIUM' ? 'gold' : type === 'VIP' ? 'purple' : 'default'}>
          {type || 'REGULAR'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.status === 'ACTIVE' ? 'green' : 'red'}>
          {record.status === 'ACTIVE' ? '✓ Active' : '✗ Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.city || 'N/A'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.country || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewClient(record)}
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
          <Title level={2}>Clients Management</Title>
          <Text type="secondary">Manage client information, profiles, and communication history</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={() => {
            setEditingClient(null);
            form.resetFields();
            setIsCreateModalVisible(true);
          }}
        >
          New Client
        </Button>
      </div>

      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Clients"
              value={clients.length}
              valueStyle={{ color: '#2FA2EE' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Clients"
              value={clients.filter(c => c.status === 'ACTIVE').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Regular Clients"
              value={clients.filter(c => c.customerType === 'REGULAR').length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Premium Clients"
              value={clients.filter(c => c.customerType === 'PREMIUM').length}
              valueStyle={{ color: '#722ed1' }}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
      </Row>
      


      {/* Search and Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Search clients by name, contact, or email"
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
                // TODO: Implement API-based filtering
                message.info('Status filtering will be implemented with API integration');
              }}
            >
              <Option value="active">Active</Option>
              <Option value="pending">Pending</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Select
              placeholder="Business Type"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => {
                // TODO: Implement API-based filtering
                message.info('Business type filtering will be implemented with API integration');
              }}
            >
              <Option value="Import/Export">Import/Export</Option>
              <Option value="Trading">Trading</Option>
              <Option value="Manufacturing">Manufacturing</Option>
              <Option value="Logistics">Logistics</Option>
              <Option value="Retail">Retail</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Clients Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={clients}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} clients`
          }}
        />
      </Card>

      {/* Client Details Drawer */}
      <Drawer
        title="Client Details"
        open={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        width={600}
        placement="right"
      >
                                  {selectedClient && (
           <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
               <div>
                <Title level={3}>{selectedClient.name || selectedClient.companyName || 'N/A'}</Title>
                <Tag color={selectedClient.status === 'ACTIVE' ? 'green' : 'red'} size="large">
                  {selectedClient.status === 'ACTIVE' ? '✓ Active' : '✗ Inactive'}
                </Tag>
               </div>
               <Dropdown
                 menu={{
                   items: [
                     {
                       key: 'edit',
                       icon: <EditOutlined />,
                       label: 'Edit Client',
                       onClick: () => {
                         setIsModalVisible(false);
                         handleEditClient(selectedClient);
                       }
                     },
                     {
                       key: 'delete',
                       icon: <DeleteOutlined />,
                       label: 'Delete Client',
                       danger: true,
                       onClick: () => {
                         setIsModalVisible(false);
                         handleDeleteClient(selectedClient.id);
                       }
                     }
                   ]
                 }}
                 placement="bottomRight"
               >
                 <Button type="text" icon={<MoreOutlined />} size="small" />
               </Dropdown>
             </div>

             {/* Tabs for Details and Consignments */}
             <Tabs
               defaultActiveKey="details"
               items={[
                 {
                   key: 'details',
                   label: 'Details',
                   children: (
                     <div>
                       {/* Contact Information */}
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
                           Contact Information
                         </Title>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                          <div style={{ width: '140px', fontWeight: 'bold' }}>Contact Person:</div>
                          <div>{selectedClient.contactPerson || 'N/A'}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Email:</div>
                           <div>{selectedClient.email}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Phone:</div>
                           <div>{selectedClient.phone}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Address:</div>
                           <div>{selectedClient.address}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Ghana Card:</div>
                           <div>{selectedClient.ghanaCard}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}></div>
                           <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                             Personal ID Card for the contact person
                           </div>
                         </div>
                       </div>

                       {/* Business Information */}
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
                           Business Information
                         </Title>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                          <div style={{ width: '140px', fontWeight: 'bold' }}>Business Type:</div>
                          <div>{selectedClient.businessType || 'N/A'}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Registration Number:</div>
                           <div>{selectedClient.registrationNumber || 'N/A'}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>TIN:</div>
                           <div>{selectedClient.tin || 'N/A'}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Client Type:</div>
                           <div>
                             <Tag color={selectedClient.customerType === 'PREMIUM' ? 'gold' : selectedClient.customerType === 'VIP' ? 'purple' : 'default'}>
                               {selectedClient.customerType || 'N/A'}
                             </Tag>
                           </div>
                         </div>
                       </div>

                       {/* Activity Summary */}
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
                           Activity Summary
                         </Title>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Total Shipments:</div>
                           <div>{selectedClient.totalShipments}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Total Value:</div>
                           <div>GHS {(selectedClient.totalValue || 0).toLocaleString()}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Last Activity:</div>
                           <div>{selectedClient.lastActivity}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                          <div style={{ width: '140px', fontWeight: 'bold' }}>Documents:</div>
                          <div>{selectedClient.documents ? selectedClient.documents.join(', ') : 'N/A'}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Total Consignments:</div>
                           <div>{selectedClient.consignments?.length || 0}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Consignments Value:</div>
                           <div>GHS {(selectedClient.consignments?.reduce((sum, c) => sum + c.value, 0) || 0).toLocaleString()}</div>
                         </div>
                       </div>
                     </div>
                   )
                 },
                 {
                   key: 'consignments',
                   label: 'Consignments',
                   children: (
                     <div>
                       <div style={{ 
                         marginBottom: '24px', 
                         border: '1px solid #d9d9d9', 
                         borderRadius: '8px', 
                         padding: '20px',
                         backgroundColor: '#ffffff'
                       }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <Title level={4} style={{ margin: 0 }}>
                            Consignments & Consignees
                          </Title>
                          <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setEditingConsignment(null);
                              consignmentForm.resetFields();
                              setIsConsignmentModalVisible(true);
                            }}
                          >
                            New Consignment
                          </Button>
                        </div>
                         
                        {consignments && consignments.length > 0 ? (
                          <div>
                            {consignments.map((consignment, index) => (
                              <div 
                                key={consignment.id}
                                style={{ 
                                  border: '1px solid #f0f0f0', 
                                  borderRadius: '6px', 
                                  padding: '16px', 
                                  marginBottom: '12px',
                                  backgroundColor: '#fafafa'
                                }}
                              >
                                <Row gutter={16}>
                                  <Col span={12}>
                                    <div style={{ marginBottom: '12px' }}>
                                      <Text strong>Consignee:</Text> {consignment.consigneeName}
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                      <Text strong>Consignee Address:</Text> {consignment.consigneeAddress}
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                      <Text strong>TIN:</Text> {consignment.tin || 'Not specified'}
                                    </div>
                                  </Col>
                                  <Col span={12}>
                                    <div style={{ marginBottom: '12px' }}>
                                      <Text strong>Phone:</Text> {consignment.consigneePhone}
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                      <Text strong>Ghana Card:</Text> {consignment.ghanaCard || 'Not specified'}
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                      <Text strong>Job ID:</Text> {consignment.trackingId}
                                    </div>
                                  </Col>
                                </Row>
                                
                                {/* Action Buttons */}
                                <div style={{ marginTop: '16px', textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
                                  <Space>
                                    <Button 
                                      size="small" 
                                      icon={<EditOutlined />}
                                      onClick={() => handleEditConsignment(consignment)}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      size="small" 
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => handleDeleteConsignment(consignment.id)}
                                    >
                                      Delete
                                    </Button>
                                  </Space>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                            <Text type="secondary">No consignments found for this client</Text>
                          </div>
                        )}
                       </div>
                     </div>
                   )
                 }
               ]}
             />
           </div>
         )}
      </Drawer>

      {/* Create/Edit Client Modal */}
      <Modal
        title={editingClient ? 'Edit Client' : 'New Client'}
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setEditingClient(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateClient}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Company Name"
                rules={[{ required: true, message: 'Please enter company name' }]}
              >
                <Input placeholder="Enter company name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPerson"
                label="Contact Person"
                rules={[{ required: true, message: 'Please enter contact person' }]}
              >
                <Input placeholder="Enter contact person name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input.TextArea placeholder="Enter full address" rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="businessType"
                label="Business Type"
                rules={[{ required: true, message: 'Please select business type' }]}
              >
                <Select placeholder="Select business type">
                  <Option value="Import/Export">Import/Export</Option>
                  <Option value="Trading">Trading</Option>
                  <Option value="Manufacturing">Manufacturing</Option>
                  <Option value="Logistics">Logistics</Option>
                  <Option value="Retail">Retail</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="registrationNumber"
                label="Registration Number"
                rules={[{ required: true, message: 'Please enter registration number' }]}
              >
                <Input placeholder="Enter registration number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tin"
                label="TIN"
                rules={[{ required: true, message: 'Please enter TIN' }]}
              >
                <Input placeholder="Enter TIN" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ghanaCard"
                label="Ghana Card"
                rules={[{ required: true, message: 'Please enter Ghana Card number' }]}
              >
                <Input placeholder="Enter Ghana Card number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerType"
                label="Client Type"
                rules={[{ required: true, message: 'Please select client type' }]}
              >
                <Select placeholder="Select client type">
                  <Option value="REGULAR">Regular</Option>
                  <Option value="PREMIUM">Premium</Option>
                  <Option value="VIP">VIP</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                setEditingClient(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingClient ? 'Update Client' : 'Create Client'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create/Edit Consignment Modal */}
      <Modal
        title={editingConsignment ? 'Edit Consignment' : 'New Consignment'}
        open={isConsignmentModalVisible}
        onCancel={() => {
          setIsConsignmentModalVisible(false);
          setEditingConsignment(null);
          consignmentForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={consignmentForm}
          layout="vertical"
          onFinish={handleCreateConsignment}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="consigneeName"
                label="Consignee Name"
                rules={[{ required: true, message: 'Please enter consignee name' }]}
              >
                <Input placeholder="Enter consignee name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="consigneePhone"
                label="Consignee Phone"
                rules={[{ required: true, message: 'Please enter consignee phone' }]}
              >
                <Input placeholder="Enter consignee phone" />
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
            <Col span={12}>
              <Form.Item
                name="tin"
                label="TIN"
                rules={[{ required: true, message: 'Please enter TIN' }]}
              >
                <Input placeholder="Enter TIN" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="consigneeAddress"
            label="Consignee Address"
            rules={[{ required: true, message: 'Please enter consignee address' }]}
          >
            <Input.TextArea placeholder="Enter consignee address" rows={2} />
          </Form.Item>


          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsConsignmentModalVisible(false);
                setEditingConsignment(null);
                consignmentForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingConsignment ? 'Update Consignment' : 'Create Consignment'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default ClientsPage;
