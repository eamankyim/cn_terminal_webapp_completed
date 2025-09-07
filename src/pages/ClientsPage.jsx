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
  MoreOutlined
} from '@ant-design/icons';

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

  // Client data - will be replaced with API call
  const mockClients = [];

  const [clients, setClients] = useState(mockClients);

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
    if (value) {
      const filtered = mockClients.filter(client =>
        client.name.toLowerCase().includes(value.toLowerCase()) ||
        client.contactPerson.toLowerCase().includes(value.toLowerCase()) ||
        client.email.toLowerCase().includes(value.toLowerCase())
      );
      setClients(filtered);
    } else {
      setClients(mockClients);
    }
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setIsModalVisible(true);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    form.setFieldsValue(client);
    setIsCreateModalVisible(true);
  };

  const handleDeleteClient = (clientId) => {
    Modal.confirm({
      title: 'Delete Client',
      content: 'Are you sure you want to delete this client? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setClients(clients.filter(c => c.id !== clientId));
        message.success('Client deleted successfully');
      }
    });
  };

  // Consignment management functions
  const handleCreateConsignment = (values) => {
    if (editingConsignment) {
      // Update existing consignment
      const updatedClients = clients.map(client => {
        if (client.id === selectedClient.id) {
          return {
            ...client,
            consignments: client.consignments.map(consignment =>
              consignment.id === editingConsignment.id ? { ...consignment, ...values } : consignment
            )
          };
        }
        return client;
      });
      setClients(updatedClients);
      message.success('Consignment updated successfully');
    } else {
      // Create new consignment
      const newConsignment = {
        id: `CON-${Date.now()}`,
        trackingId: `TRK-${Date.now()}`,
        ...values,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
      };
      
      const updatedClients = clients.map(client => {
        if (client.id === selectedClient.id) {
          return {
            ...client,
            consignments: [...(client.consignments || []), newConsignment]
          };
        }
        return client;
      });
      setClients(updatedClients);
      message.success('Consignment created successfully');
    }
    
    setIsConsignmentModalVisible(false);
    setEditingConsignment(null);
    consignmentForm.resetFields();
  };

  const handleEditConsignment = (consignment) => {
    setEditingConsignment(consignment);
    consignmentForm.setFieldsValue(consignment);
    setIsConsignmentModalVisible(true);
  };

  const handleDeleteConsignment = (consignmentId) => {
    Modal.confirm({
      title: 'Delete Consignment',
      content: 'Are you sure you want to delete this consignment? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        const updatedClients = clients.map(client => {
          if (client.id === selectedClient.id) {
            return {
              ...client,
              consignments: client.consignments.filter(c => c.id !== consignmentId)
            };
          }
          return client;
        });
        setClients(updatedClients);
        message.success('Consignment deleted successfully');
      }
    });
  };

  const handleCreateClient = (values) => {
    if (editingClient) {
      // Update existing client
      const updatedClients = clients.map(c => 
        c.id === editingClient.id ? { ...c, ...values } : c
      );
      setClients(updatedClients);
      message.success('Client updated successfully');
    } else {
      // Create new client
      const newClient = {
        id: Date.now(),
        ...values,
        status: 'pending',
        totalShipments: 0,
        totalValue: 0,
        lastActivity: new Date().toISOString().split('T')[0],
        documents: []
      };
      setClients([...clients, newClient]);
      message.success('Client created successfully');
    }
    setIsCreateModalVisible(false);
    setEditingClient(null);
    form.resetFields();
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
            <div style={{ fontSize: '12px', color: '#666' }}>{record.contactPerson}</div>
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
      title: 'Business Type',
      dataIndex: 'businessType',
      key: 'businessType',
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
      title: 'Shipments',
      key: 'shipments',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.totalShipments}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            GHS {record.totalValue.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
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
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Clients"
              value={clients.filter(c => c.status === 'active').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Shipments"
              value={clients.reduce((sum, c) => sum + c.totalShipments, 0)}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={clients.reduce((sum, c) => sum + c.totalValue, 0)}
              valueStyle={{ color: '#722ed1' }}
              prefix="GHS"
              formatter={(value) => `${(value / 1000000).toFixed(1)}M`}
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
                if (value) {
                  setClients(mockClients.filter(c => c.status === value));
                } else {
                  setClients(mockClients);
                }
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
                if (value) {
                  setClients(mockClients.filter(c => c.businessType === value));
                } else {
                  setClients(mockClients);
                }
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
                 <Title level={3}>{selectedClient.name}</Title>
                 <Tag color={getStatusColor(selectedClient.status)} size="large">
                   {getStatusIcon(selectedClient.status)} {selectedClient.status}
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
                           <div>{selectedClient.contactPerson}</div>
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
                           <div>{selectedClient.businessType}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Registration Number:</div>
                           <div>{selectedClient.registrationNumber}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>TIN:</div>
                           <div>{selectedClient.tin}</div>
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
                           <div>GHS {selectedClient.totalValue.toLocaleString()}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Last Activity:</div>
                           <div>{selectedClient.lastActivity}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Documents:</div>
                           <div>{selectedClient.documents.join(', ')}</div>
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
                         
                         {selectedClient.consignments && selectedClient.consignments.length > 0 ? (
                           <div>
                             {selectedClient.consignments.map((consignment, index) => (
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
                                     <div style={{ marginBottom: '8px' }}>
                                       <Text strong>Consignee:</Text> {consignment.consigneeName}
                                     </div>
                                     <div style={{ marginBottom: '8px' }}>
                                       <Text strong>Phone:</Text> {consignment.consigneePhone}
                                     </div>
                                     <div style={{ marginBottom: '8px' }}>
                                       <Text strong>Consignee Address:</Text> {consignment.consigneeAddress}
                                     </div>
                                     <div style={{ marginBottom: '8px' }}>
                                       <Text strong>Ghana Card:</Text> {consignment.ghanaCard || 'Not specified'}
                                     </div>
                                     <div style={{ marginBottom: '8px' }}>
                                       <Text strong>TIN:</Text> {consignment.tin || 'Not specified'}
                                     </div>
                                   </Col>
                                                                      <Col span={12}>
                                     <div style={{ marginBottom: '8px' }}>
                                       <Text strong>Tracking ID:</Text> {consignment.trackingId}
                                     </div>
                                     <div style={{ marginBottom: '8px' }}>
                                       <Text strong>Goods Type:</Text> {consignment.goodsType}
                                     </div>
                                     <div style={{ marginBottom: '8px' }}>
                                       <Text strong>Status:</Text> 
                                       <Tag 
                                         color={
                                           consignment.status === 'Delivered' ? 'success' : 
                                           consignment.status === 'In Transit' ? 'processing' : 
                                           'warning'
                                         }
                                         style={{ marginLeft: '8px' }}
                                       >
                                         {consignment.status}
                                       </Tag>
                                     </div>
                                     <div style={{ marginBottom: '8px' }}>
                                       <Text strong>Value:</Text> GHS {consignment.value.toLocaleString()}
                                     </div>
                                     <div style={{ marginBottom: '8px' }}>
                                       <Text strong>Date:</Text> {consignment.date}
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="goodsType"
                label="Goods Type"
                rules={[{ required: true, message: 'Please enter goods type' }]}
              >
                <Input placeholder="Enter goods type" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="value"
                label="Value (GHS)"
                rules={[{ required: true, message: 'Please enter value' }]}
              >
                <InputNumber 
                  placeholder="Enter value" 
                  style={{ width: '100%' }}
                  formatter={value => `GHS ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\GHS\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  <Option value="Pending">Pending</Option>
                  <Option value="In Transit">In Transit</Option>
                  <Option value="Delivered">Delivered</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

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
