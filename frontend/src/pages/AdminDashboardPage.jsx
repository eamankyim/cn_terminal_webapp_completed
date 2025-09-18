import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Space, 
  Tag, 
  Typography,
  Row,
  Col,
  Tabs,
  Avatar,
  Drawer,
  Descriptions,
  Divider,
  InputNumber,
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  EditOutlined,
  EyeOutlined,
  SettingOutlined,
  TeamOutlined,
  MailOutlined as MailIcon
} from '@ant-design/icons';
import InviteManagement from '../components/admin/InviteManagement';
import userService from '../services/userService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm] = Form.useForm();

  // Function to generate initials from user name
  const getUserInitials = (name) => {
    if (!name) return 'U';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Real user data from API
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Load users from API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await userService.getUsers();
      console.log('Loaded users from API:', response.users);
      
      // Transform users to match the expected format
      const transformedUsers = response.users.map((user, index) => ({
        key: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        status: user.isActive ? 'active' : 'inactive',
        avatar: null,
        phone: 'N/A', // Phone not stored in current schema
        department: getDepartmentByRole(user.role),
        joinedDate: new Date(user.createdAt).toISOString().split('T')[0],
        lastLogin: 'N/A' // Last login not tracked in current schema
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const getDepartmentByRole = (role) => {
    switch (role) {
      case 'ADMIN': return 'Management';
      case 'STAFF': return 'Operations';
      case 'DRIVER': return 'Logistics';
      case 'WAREHOUSE': return 'Warehouse';
      default: return 'Operations';
    }
  };

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.avatar} 
            size="large"
            style={{
              backgroundColor: record.avatar ? undefined : '#1890ff',
              color: record.avatar ? undefined : '#fff',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {record.avatar ? undefined : getUserInitials(record.name)}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary">{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleColors = {
          admin: 'red',
          driver: 'blue',
          warehouse: 'green',

          finance: 'purple',
          'customer-service': 'cyan'
        };
        return <Tag color={roleColors[role] || 'default'}>{role.replace('-', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Joined Date',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewUser(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsDetailsDrawerVisible(true);
  };

  const handleInviteTeamMember = () => {
    // This will be handled by the InviteManagement component
    message.info('Use the Invite Management tab to send invitations');
  };

  const tabItems = [
    {
      key: 'profile',
      label: 'Profile',
      children: (
        <div>
          <Title level={4}>Personal Profile</Title>
          <Card>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Full Name" name="name">
                    <Input prefix={<UserOutlined />} placeholder="Your full name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Email" name="email">
                    <Input prefix={<MailOutlined />} placeholder="Your email" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Phone" name="phone">
                    <Input prefix={<PhoneOutlined />} placeholder="Your phone number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Department" name="department">
                    <Select placeholder="Select department">
                      <Option value="management">Management</Option>
                      <Option value="operations">Operations</Option>
                      <Option value="finance">Finance</Option>
                      <Option value="customer-service">Customer Service</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary">Update Profile</Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: 'organisation',
      label: 'Organisation',
      children: (
        <div>
          <Title level={4}>Organisation Settings</Title>
          <Card>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Company Name" name="companyName">
                    <Input placeholder="CN Terminal Ltd" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Business Registration" name="businessReg">
                    <Input placeholder="Company registration number" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="VAT Number" name="vatNumber">
                    <Input placeholder="VAT registration number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Industry" name="industry">
                    <Select placeholder="Select industry">
                      <Option value="clearing">Clearing & Forwarding</Option>
                      <Option value="logistics">Logistics & Transportation</Option>
                      <Option value="customs">Customs Brokerage</Option>
                      <Option value="freight">Freight Forwarding</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Company Address" name="address">
                    <TextArea rows={3} placeholder="Enter company address" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary">Save Organisation Settings</Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: 'invites',
      label: 'Invites',
      children: <InviteManagement />,
    },
    {
      key: 'clearing-settings',
      label: 'Clearing Settings',
      children: (
        <div>
          <Title level={4}>Clearing Agent Configuration</Title>
          <Card>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Default Service Fee (%)" name="serviceFee">
                    <InputNumber 
                      min={0} 
                      max={100} 
                      placeholder="5.0" 
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Processing Fee (GHS)" name="processingFee">
                    <InputNumber 
                      min={0} 
                      placeholder="100" 
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="ETA API Key" name="etaApiKey">
                    <Input.Password placeholder="Enter ETA API key" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Payment Gateway" name="paymentGateway">
                    <Select placeholder="Select payment gateway">
                      <Option value="paystack">Paystack</Option>
                      <Option value="flutterwave">Flutterwave</Option>
                      <Option value="hubtel">Hubtel</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Supported Ports" name="supportedPorts">
                    <Select mode="multiple" placeholder="Select supported ports">
                      <Option value="tema">Tema Port</Option>
                      <Option value="kotoka">Kotoka Airport</Option>
                      <Option value="takoradi">Takoradi Port</Option>
                      <Option value="kumasi">Kumasi Airport</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary">Save Clearing Settings</Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: 'team-members',
      label: 'Team Members',
      children: (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleInviteTeamMember}
            >
              Invite Team Member
            </Button>
          </div>
          <Table
            columns={userColumns}
            dataSource={users}
            pagination={false}
            size="small"
            loading={usersLoading}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Admin & Settings
      </Title>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          defaultActiveKey="profile"
          items={tabItems}
          onChange={setActiveTab}
        />
      </Card>

      {/* User Details Side Drawer */}
      <Drawer
        title="User Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={600}
      >
        {selectedUser && (
          <div>
            {/* User Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar 
                    src={selectedUser.avatar} 
                    size={64}
                    style={{
                      backgroundColor: selectedUser.avatar ? undefined : '#1890ff',
                      color: selectedUser.avatar ? undefined : '#fff',
                      fontWeight: 'bold',
                      fontSize: '24px'
                    }}
                  >
                    {selectedUser.avatar ? undefined : getUserInitials(selectedUser.name)}
                  </Avatar>
                  <Title level={4} style={{ margin: '8px 0 0' }}>
                    {selectedUser.name}
                  </Title>
                  <Text type="secondary">{selectedUser.role}</Text>
                </div>
              </Col>
              <Col span={16}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Status</Text>
                  <br />
                  <Tag color="success" style={{ fontSize: '16px' }}>
                    {selectedUser.status.toUpperCase()}
                  </Tag>
                </div>
              </Col>
            </Row>
            <Divider />

            {/* User Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="User Information">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Email">
                      <Space>
                        <MailOutlined />
                        {selectedUser.email}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      <Space>
                        <PhoneOutlined />
                        {selectedUser.phone}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Department">
                      {selectedUser.department}
                    </Descriptions.Item>
                    <Descriptions.Item label="Role">
                      <Tag color="blue">{selectedUser.role.replace('-', ' ').toUpperCase()}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Joined Date">
                      {selectedUser.joinedDate}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Login">
                      {selectedUser.lastLogin}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminDashboardPage;
