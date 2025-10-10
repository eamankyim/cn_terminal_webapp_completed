import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Tag, 
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Descriptions,
  Divider,
  Avatar,
  message,
  Drawer
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../contexts/CustomerContext';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../utils/permissions';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CustomersPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { customers: contextCustomers, addCustomer, updateCustomer } = useCustomers();

  // Transform context customers to match the table structure
  const customers = contextCustomers.map((customer, index) => ({
    key: customer.id,
    customerId: `CUST${String(index + 1).padStart(3, '0')}`,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.address.split(',').slice(-2, -1)[0]?.trim() || 'Unknown',
    country: customer.address.split(',').slice(-1)[0]?.trim() || 'Unknown',
    status: 'Active',
    totalJobs: Math.floor(Math.random() * 20) + 1,
    totalSpent: Math.floor(Math.random() * 3000) + 100,
    lastJob: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customerType: customer.customerType,
  }));

  // Customer statistics
  const stats = [
    { title: 'Total Customers', value: 1247, color: '#1890ff' },
    { title: 'Active Customers', value: 1189, color: '#52c41a' },
    { title: 'Premium Customers', value: 156, color: '#faad14' },
    { title: 'New This Month', value: 23, color: '#f5222d' },
  ];

  const columns = [
    {
      title: 'Customer ID',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div><Text strong>{record.name}</Text></div>
            <div><Text type="secondary">{record.email}</Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'success' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Customer Type',
      dataIndex: 'customerType',
      key: 'customerType',
      render: (type) => (
        <Tag color={type === 'Premium' ? 'gold' : 'default'}>
          {type}
        </Tag>
      ),
    },
         {
       title: 'Total Jobs',
       dataIndex: 'totalJobs',
       key: 'totalJobs',
       render: (value) => <Text strong>{value}</Text>,
     },
         {
       title: 'Actions',
       key: 'actions',
       render: (_, record) => (
         <Button 
           type="default"
           size="small"
           icon={<EyeOutlined />}
           onClick={() => handleViewCustomer(record)}
         >
           View
         </Button>
       ),
     },
  ];

  const handleNewCustomer = () => {

    setIsModalVisible(true);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {

      const values = await form.validateFields();

      await addCustomer(values);

      message.success('Customer created successfully!');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {

      message.error(error.message || 'Failed to create customer');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalVisible(true);
  };

  const handleEditCustomer = (customer) => {
    form.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      customerType: customer.customerType,
    });
    setIsModalVisible(true);
  };

  const handleDeleteCustomer = (customer) => {
    message.info(`Delete customer: ${customer.name}`);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Customers Management</Title>
        <Text type="secondary">Manage all customer information and details</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Actions Bar */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Input
                placeholder="Search customers..."
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
              />
              <Button icon={<FilterOutlined />}>
                Filters
              </Button>
            </Space>
          </Col>
          <Col>
            {hasPermission(PERMISSIONS.CUSTOMER_CREATE) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleNewCustomer}
              >
                New Customer
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Customers Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={customers}
          pagination={{
            total: customers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} customers`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* New Customer Modal */}
      <Modal
        title="Add New Customer"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText="Create Customer"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            customerType: 'Regular',
            country: 'United Kingdom',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter customer name!' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter email address!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number!' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerType"
                label="Customer Type"
                rules={[{ required: true, message: 'Please select customer type!' }]}
              >
                <Select>
                  <Option value="Regular">Regular</Option>
                  <Option value="Premium">Premium</Option>
                  <Option value="VIP">VIP</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address!' }]}
          >
            <TextArea rows={3} placeholder="Enter full address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city!' }]}
              >
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: 'Please select country!' }]}
              >
                <Select>
                  <Option value="United Kingdom">United Kingdom</Option>
                  <Option value="Ghana">Ghana</Option>
                  <Option value="Nigeria">Nigeria</Option>
                  <Option value="Kenya">Kenya</Option>
                  <Option value="South Africa">South Africa</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <TextArea rows={3} placeholder="Any additional notes about the customer" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Customer Details Side Drawer */}
      <Drawer
        title="Customer Details"
        placement="right"
        onClose={() => setIsDetailsModalVisible(false)}
        open={isDetailsModalVisible}
        width={600}
               extra={[
         <Button 
           key="edit" 
           type="primary"
           icon={<EditOutlined />}
           onClick={() => {
             setIsDetailsModalVisible(false);
             handleEditCustomer(selectedCustomer);
           }}
         >
           Edit
         </Button>,
       ]}
      >
        {selectedCustomer && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar size={80} icon={<UserOutlined />} />
                  <div style={{ marginTop: 8 }}>
                    <Text strong>{selectedCustomer.name}</Text>
                  </div>
                  <div>
                    <Tag color={selectedCustomer.status === 'Active' ? 'success' : 'default'}>
                      {selectedCustomer.status}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Statistic title="Total Jobs" value={selectedCustomer.totalJobs} />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Total Spent" 
                  value={`£${selectedCustomer.totalSpent.toLocaleString()}`} 
                />
              </Col>
            </Row>

            <Divider />

            <Descriptions title="Contact Information" column={1}>
              <Descriptions.Item label="Email">
                <Space>
                  <MailOutlined />
                  {selectedCustomer.email}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <Space>
                  <PhoneOutlined />
                  {selectedCustomer.phone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                <Space>
                  <EnvironmentOutlined />
                  {selectedCustomer.address}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Account Information" column={1}>
              <Descriptions.Item label="Customer ID">
                {selectedCustomer.customerId}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Type">
                <Tag color={selectedCustomer.customerType === 'Premium' ? 'gold' : 'default'}>
                  {selectedCustomer.customerType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Registration Date">
                {selectedCustomer.registrationDate}
              </Descriptions.Item>
              <Descriptions.Item label="Last Job">
                {selectedCustomer.lastJob}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomersPage;
