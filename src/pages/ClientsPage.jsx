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

  // Mock client data
  const mockClients = [
    {
      id: 1,
      name: 'Ghana Import Export Ltd',
      contactPerson: 'Kwame Asante',
      email: 'kwame@ghanaimport.com',
      phone: '+233 24 123 4567',
      address: '123 High Street, Accra, Ghana',
      businessType: 'Import/Export',
      registrationNumber: 'GH-2023-001',
      tin: 'GH123456789',
      ghanaCard: 'GHA-123456789-0',
      status: 'active',
      totalShipments: 45,
      totalValue: 1250000,
      lastActivity: '2024-01-15',
      documents: ['Business Registration', 'Tax Certificate', 'Import License'],
      consignments: [
        {
          id: 'CON-001',
          trackingId: 'TRK-2024-001',
          consigneeName: 'Kwame Asante',
          consigneePhone: '+233 24 123 4567',
          consigneeAddress: '123 High Street, Accra, Ghana',
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
          consigneeName: 'Sarah Asante',
          consigneePhone: '+233 26 111 2222',
          consigneeAddress: '456 Market Road, Kumasi, Ghana',
          goodsType: 'Textiles',
          status: 'Delivered',
          value: 15000,
          date: '2024-01-15',
          tin: '123456789',
          ghanaCard: 'GHA-123456789-0'
        },
        {
          id: 'CON-003',
          trackingId: 'TRK-2024-003',
          consigneeName: 'Michael Asante',
          consigneePhone: '+233 20 333 4444',
          consigneeAddress: '789 Industrial Zone, Tema, Ghana',
          goodsType: 'Machinery',
          status: 'Pending',
          value: 85000,
          date: '2024-01-25',
          tin: '123456789',
          ghanaCard: 'GHA-123456789-0'
        }
      ]
    },
    {
      id: 2,
      name: 'West Africa Trading Co',
      contactPerson: 'Ama Osei',
      email: 'ama@watrading.com',
      phone: '+233 26 987 6543',
      address: '456 Commercial Ave, Kumasi, Ghana',
      businessType: 'Trading',
      registrationNumber: 'GH-2023-002',
      tin: 'GH987654321',
      ghanaCard: 'GHA-987654321-0',
      status: 'active',
      totalShipments: 32,
      totalValue: 890000,
      lastActivity: '2024-01-12',
      documents: ['Business Registration', 'Tax Certificate'],
      consignments: [
        {
          id: 'CON-004',
          trackingId: 'TRK-2024-004',
          consigneeName: 'Ama Osei',
          consigneePhone: '+233 26 987 6543',
          consigneeAddress: '456 Commercial Ave, Kumasi, Ghana',
          goodsType: 'Trading Goods',
          status: 'Delivered',
          value: 18000,
          date: '2024-01-12',
          tin: '987654321',
          ghanaCard: 'GHA-987654321-0'
        }
      ]
    },
    {
      id: 3,
      name: 'Accra Manufacturing Ltd',
      contactPerson: 'Kofi Mensah',
      email: 'kofi@accramanufacturing.com',
      phone: '+233 20 555 1234',
      address: '789 Industrial Zone, Tema, Ghana',
      businessType: 'Manufacturing',
      registrationNumber: 'GH-2023-003',
      tin: 'GH555123456',
      ghanaCard: 'GHA-555123456-0',
      status: 'pending',
      totalShipments: 18,
      totalValue: 450000,
      lastActivity: '2024-01-10',
      documents: ['Business Registration', 'Manufacturing License'],
      consignments: [
        {
          id: 'CON-005',
          trackingId: 'TRK-2024-005',
          consigneeName: 'Kofi Mensah',
          consigneePhone: '+233 20 555 1234',
          consigneeAddress: '789 Industrial Zone, Tema, Ghana',
          goodsType: 'Industrial Equipment',
          status: 'Pending',
          value: 120000,
          date: '2024-01-10',
          tin: '555123456',
          ghanaCard: 'GHA-555123456-0'
        }
      ]
    },
    {
      id: 4,
      name: 'Tema Port Services',
      contactPerson: 'Efua Addo',
      email: 'efua@temaport.com',
      phone: '+233 27 777 8888',
      address: '321 Port Road, Tema, Ghana',
      businessType: 'Logistics',
      registrationNumber: 'GH-2023-004',
      tin: 'GH777888999',
      ghanaCard: 'GHA-777888999-0',
      status: 'active',
      totalShipments: 67,
      totalValue: 2100000,
      lastActivity: '2024-01-18',
      documents: ['Business Registration', 'Port License', 'Tax Certificate'],
      consignments: [
        {
          id: 'CON-006',
          trackingId: 'TRK-2024-006',
          consigneeName: 'Efua Addo',
          consigneePhone: '+233 27 777 8888',
          consigneeAddress: '321 Port Road, Tema, Ghana',
          goodsType: 'Logistics Equipment',
          status: 'In Transit',
          value: 95000,
          date: '2024-01-18'
        },
        {
          id: 'CON-007',
          trackingId: 'TRK-2024-007',
          consigneeName: 'Port Manager',
          consigneePhone: '+233 27 777 8889',
          consigneeAddress: '321 Port Road, Tema, Ghana',
          goodsType: 'Port Machinery',
          status: 'Delivered',
          value: 180000,
          date: '2024-01-15'
        }
      ]
    },
    {
      id: 5,
      name: 'Kumasi Retail Group',
      contactPerson: 'Yaw Darko',
      email: 'yaw@kumasiretail.com',
      phone: '+233 25 444 7777',
      address: '654 Market Square, Kumasi, Ghana',
      businessType: 'Retail',
      registrationNumber: 'GH-2023-005',
      tin: 'GH444777888',
      ghanaCard: 'GHA-444777888-0',
      status: 'inactive',
      totalShipments: 12,
      totalValue: 180000,
      lastActivity: '2023-12-20',
      documents: ['Business Registration'],
      consignments: [
        {
          id: 'CON-008',
          trackingId: 'TRK-2024-008',
          consigneeName: 'Yaw Darko',
          consigneePhone: '+233 25 444 7777',
          consigneeAddress: '654 Market Square, Kumasi, Ghana',
          goodsType: 'Retail Goods',
          status: 'Delivered',
          value: 25000,
          date: '2023-12-20'
        }
      ]
    }
  ];

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
