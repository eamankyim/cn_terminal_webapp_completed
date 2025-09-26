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
  Alert,
  Drawer,
  Descriptions
} from 'antd';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { getCustomerStatusColor } from '../utils/statusUtils';
import { ROLE_INFO, PERMISSIONS } from '../utils/permissions';
import RolePermissionManager from '../components/settings/RolePermissionManager';
import UserRoleAssignment from '../components/settings/UserRoleAssignment';
import PermissionGate from '../components/common/PermissionGate';
import InviteManagement from '../components/admin/InviteManagement';
import { 
  SettingOutlined, 
  UserOutlined, 
  SecurityScanOutlined, 
  BellOutlined,
  GlobalOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SaveOutlined,
  EyeOutlined,
  TeamOutlined,
  MailOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SettingsPage = () => {
  const { currentUser, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
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

  // Using centralized role utilities
  const getRoleColor = (role) => ROLE_INFO[role]?.color || 'default';
  const getRoleLabel = (role) => ROLE_INFO[role]?.name || role;

  // Using centralized status color utilities

  const handleUpdateUser = async (values) => {
    setUsersLoading(true);
    try {
      const userData = {
        ...values,
        isActive: values.status
      };
      delete userData.status;

      await userService.updateUser(editingUser.id, userData);
      message.success('User updated successfully');
      
      await loadUsers();
      setIsUserModalVisible(false);
      setEditingUser(null);
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to update user');
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
        <Tag color={record.isActive ? 'green' : 'red'}>
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
                      <Tag color={currentUser?.isActive ? 'green' : 'red'}>
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


  const rolesTab = {
    key: 'roles',
    label: 'Roles & Permissions',
    children: (
      <div>
        {/* Permissions Overview */}
        <Card title="Available Permissions" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text type="secondary">
              This system has {Object.keys(PERMISSIONS).length} available permissions across different modules.
            </Text>
          </div>
          <Row gutter={[16, 16]}>
            {Object.entries(
              Object.entries(PERMISSIONS).reduce((acc, [key, permission]) => {
                const category = permission.split(':')[0];
                if (!acc[category]) acc[category] = [];
                acc[category].push({ key, permission });
                return acc;
              }, {})
            ).map(([category, permissions]) => (
              <Col xs={24} sm={12} lg={8} key={category}>
                <Card size="small" title={category.charAt(0).toUpperCase() + category.slice(1)}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {permissions.map(({ key, permission }) => (
                      <Tag key={key} color="blue" style={{ marginBottom: '4px' }}>
                        {permission}
                      </Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* System Roles & Custom Role Management */}
        <PermissionGate
          userRole={currentUser?.role}
          permissions={PERMISSIONS.USER_MANAGE_ROLES}
          fallback={
            <Alert
              message="Access Denied"
              description="You do not have permission to manage roles and permissions."
              type="warning"
              showIcon
            />
          }
          showFallback={true}
        >
          <RolePermissionManager
            currentUserRole={currentUser?.role}
            onRoleUpdate={() => {
              // Refresh data if needed
              console.log('Role updated');
            }}
          />
        </PermissionGate>
      </div>
    ),
  };


  const invitesTab = {
    key: 'invites',
    label: 'Invite Users',
    children: (
      <PermissionGate
        userRole={currentUser?.role}
        permissions={PERMISSIONS.USER_CREATE}
        fallback={
          <Alert
            message="Access Denied"
            description="You do not have permission to manage invitations."
            type="warning"
            showIcon
          />
        }
        showFallback={true}
      >
        <InviteManagement />
      </PermissionGate>
    ),
  };

  const teamMembersTab = {
    key: 'team-members',
    label: 'Team Members',
    children: (
      <PermissionGate
        userRole={currentUser?.role}
        permissions={PERMISSIONS.USER_VIEW}
        fallback={
          <Alert
            message="Access Denied"
            description="You do not have permission to view team members."
            type="warning"
            showIcon
          />
        }
        showFallback={true}
      >
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>Team Members</Title>
            <Alert
              message="Note"
              description="To add new team members, use the 'Invite Users' tab to send invitations."
              type="info"
              showIcon
              style={{ maxWidth: '400px' }}
            />
        </div>

        <Table
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: (name, record) => (
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <div>
                      <Text strong>{name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.email}
                      </Text>
                    </div>
                  </Space>
                ),
              },
              {
                title: 'Role',
                dataIndex: 'role',
                key: 'role',
                render: (role) => (
                  <Tag color={getRoleColor(role)}>
                    {getRoleLabel(role)}
                  </Tag>
                ),
              },
              {
                title: 'Department',
                dataIndex: 'department',
                key: 'department',
                render: (department) => {
                  const departmentMap = {
                    'ADMIN': 'Management',
                    'STAFF': 'Client Engagement',
                    'DRIVER': 'Logistics',
                    'WAREHOUSE': 'Operations'
                  };
                  return departmentMap[department] || 'General';
                }
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, record) => (
                  <Tag color={record.isActive ? 'green' : 'red'}>
                    {record.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Tag>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSelectedUser(record);
                        setIsDetailsDrawerVisible(true);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingUser(record);
                        setIsUserModalVisible(true);
                      }}
                    >
                      Edit
                    </Button>
                  </Space>
                ),
              },
            ]}
          dataSource={users}
          pagination={{ pageSize: 10 }}
          loading={usersLoading}
        />
      </div>
      </PermissionGate>
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

  // WhatsApp Web Tab
  const whatsappTab = {
    key: 'whatsapp',
    label: (
      <Space>
        <WhatsAppOutlined style={{ color: '#25D366' }} />
        WhatsApp Web
      </Space>
    ),
    children: (
      <div>
        <Alert
          message="WhatsApp Web Integration"
          description="Open WhatsApp Web in a popup window to communicate with customers directly."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
        
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="Quick Access" extra={<MailOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<WhatsAppOutlined />}
                  style={{ 
                    backgroundColor: '#25D366', 
                    borderColor: '#25D366',
                    width: '100%',
                    height: '50px',
                    fontSize: '16px'
                  }}
                  onClick={() => {
                    const popup = window.open(
                      'https://web.whatsapp.com',
                      'WhatsAppWeb',
                      'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
                    );
                    if (popup) {
                      popup.focus();
                      message.success('WhatsApp Web opened in popup window');
                    } else {
                      message.error('Popup blocked. Please allow popups for this site.');
                    }
                  }}
                >
                  Open WhatsApp Web
                </Button>
                
                <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                  Click to open WhatsApp Web in a popup window
                </Text>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Instructions" extra={<SettingOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>1. Click "Open WhatsApp Web"</Text>
                  <br />
                  <Text type="secondary">A popup window will open with WhatsApp Web</Text>
                </div>
                
                <div>
                  <Text strong>2. Scan QR Code</Text>
                  <br />
                  <Text type="secondary">Use your phone to scan the QR code in the popup</Text>
                </div>
                
                <div>
                  <Text strong>3. Start Messaging</Text>
                  <br />
                  <Text type="secondary">Send messages to customers directly from your terminal system</Text>
                </div>
                
                <Alert
                  message="Note"
                  description="Make sure to allow popups for this site if the popup doesn't open automatically."
                  type="warning"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    ),
  };

  // Build tabs array based on user role
  const getTabItems = () => {
    // Core tabs that everyone needs
    const coreTabs = [profileTab, preferencesTab, securityTab, whatsappTab];
    
    // Permission management tabs
    const permissionTabs = [
      rolesTab,        // System roles + custom roles + permissions
      invitesTab,      // Invite users and assign roles
      teamMembersTab   // View onboarded users
    ];
    
    if (currentUser?.role === 'ADMIN') {
      return [...coreTabs, ...permissionTabs];
    }
    
    // Show permission tabs to all users, but content will be permission-gated
    return [...coreTabs, ...permissionTabs];
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

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
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
          onFinish={handleUpdateUser}
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
                  {Object.entries(ROLE_INFO).map(([role, info]) => (
                    <Option key={role} value={role}>
                      <Space>
                        <span>{info.icon}</span>
                        <span>{info.name}</span>
                      </Space>
                    </Option>
                  ))}
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
                Update User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
