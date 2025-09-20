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
  Row, 
  Col,
  Statistic,
  Select,
  Form,
  message,
  Switch,
  Tabs,
  Avatar,
  Upload,
  InputNumber,
  Alert
} from 'antd';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { 
  SettingOutlined, 
  UserOutlined, 
  SecurityScanOutlined, 
  BellOutlined,
  GlobalOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SaveOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SettingsPage = () => {
  const { currentUser, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [accessForm] = Form.useForm();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Users data - loaded from API
  const [users, setUsers] = useState([]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'STAFF': return 'blue';
      case 'DRIVER': return 'green';
      case 'WAREHOUSE': return 'purple';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'STAFF': return 'Staff';
      case 'DRIVER': return 'Driver';
      case 'WAREHOUSE': return 'Warehouse';
      default: return role;
    }
  };

  const getStatusColor = (status) => {
    return status ? 'green' : 'red';
  };

  const handleCreateUser = async (values) => {
    setUsersLoading(true);
    try {
      const userData = {
        ...values,
        isActive: values.status
      };
      delete userData.status;

      if (editingUser) {
        await userService.updateUser(editingUser.id, userData);
        message.success('User updated successfully');
      } else {
        await userService.createUser(userData);
        message.success('User created successfully');
      }
      
      await loadUsers();
      setIsUserModalVisible(false);
      setEditingUser(null);
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to save user');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      status: user.isActive
    });
    setIsUserModalVisible(true);
  };

  const handleDeleteUser = (userId) => {
    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await userService.deleteUser(userId);
          message.success('User deleted successfully');
          await loadUsers();
        } catch (error) {
          message.error(error.response?.data?.error || 'Failed to delete user');
        }
      }
    });
  };

  const handleProfileUpdate = async (values) => {
    setProfileLoading(true);
    try {
      await updateProfile(values);
      message.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error) {
      message.error('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    setPasswordLoading(true);
    try {
      await userService.changePassword(values);
      message.success('Password updated successfully');
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    const userData = {
      firstName: currentUser?.name?.split(' ')[0] || '',
      lastName: currentUser?.name?.split(' ').slice(1).join(' ') || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
    };
    profileForm.setFieldsValue(userData);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    profileForm.resetFields();
  };

  // Load users from API
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await userService.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      message.error('Failed to load team members');
    } finally {
      setUsersLoading(false);
    }
  };

  // Load users when component mounts
  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
      loadUsers();
    }
  }, [currentUser]);

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar size="large" icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_, record) => (
        <Tag color={getRoleColor(record.role)}>
          {getRoleLabel(record.role)}
        </Tag>
      ),
    },
    {
      title: 'Department',
      key: 'department',
      render: (_, record) => {
        const departmentMap = {
          'ADMIN': 'Management',
          'STAFF': 'Client Engagement',
          'DRIVER': 'Operations',
          'WAREHOUSE': 'Warehouse'
        };
        return departmentMap[record.role] || 'General';
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.isActive)}>
          {record.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Joined Date',
      key: 'joinedDate',
      render: (_, record) => {
        return new Date(record.createdAt).toLocaleDateString();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditUser(record)}
            size="small"
          >
            Edit
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteUser(record.id)}
            size="small"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const profileTab = {
    key: 'profile',
    label: 'Profile Settings',
    children: (
      <div>
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card 
              title="Personal Information" 
              extra={
                <Space>
                  {!isEditingProfile ? (
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />}
                      onClick={handleEditProfile}
                    >
                      Edit Details
                    </Button>
                  ) : (
                    <Space>
                      <Button onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button 
                        type="primary" 
                        icon={<SaveOutlined />}
                        loading={profileLoading}
                        onClick={() => profileForm.submit()}
                      >
                        Save Changes
                      </Button>
                    </Space>
                  )}
                </Space>
              }
            >
              {!isEditingProfile ? (
                <div>
                  <Row gutter={16} style={{ marginBottom: '16px' }}>
                    <Col span={12}>
                      <Text strong>First Name:</Text>
                      <br />
                      <Text>{currentUser?.name?.split(' ')[0] || 'Not set'}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Last Name:</Text>
                      <br />
                      <Text>{currentUser?.name?.split(' ').slice(1).join(' ') || 'Not set'}</Text>
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginBottom: '16px' }}>
                    <Col span={24}>
                      <Text strong>Email:</Text>
                      <br />
                      <Text>{currentUser?.email || 'Not set'}</Text>
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginBottom: '16px' }}>
                    <Col span={24}>
                      <Text strong>Phone:</Text>
                      <br />
                      <Text>{currentUser?.phone || 'Not set'}</Text>
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginBottom: '16px' }}>
                    <Col span={24}>
                      <Text strong>Role:</Text>
                      <br />
                      <Tag color={getRoleColor(currentUser?.role)}>
                        {getRoleLabel(currentUser?.role)}
                      </Tag>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Text strong>Status:</Text>
                      <br />
                      <Tag color={getStatusColor(currentUser?.isActive)}>
                        {currentUser?.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Tag>
                    </Col>
                  </Row>
                </div>
              ) : (
                <Form 
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileUpdate}
                >
                <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item 
                        name="firstName"
                        label="First Name"
                        rules={[{ required: true, message: 'Please enter first name' }]}
                      >
                        <Input placeholder="Enter first name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                      <Form.Item 
                        name="lastName"
                        label="Last Name"
                        rules={[{ required: true, message: 'Please enter last name' }]}
                      >
                        <Input placeholder="Enter last name" />
                    </Form.Item>
                  </Col>
                </Row>
                  <Form.Item 
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Please enter email' },
                      { type: 'email', message: 'Please enter valid email' }
                    ]}
                  >
                    <Input placeholder="Enter email" />
                </Form.Item>
                  <Form.Item 
                    name="phone"
                    label="Phone"
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                  >
                    <Input placeholder="Enter phone number" />
                </Form.Item>
                <Form.Item label="Profile Picture">
                  <Upload>
                    <Button icon={<UploadOutlined />}>Upload Photo</Button>
                  </Upload>
                </Form.Item>
              </Form>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Change Password" extra={<SecurityScanOutlined />}>
              <Form 
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordChange}
              >
                <Form.Item 
                  name="currentPassword"
                  label="Current Password"
                  rules={[{ required: true, message: 'Please enter current password' }]}
                >
                  <Input.Password placeholder="Enter current password" />
                </Form.Item>
                <Form.Item 
                  name="newPassword"
                  label="New Password"
                  rules={[
                    { required: true, message: 'Please enter new password' },
                    { min: 8, message: 'Password must be at least 8 characters' }
                  ]}
                >
                  <Input.Password placeholder="Enter new password" />
                </Form.Item>
                <Form.Item 
                  name="confirmPassword"
                  label="Confirm New Password"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Please confirm new password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm new password" />
                </Form.Item>
                <Form.Item>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={passwordLoading}
                  >
                    Update Password
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    ),
  };

  const usersTab = {
    key: 'users',
    label: 'User Management',
    children: (
      <div>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4}>System Users</Title>
            <Text type="secondary">Manage user accounts, roles, and permissions</Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setIsUserModalVisible(true);
            }}
          >
            Add User
          </Button>
        </div>
        
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={users.length}
                valueStyle={{ color: '#2FA2EE' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Users"
                value={users.filter(u => u.isActive).length}
                valueStyle={{ color: '#52c41a' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Admin Users"
                value={users.filter(u => u.role === 'ADMIN').length}
                valueStyle={{ color: '#f5222d' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Staff Users"
                value={users.filter(u => u.role === 'STAFF').length}
                valueStyle={{ color: '#722ed1' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={userColumns}
          dataSource={users}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={usersLoading}
        />
      </div>
    ),
  };

  const preferencesTab = {
    key: 'preferences',
    label: 'System Preferences',
    children: (
      <div>
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="General Settings" extra={<SettingOutlined />}>
              <Form 
                form={preferencesForm}
                layout="vertical"
                onFinish={(values) => {
                  message.success('Preferences saved successfully');
                }}
              >
                <Form.Item name="companyName" label="Company Name">
                  <Input placeholder="Enter company name" />
                </Form.Item>
                <Form.Item name="currency" label="Default Currency">
                  <Select placeholder="Select currency">
                    <Option value="GHS">Ghana Cedi (GHS)</Option>
                    <Option value="USD">US Dollar (USD)</Option>
                    <Option value="EUR">Euro (EUR)</Option>
                    <Option value="GBP">British Pound (GBP)</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="timezone" label="Time Zone">
                  <Select placeholder="Select timezone">
                    <Option value="GMT+0">GMT+0 (Accra)</Option>
                    <Option value="GMT+1">GMT+1</Option>
                    <Option value="GMT-1">GMT-1</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="dateFormat" label="Date Format">
                  <Select placeholder="Select date format">
                    <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                    <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                    <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                    Save Preferences
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Notification Settings" extra={<BellOutlined />}>
              <Form 
                form={notificationForm}
                layout="vertical"
                onFinish={(values) => {
                  message.success('Notification settings saved successfully');
                }}
              >
                <Form.Item name="emailNotifications" label="Email Notifications" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="smsNotifications" label="SMS Notifications" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="pushNotifications" label="Push Notifications" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="jobStatusUpdates" label="Job Status Updates" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="paymentReminders" label="Payment Reminders" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="systemAlerts" label="System Alerts" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                    Save Notifications
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    ),
  };

  const securityTab = {
    key: 'security',
    label: 'Security Settings',
    children: (
      <div>
        <Alert
          message="Security Recommendations"
          description="Enable two-factor authentication and use strong passwords to enhance your account security."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
        
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="Authentication" extra={<SecurityScanOutlined />}>
              <Form 
                form={securityForm}
                layout="vertical"
                onFinish={(values) => {
                  message.success('Security settings saved successfully');
                }}
              >
                <Form.Item name="twoFactorAuth" label="Two-Factor Authentication" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="sessionTimeout" label="Session Timeout (minutes)">
                  <InputNumber min={15} max={480} placeholder="Enter timeout in minutes" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="maxLoginAttempts" label="Maximum Login Attempts">
                  <InputNumber min={3} max={10} placeholder="Enter max attempts" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="passwordExpiry" label="Password Expiry (days)">
                  <InputNumber min={30} max={365} placeholder="Enter expiry days" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                    Save Security Settings
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Access Control" extra={<GlobalOutlined />}>
              <Form 
                form={accessForm}
                layout="vertical"
                onFinish={(values) => {
                  message.success('Access control settings saved successfully');
                }}
              >
                <Form.Item name="ipWhitelist" label="IP Whitelist">
                  <TextArea 
                    placeholder="Enter allowed IP addresses (one per line)"
                    rows={4}
                  />
                </Form.Item>
                <Form.Item name="allowedCountries" label="Allowed Countries">
                  <Select mode="multiple" placeholder="Select allowed countries">
                    <Option value="GH">Ghana</Option>
                    <Option value="NG">Nigeria</Option>
                    <Option value="KE">Kenya</Option>
                    <Option value="ZA">South Africa</Option>
                    <Option value="US">United States</Option>
                    <Option value="GB">United Kingdom</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="auditLogging" label="Audit Logging" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                    Save Access Control
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    ),
  };

  // Build tabs array based on user role
  const getTabItems = () => {
    const baseItems = [profileTab, preferencesTab, securityTab];
    
    if (currentUser?.role === 'ADMIN') {
      return [profileTab, usersTab, preferencesTab, securityTab];
    }
    
    return baseItems;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Settings & Configuration
      </Title>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          activeKey={activeTab}
          items={getTabItems()}
          onChange={setActiveTab}
          size="large"
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={isUserModalVisible}
        onCancel={() => {
          setIsUserModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
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
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role">
                  <Option value="ADMIN">Administrator</Option>
                  <Option value="STAFF">Staff</Option>
                  <Option value="DRIVER">Driver</Option>
                  <Option value="WAREHOUSE">Warehouse</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  <Option value={true}>Active</Option>
                  <Option value={false}>Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 8, message: 'Password must be at least 8 characters' }
              ]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          )}

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsUserModalVisible(false);
                setEditingUser(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={usersLoading}>
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;