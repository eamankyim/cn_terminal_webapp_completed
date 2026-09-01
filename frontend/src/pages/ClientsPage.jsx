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
import { getCustomerStatusColor } from '../utils/statusUtils';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../utils/permissions';
import FileUpload from '../components/common/FileUpload';
import ResponsiveTable from '../components/common/ResponsiveTable';
import DocumentPreviewModal from '../components/common/DocumentPreviewModal';
import { fileService } from '../services/fileService';
import { applyCustomerConflictFields, customerConflictMessage } from '../utils/customerErrors';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ClientsPage = () => {
  const { hasPermission } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isConsignmentModalVisible, setIsConsignmentModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editingConsignment, setEditingConsignment] = useState(null);
  const [viewingConsignmentDocs, setViewingConsignmentDocs] = useState(null);
  const [consignmentDocuments, setConsignmentDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
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
  const clients = customers.filter((client) => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;
    return (
      client.name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.contactPerson?.toLowerCase().includes(query) ||
      client.address?.toLowerCase().includes(query)
    );
  });

  // Using centralized status color utilities

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

  // Consignee management functions
  const handleCreateConsignment = async (values) => {
    try {
      const { documents, ...consignmentData } = values;
      consignmentData.customerId = selectedClient.id;
      
      // Create or update consignment first
      let consignmentResponse;
      if (editingConsignment) {
        consignmentResponse = await updateConsignment(editingConsignment.id, consignmentData);
      } else {
        consignmentResponse = await addConsignment(consignmentData);
      }
      
      // Get the consignment ID
      const consignmentId = editingConsignment?.id || consignmentResponse?.consignment?.id || consignmentResponse?.id;
      
      // Handle document uploads if we have documents and a consignment ID
      if (documents && documents.length > 0 && consignmentId) {
        const filesToUpload = documents.filter(file => !file.url && file.originFileObj);
        
        if (filesToUpload.length > 0) {
          for (const file of filesToUpload) {
            try {
              await fileService.uploadFile(file.originFileObj, {
                folder: 'consignments',
                category: 'consignee_document',
                entityId: consignmentId,
                entityType: 'consignment'
              });
            } catch (uploadError) {
              console.error('Failed to upload file:', uploadError);
              message.warning(`Failed to upload ${file.name}`);
            }
          }
        }
      }
      
      message.success(editingConsignment ? 'Consignee updated successfully' : 'Consignee created successfully');
      setIsConsignmentModalVisible(false);
      setEditingConsignment(null);
      consignmentForm.resetFields();
      
      // Reload consignments for this customer
      loadConsignmentsByCustomer(selectedClient.id);
    } catch (error) {
      console.error('Error saving consignee:', error);
      message.error(editingConsignment ? 'Failed to update consignee' : 'Failed to create consignee');
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
      title: 'Delete Consignee',
      content: 'Are you sure you want to delete this consignee? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await removeConsignment(consignmentId);
          message.success('Consignee deleted successfully');
        } catch (error) {
          message.error('Failed to delete consignee');

        }
      }
    });
  };

  const handleViewConsignmentDocs = async (consignment) => {
    setViewingConsignmentDocs(consignment);
    setDocumentsLoading(true);
    setConsignmentDocuments([]);
    
    try {
      const documentsResponse = await fileService.getFilesByEntity('consignment', consignment.id);
      if (documentsResponse && documentsResponse.files) {
        setConsignmentDocuments(documentsResponse.files);
      } else {
        setConsignmentDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching consignee documents:', error);
      message.error('Failed to load consignee documents');
      setConsignmentDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    form.setFieldsValue({
      name: client.name,
      contactPerson: client.contactPerson || client.name,
      email: client.email || undefined,
      phone: client.phone,
      address: client.address,
      city: client.city,
      tin: client.tin || undefined,
      ghanaCard: client.ghanaCard || undefined,
      customerType: client.customerType,
    });
    setIsCreateModalVisible(true);
  };

  const handleDeleteClient = (client) => {
    const clientId = typeof client === 'string' ? client : client?.id;
    const clientName = typeof client === 'object' ? client?.name : '';
    Modal.confirm({
      title: 'Delete Client',
      content: clientName
        ? `Are you sure you want to delete ${clientName}? This action cannot be undone.`
        : 'Are you sure you want to delete this client? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteCustomer(clientId);
          message.success('Client deleted successfully');
          setIsModalVisible(false);
          setSelectedClient(null);
        } catch (error) {
          message.error(customerConflictMessage(error));
        }
      }
    });
  };

  const handleCreateClient = async (values) => {
    try {
      if (editingClient) {
        const updated = await updateCustomer(editingClient.id, values);
        if (selectedClient?.id === editingClient.id) {
          setSelectedClient(updated);
        }
        message.success('Client updated successfully');
      } else {
        await addCustomer(values);
        message.success('Client created successfully');
      }
      setIsCreateModalVisible(false);
      setEditingClient(null);
      form.resetFields();
    } catch (error) {
      applyCustomerConflictFields(form, error);
      message.error(customerConflictMessage(error));
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
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email || '—'}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div><MailOutlined /> {record.email || '—'}</div>
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
      title: 'Consignee',
      key: 'consignee',
      render: (_, record) => {
        const names = (record.consignments || [])
          .map((c) => c.consigneeName)
          .filter(Boolean);
        if (names.length === 0) {
          return <Text type="secondary">—</Text>;
        }
        const extra = names.length - 1;
        return (
          <div>
            <div>{names[0]}</div>
            {extra > 0 && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                +{extra} more
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getCustomerStatusColor(record.status)}>
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
          type="default" 
          icon={<EyeOutlined />} 
          onClick={(e) => {
            e.stopPropagation();
            handleViewClient(record);
          }}
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
        {hasPermission(PERMISSIONS.CUSTOMER_CREATE) && (
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
        )}
      </div>

      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Clients"
              value={searchText.trim() ? clients.length : customers.length}
              valueStyle={{ color: '#2FA2EE' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Clients"
              value={clients.filter(c => c.status === 'ACTIVE').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Company Clients"
              value={clients.filter(c => c.customerType === 'COMPANY').length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Individual Clients"
              value={clients.filter(c => c.customerType === 'INDIVIDUAL').length}
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
        </Row>
      </Card>

      {/* Clients Table */}
      <Card>
        <ResponsiveTable
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
          mobileConfig={{
            primaryFields: ['client', 'status'],
            secondaryFields: ['contact', 'consignee', 'customerType', 'location', 'createdAt']
          }}
          onRowClick={(record) => handleViewClient(record)}
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
                <Tag color={getCustomerStatusColor(selectedClient.status)} size="large">
                  {selectedClient.status === 'ACTIVE' ? '✓ Active' : '✗ Inactive'}
                </Tag>
               </div>
               {(hasPermission(PERMISSIONS.CUSTOMER_EDIT) || hasPermission(PERMISSIONS.CUSTOMER_DELETE)) && (
                 <Dropdown
                   menu={{
                     items: [
                       ...(hasPermission(PERMISSIONS.CUSTOMER_EDIT) ? [{
                         key: 'edit',
                         icon: <EditOutlined />,
                         label: 'Edit Client',
                         onClick: () => {
                           setIsModalVisible(false);
                           handleEditClient(selectedClient);
                         }
                       }] : []),
                       ...(hasPermission(PERMISSIONS.CUSTOMER_DELETE) ? [{
                         key: 'delete',
                         icon: <DeleteOutlined />,
                         label: 'Delete Client',
                         danger: true,
                         onClick: () => {
                           handleDeleteClient(selectedClient);
                         }
                       }] : [])
                     ]
                   }}
                   placement="bottomRight"
                 >
                   <Button type="text" icon={<MoreOutlined />} size="small" />
                 </Dropdown>
               )}
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
                           <div>{selectedClient.email || '—'}</div>
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
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Last Activity:</div>
                           <div>{selectedClient.lastActivity || 'N/A'}</div>
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
                           <div style={{ width: '140px', fontWeight: 'bold' }}>TIN:</div>
                           <div>{selectedClient.tin || 'N/A'}</div>
                         </div>
                         <div style={{ marginBottom: '16px', display: 'flex' }}>
                           <div style={{ width: '140px', fontWeight: 'bold' }}>Client Type:</div>
                           <div>
                             <Tag color={selectedClient.customerType === 'COMPANY' ? 'blue' : selectedClient.customerType === 'INDIVIDUAL' ? 'green' : 'default'}>
                               {selectedClient.customerType || 'N/A'}
                             </Tag>
                           </div>
                         </div>
                       </div>

                     </div>
                   )
                 },
                {
                  key: 'consignments',
                  label: 'Consignees',
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
                            Consignees
                          </Title>
                          {hasPermission(PERMISSIONS.CUSTOMER_EDIT) && (
                            <Button 
                              type="primary" 
                              icon={<PlusOutlined />}
                              onClick={() => {
                                setEditingConsignment(null);
                                consignmentForm.resetFields();
                                setIsConsignmentModalVisible(true);
                              }}
                            >
                              New Consignee
                            </Button>
                          )}
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
                                      icon={<EyeOutlined />}
                                      onClick={() => handleViewConsignmentDocs(consignment)}
                                    >
                                      View Files
                                    </Button>
                                    {hasPermission(PERMISSIONS.CUSTOMER_EDIT) && (
                                      <Button 
                                        size="small" 
                                        icon={<EditOutlined />}
                                        onClick={() => handleEditConsignment(consignment)}
                                      >
                                        Edit
                                      </Button>
                                    )}
                                    {hasPermission(PERMISSIONS.CUSTOMER_DELETE) && (
                                      <Button 
                                        size="small" 
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDeleteConsignment(consignment.id)}
                                      >
                                        Delete
                                      </Button>
                                    )}
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
                rules={[{ required: false, message: 'Please enter contact person' }]}
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
                  {
                    validator: (_, value) => {
                      if (!value || !String(value).trim()) return Promise.resolve();
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
                        return Promise.reject(new Error('Please enter valid email'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="Enter email address (optional)" />
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
                name="tin"
                label="TIN"
                rules={[{ required: false, message: 'Please enter TIN' }]}
              >
                <Input placeholder="Enter TIN" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ghanaCard"
                label="Ghana Card"
                rules={[{ required: false, message: 'Please enter Ghana Card number' }]}
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
                  <Option value="COMPANY">Company</Option>
                  <Option value="INDIVIDUAL">Individual</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: false, message: 'Please enter city' }]}
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

      {/* Create/Edit Consignee Modal */}
      <Modal
        title={editingConsignment ? 'Edit Consignee' : 'New Consignee'}
        open={isConsignmentModalVisible}
        onCancel={() => {
          setIsConsignmentModalVisible(false);
          setEditingConsignment(null);
          consignmentForm.resetFields();
        }}
        footer={null}
        width={700}
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
                rules={[{ required: false, message: 'Please enter Ghana Card number' }]}
              >
                <Input placeholder="GHA-XXXXXXXXX-X" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tin"
                label="TIN"
                rules={[{ required: false, message: 'Please enter TIN' }]}
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

          <Form.Item
            name="documents"
            label="Attachments"
            help="Upload Ghana Card, Business Certificate, and other documents"
          >
            <FileUpload
              multiple={true}
              maxCount={10}
              accept=".pdf,.jpg,.jpeg,.png"
              listType="text"
              uploadText="Upload Documents"
            />
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
                {editingConsignment ? 'Update Consignee' : 'Create Consignee'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Consignee Documents Modal */}
      <Modal
        title={`Documents - ${viewingConsignmentDocs?.consigneeName || 'Consignee'}`}
        open={!!viewingConsignmentDocs}
        onCancel={() => setViewingConsignmentDocs(null)}
        footer={[
          <Button key="close" onClick={() => setViewingConsignmentDocs(null)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {documentsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text>Loading documents...</Text>
          </div>
        ) : consignmentDocuments && consignmentDocuments.length > 0 ? (
          <div>
            <ResponsiveTable
              dataSource={consignmentDocuments}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'File Name',
                  dataIndex: 'originalName',
                  key: 'originalName',
                },
                {
                  title: 'Size',
                  dataIndex: 'size',
                  key: 'size',
                  render: (size) => {
                    const kb = size / 1024;
                    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
                  }
                },
                {
                  title: 'Uploaded',
                  dataIndex: 'uploadedAt',
                  key: 'uploadedAt',
                  render: (date) => new Date(date).toLocaleDateString()
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, file) => (
                    <Space>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setPreviewFile(file);
                          setPreviewVisible(true);
                        }}
                      >
                        View
                      </Button>
                      {hasPermission(PERMISSIONS.CUSTOMER_EDIT) && (
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={async () => {
                            try {
                              await fileService.deleteFile(file.id);
                              message.success('File deleted successfully');
                              handleViewConsignmentDocs(viewingConsignmentDocs);
                            } catch (error) {
                              message.error('Failed to delete file');
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </Space>
                  )
                }
              ]}
              mobileConfig={{
                primaryFields: ['originalName'],
                secondaryFields: ['size', 'uploadedAt']
              }}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <Text type="secondary">No documents attached to this consignee</Text>
          </div>
        )}
      </Modal>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        file={previewFile}
      />
    </div>
  );
};

export default ClientsPage;
