import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { UI_PERMISSIONS } from '../utils/uiPermissions';
import { fileService } from '../services/fileService';
import RolePermissionManager from '../components/settings/RolePermissionManager';
import IntegrationTest from '../components/IntegrationTest';
import UserRoleAssignment from '../components/settings/UserRoleAssignment';
import InviteManagement from '../components/admin/InviteManagement';
import ResponsiveTable from '../components/common/ResponsiveTable';
import useResponsive from '../hooks/useResponsive';
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
  // WhatsAppOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SettingsPage = () => {
  const { currentUser, updateProfile, refreshUserPermissions } = useAuth();
  const { isMobile } = useResponsive();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [profilePictureFileList, setProfilePictureFileList] = useState([]);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Handle URL parameter for tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Note: Permission refresh is now manual via the "Refresh Permissions" button
  // to avoid causing re-render issues when switching tabs
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Users data - loaded from API
  const [users, setUsers] = useState([]);

  // Using centralized role utilities
  const getRoleColor = (role) => ROLE_INFO[role]?.color || 'default';
  const getRoleLabel = (role) => ROLE_INFO[role]?.name || role;

  // Using centralized status color utilities

  const handleUpdateUser = async (values) => {
    console.log('🔷 [SettingsPage] handleUpdateUser called');
    console.log('  - Editing User:', editingUser);
    console.log('  - Form Values:', values);
    console.log('  - Password in values:', values.password ? 'YES (***' + values.password.slice(-4) + ')' : 'NO');
    
    setUsersLoading(true);
    try {
      const userData = {
        ...values,
        isActive: values.status
      };
      delete userData.status;

      console.log('  - Final userData to send:', { ...userData, password: userData.password ? '***PROVIDED***' : 'NOT PROVIDED' });

      await userService.updateUser(editingUser.id, userData);
      console.log('✅ [SettingsPage] User updated successfully');
      message.success('User updated successfully');
      
      await loadUsers();
      setIsUserModalVisible(false);
      setEditingUser(null);
      form.resetFields();
    } catch (error) {
      console.error('❌ [SettingsPage] handleUpdateUser error:', error);
      console.error('  - Error response:', error.response?.data);
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
      // Prepare profile data
      const profileData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone
      };

      // Handle profile picture upload if any
      if (profilePictureFileList.length > 0 && profilePictureFileList[0].originFileObj) {
        try {
          setUploadingPicture(true);
          const file = profilePictureFileList[0].originFileObj;
          const uploadResponse = await fileService.uploadFile(file, {
            folder: 'profiles',
            category: 'profile_picture'
          });
          
          if (uploadResponse?.file?.url) {
            profileData.profilePicture = uploadResponse.file.url;
            message.success('Profile picture uploaded successfully');
          }
        } catch (uploadError) {
          console.error('Profile picture upload error:', uploadError);
          message.error('Failed to upload profile picture. Please try again.');
          setProfileLoading(false);
          setUploadingPicture(false);
          return;
        } finally {
          setUploadingPicture(false);
        }
      }

      await updateProfile(profileData);
      message.success('Profile updated successfully');
      setIsEditingProfile(false);
      setProfilePictureFileList([]);
    } catch (error) {
      console.error('Profile update error:', error);
      message.error(error.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    console.log('🔷 [SettingsPage] handlePasswordChange called');
    console.log('  - Form Values:', { 
      currentPassword: values.currentPassword ? '***' + values.currentPassword.slice(-4) : 'NONE',
      newPassword: values.newPassword ? '***' + values.newPassword.slice(-4) : 'NONE',
      confirmPassword: values.confirmPassword ? '***' + values.confirmPassword.slice(-4) : 'NONE'
    });
    
    setPasswordLoading(true);
    try {
      await userService.changePassword(values);
      console.log('✅ [SettingsPage] Password changed successfully');
      message.success('Password updated successfully');
      passwordForm.resetFields();
    } catch (error) {
      console.error('❌ [SettingsPage] handlePasswordChange error:', error);
      console.error('  - Error response:', error.response?.data);
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
    console.log('\n🔷 [SettingsPage] loadUsers called');
    console.log('  - Timestamp:', new Date().toISOString());
    console.log('  - Current user:', currentUser?.email);
    console.log('  - Current user role:', currentUser?.role);
    console.log('  - usersLoading state:', usersLoading);
    console.log('  - Current users count:', users.length);
    
    // Prevent multiple simultaneous calls
    if (usersLoading) {
      console.log('⏭️ [SettingsPage] loadUsers already in progress, skipping...');
      return;
    }
    
    try {
      console.log('  - Setting usersLoading to true');
      setUsersLoading(true);
      
      console.log('  - Checking userService availability...');
      if (!userService) {
        console.error('❌ [SettingsPage] userService is not available');
        throw new Error('User service not initialized');
      }
      
      console.log('  - Calling userService.getUsers()...');
      const startTime = Date.now();
      const response = await userService.getUsers();
      const requestTime = Date.now() - startTime;
      
      console.log('  - Request completed in', requestTime, 'ms');
      console.log('  - Response received:', {
        type: typeof response,
        hasUsers: !!response?.users,
        usersIsArray: Array.isArray(response?.users),
        usersCount: response?.users?.length || 0
      });
      
      if (!response) {
        console.error('❌ [SettingsPage] Response is null or undefined');
        throw new Error('No response from server');
      }
      
      if (!response.users) {
        console.error('❌ [SettingsPage] Response missing users property');
        console.error('  - Response structure:', Object.keys(response));
        throw new Error('Response missing users property');
      }
      
      if (!Array.isArray(response.users)) {
        console.error('❌ [SettingsPage] Response.users is not an array');
        console.error('  - Users type:', typeof response.users);
        throw new Error('Users property is not an array');
      }
      
      console.log('  - Setting users state with', response.users.length, 'users');
      setUsers(response.users);
      console.log('✅ [SettingsPage] loadUsers completed successfully');
      console.log('  - Users state updated, count:', response.users.length);
    } catch (error) {
      console.error('\n❌ [SettingsPage] loadUsers ERROR:');
      console.error('  - Error name:', error.name);
      console.error('  - Error message:', error.message);
      console.error('  - Error status:', error.status);
      console.error('  - Error response:', error.response?.data);
      console.error('  - Current user:', currentUser?.email);
      console.error('  - Current user role:', currentUser?.role);
      console.error('  - Error stack:', error.stack);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to load team members';
      message.error(`Failed to load team members: ${errorMessage}`);
    } finally {
      console.log('  - Setting usersLoading to false');
      setUsersLoading(false);
      console.log('  - loadUsers cleanup completed\n');
    }
  };

  // Load users when component mounts (for all roles with team members access)
  useEffect(() => {
    console.log('\n🔷 [SettingsPage] useEffect triggered for loadUsers');
    console.log('  - currentUser:', currentUser ? {
      email: currentUser.email,
      role: currentUser.role,
      id: currentUser.id
    } : 'null/undefined');
    console.log('  - currentUser?.role:', currentUser?.role);
    
    // All users can view team members (but only admins can edit)
    if (currentUser?.role) {
      console.log('  - User has role, calling loadUsers()');
      loadUsers();
    } else {
      console.warn('⚠️ [SettingsPage] currentUser or role is missing, skipping loadUsers');
      console.warn('  - currentUser exists:', !!currentUser);
      console.warn('  - currentUser.role exists:', !!currentUser?.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]); // Only depend on role, not entire user object

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
    permission: UI_PERMISSIONS.PROFILE_SETTINGS,
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
                  <Upload
                    fileList={profilePictureFileList}
                    onChange={({ fileList }) => setProfilePictureFileList(fileList)}
                    beforeUpload={(file) => {
                      const isImage = file.type.startsWith('image/');
                      if (!isImage) {
                        message.error('You can only upload image files!');
                        return false;
                      }
                      const isLt2M = file.size / 1024 / 1024 < 2;
                      if (!isLt2M) {
                        message.error('Image must be smaller than 2MB!');
                        return false;
                      }
                      return false; // Prevent auto upload
                    }}
                    listType="picture-card"
                    maxCount={1}
                    onRemove={() => {
                      setProfilePictureFileList([]);
                      return true;
                    }}
                  >
                    {profilePictureFileList.length < 1 && (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    )}
                  </Upload>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 8 }}>
                    Supported formats: JPG, PNG (Max 2MB)
                  </Text>
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
    permission: UI_PERMISSIONS.MANAGE_ROLES,
    children: (
      <div>
        {/* Permissions Overview */}
        <Card title="Available UI Permissions" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text type="secondary">
              This system has {Object.keys(UI_PERMISSIONS).length} UI-based permissions organized by functionality.
            </Text>
          </div>
          <Row gutter={[16, 16]}>
            {Object.entries({
              'Sidebar Navigation': {
                'ui:dashboard': 'Dashboard',
                'ui:jobs': 'Jobs',
                'ui:clients': 'Clients',
                'ui:invoices': 'Invoices',
                'ui:accounting': 'Accounting',
                'ui:requests': 'Requests',
                'ui:reports': 'Reports',
                'ui:settings': 'Settings',
                'ui:configuration': 'Configuration'
              },
              'Settings Tabs': {
                'ui:profile_settings': 'Profile Settings',
                'ui:roles_permissions': 'Roles & Permissions',
                'ui:invite_users': 'Invite Users',
                'ui:team_members': 'Team Members',
                'ui:system_preferences': 'System Preferences',
                'ui:security_settings': 'Security Settings',
                // 'ui:whatsapp_web': 'WhatsApp Web',
                'ui:api_integration_test': 'API Integration Test'
              },
              'Job Management': {
                'ui:create_job': 'Create Job',
                'ui:edit_job': 'Edit Job',
                'ui:delete_job': 'Delete Job',
                'ui:assign_job': 'Assign Job',
                'ui:update_job_status': 'Update Job Status',
                'ui:view_all_jobs': 'View All Jobs'
              },
              'Customer Management': {
                'ui:create_customer': 'Create Customer',
                'ui:edit_customer': 'Edit Customer',
                'ui:delete_customer': 'Delete Customer',
                'ui:view_all_customers': 'View All Customers'
              },
              'Invoice Management': {
                'ui:create_invoice': 'Create Invoice',
                'ui:edit_invoice': 'Edit Invoice',
                'ui:delete_invoice': 'Delete Invoice',
                'ui:approve_invoice': 'Approve Invoice',
                'ui:view_all_invoices': 'View All Invoices'
              },
              'Accounting & Finance': {
                'ui:create_expense': 'Create Expense',
                'ui:approve_expense': 'Approve Expense',
                'ui:edit_expense': 'Edit Expense',
                'ui:delete_expense': 'Delete Expense',
                'ui:create_payout': 'Create Payout',
                'ui:edit_payout': 'Edit Payout',
                'ui:delete_payout': 'Delete Payout',
                'ui:view_cashflow': 'View Cashflow',
                'ui:create_cashflow': 'Create Cashflow'
              },
              'Reports & Analytics': {
                'ui:view_reports': 'View Reports',
                'ui:export_reports': 'Export Reports',
                'ui:view_analytics': 'View Analytics'
              },
              'User Management': {
                'ui:create_user': 'Create User',
                'ui:edit_user': 'Edit User',
                'ui:delete_user': 'Delete User',
                'ui:manage_roles': 'Manage Roles',
                'ui:invite_user': 'Invite User'
              },
              'File & Notifications': {
                'ui:upload_file': 'Upload File',
                'ui:download_file': 'Download File',
                'ui:delete_file': 'Delete File',
                'ui:send_notification': 'Send Notification',
                'ui:view_notifications': 'View Notifications'
              },
              'System Configuration': {
                'ui:edit_system_settings': 'Edit System Settings',
                'ui:configure_system': 'Configure System'
              }
            }).map(([category, permissions]) => (
              <Col xs={24} sm={12} lg={8} key={category}>
                <Card size="small" title={category} style={{ height: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {Object.entries(permissions).map(([permission, label]) => (
                      <Tag key={permission} color="blue" style={{ marginBottom: '4px', display: 'block' }}>
                        <Text style={{ fontSize: '12px' }}>
                          <strong>{permission}</strong><br/>
                          <Text type="secondary">{label}</Text>
                        </Text>
                      </Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* System Roles & Custom Role Management */}
        <RolePermissionManager
          currentUserRole={currentUser?.role}
          onRoleUpdate={() => {
            // Refresh data if needed

          }}
        />
      </div>
    ),
  };

  const invitesTab = {
    key: 'invites',
    label: 'Invite Users',
    permission: UI_PERMISSIONS.INVITE_USER,
    children: (
      <InviteManagement />
    ),
  };

  const teamMembersTab = {
    key: 'team-members',
    label: 'Team Members',
    permission: UI_PERMISSIONS.TEAM_MEMBERS,
    children: (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Title level={4}>Team Members</Title>
        </div>

        <ResponsiveTable
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
                    <Button
                    type="default"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSelectedUser(record);
                        setIsDetailsDrawerVisible(true);
                      }}
                    >
                      View
                    </Button>
                ),
              },
            ]}
          dataSource={users}
          pagination={{ pageSize: 10 }}
          loading={usersLoading}
          mobileConfig={{
            primaryFields: ['name', 'role', 'status'],
            secondaryFields: ['department']
          }}
          onRowClick={(record) => {
            setSelectedUser(record);
            setIsDetailsDrawerVisible(true);
          }}
        />
      </div>
    ),
  };

  const preferencesTab = {
    key: 'preferences',
    label: 'System Preferences',
    permission: 'ADMIN_OR_IT_ONLY', // Special permission for admin/IT only
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
    permission: 'ADMIN_OR_IT_ONLY', // Special permission for admin/IT only
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

  // WhatsApp Web Tab - COMMENTED OUT
  /*
  const whatsappTab = {
    key: 'whatsapp',
    label: (
      <Space>
        <WhatsAppOutlined style={{ color: '#25D366' }} />
        WhatsApp Web
      </Space>
    ),
    permission: 'ADMIN_OR_IT_ONLY', // Special permission for admin/IT only
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

  */

  // API Integration Test Tab
  const apiTestTab = {
    key: 'api-test',
    label: (
      <Space>
        <SettingOutlined />
        API Integration Test
      </Space>
    ),
    permission: 'ADMIN_OR_IT_ONLY', // Special permission for admin/IT only
    children: (
      <div>
        <IntegrationTest />
      </div>
    ),
  };

  // Build tabs array based on user permissions
  const getTabItems = () => {
    const allTabs = [profileTab, preferencesTab, securityTab, /* whatsappTab, */ apiTestTab, rolesTab, invitesTab, teamMembersTab];
    
    // Filter tabs based on user permissions
    const filteredTabs = allTabs.filter(tab => {
      // On mobile, only show profile tab
      if (isMobile && tab.key !== 'profile') {
        return false;
      }
      
      if (!tab.permission) return true; // Show tabs without permission requirements
      
      // Special case: ADMIN_OR_IT_ONLY tabs
      if (tab.permission === 'ADMIN_OR_IT_ONLY') {
        return currentUser?.role === 'ADMIN' || currentUser?.role === 'IT_CONSULTANT';
      }
      
      // For ADMIN and IT_CONSULTANT, always show all tabs (they have full access)
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'IT_CONSULTANT') {
        return true;
      }
      
      // For employee roles, only show Profile and Team Members tabs
      const employeeRoles = ['STAFF', 'DRIVER', 'WAREHOUSE', 'ENQUIRY_OFFICER', 'ENTRY_OFFICER', 'RELEASE_OFFICER', 'PREINVOICE_OFFICER', 'INVOICE_OFFICER', 'REVIEW_OFFICER', 'VETTING_OFFICER', 'CLEARING_OFFICER'];
      if (employeeRoles.includes(currentUser?.role)) {
        return tab.key === 'profile' || tab.key === 'team-members';
      }
      
      // For other roles, check if user has the permission in their database permissions
      if (currentUser?.permissions && Array.isArray(currentUser.permissions)) {
        return currentUser.permissions.includes(tab.permission);
      }
      
      // If no user permissions, don't show any restricted items
      return false;
    });
    
    return filteredTabs;
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          {isMobile ? 'Settings' : 'Settings & Configuration'}
        </Title>
        {!isMobile && (
          <Button 
            type="default" 
            icon={<SettingOutlined />}
            onClick={async () => {
              const success = await refreshUserPermissions();
              if (success) {
                message.success('Permissions refreshed successfully');
              } else {
                message.error('Failed to refresh permissions');
              }
            }}
          >
            Refresh Permissions
          </Button>
        )}
      </div>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          activeKey={activeTab}
          items={getTabItems()}
          onChange={(tab) => {
            setActiveTab(tab);
            setSearchParams({ tab });
          }}
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

      {/* Team Member Details Drawer */}
      <Drawer
        title="Team Member Details"
        placement="right"
        width={600}
        open={isDetailsDrawerVisible}
        onClose={() => setIsDetailsDrawerVisible(false)}
      >
        {selectedUser && (
          <div>
            {/* User Header */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space align="center">
                <Avatar size={64} icon={<UserOutlined />} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {selectedUser.name}
                  </Title>
                  <Text type="secondary">{selectedUser.email}</Text>
                  <br />
                  <Tag color={getRoleColor(selectedUser.role)} style={{ marginTop: 4 }}>
                    {getRoleLabel(selectedUser.role)}
                  </Tag>
                </div>
              </Space>
            </Card>

            {/* User Information */}
            <Descriptions
              title="Personal Information"
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Full Name">
                <Text strong>{selectedUser.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email Address">
                <Text copyable>{selectedUser.email}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Space>
                  <Tag color={getRoleColor(selectedUser.role)}>
                    {getRoleLabel(selectedUser.role)}
                  </Tag>
                  <Text type="secondary">
                    {ROLE_INFO[selectedUser.role]?.description || 'No description available'}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                <Text>
                  {(() => {
                    const departmentMap = {
                      'ADMIN': 'Management',
                      'STAFF': 'Client Engagement',
                      'DRIVER': 'Logistics',
                      'WAREHOUSE': 'Operations',
                      'ENQUIRY_OFFICER': 'Client Services',
                      'ENTRY_OFFICER': 'Operations',
                      'TRANSPORT_COORDINATOR': 'Operations',
                      'RELEASE_OFFICER': 'Operations',
                      'PREINVOICE_OFFICER': 'Quality Assurance',
                      'INVOICE_OFFICER': 'Finance',
                      'REVIEW_OFFICER': 'Quality Assurance',
                      'VETTING_OFFICER': 'Finance',
                      'CLEARING_OFFICER': 'Customs',
                      'IT_CONSULTANT': 'Information Technology',
                      'ACCOUNTANT': 'Finance'
                    };
                    return departmentMap[selectedUser.role] || 'General';
                  })()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedUser.isActive ? 'green' : 'red'}>
                  {selectedUser.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* Account Information */}
            <Descriptions
              title="Account Information"
              bordered
              column={1}
              size="small"
              style={{ marginTop: 16 }}
            >
              <Descriptions.Item label="User ID">
                <Text code>{selectedUser.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                <Space direction="vertical" size={0}>
                  <Text>{new Date(selectedUser.createdAt).toLocaleDateString()}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(selectedUser.createdAt).toLocaleTimeString()}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                <Space direction="vertical" size={0}>
                  <Text>{new Date(selectedUser.updatedAt).toLocaleDateString()}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(selectedUser.updatedAt).toLocaleTimeString()}
                  </Text>
                </Space>
              </Descriptions.Item>
              {selectedUser.lastLoginAt && (
                <Descriptions.Item label="Last Login">
                  <Space direction="vertical" size={0}>
                    <Text>{new Date(selectedUser.lastLoginAt).toLocaleDateString()}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(selectedUser.lastLoginAt).toLocaleTimeString()}
                    </Text>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Role Information */}
            <Card 
              title="Role Information" 
              size="small" 
              style={{ marginTop: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Role Level: </Text>
                  <Text>{ROLE_INFO[selectedUser.role]?.level || 'Standard'}</Text>
                </div>
                <div>
                  <Text strong>Role Description: </Text>
                  <Text type="secondary">
                    {ROLE_INFO[selectedUser.role]?.description || 'No description available'}
                  </Text>
                </div>
                {ROLE_INFO[selectedUser.role]?.icon && (
                  <div>
                    <Text strong>Role Icon: </Text>
                    <Text type="secondary">
                      {ROLE_INFO[selectedUser.role].icon}
                    </Text>
                  </div>
                )}
              </Space>
            </Card>

            {/* Quick Actions */}
            <Card 
              title="Quick Actions" 
              size="small" 
              style={{ marginTop: 16 }}
            >
              <Space wrap>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setIsDetailsDrawerVisible(false);
                    setEditingUser(selectedUser);
                    setIsUserModalVisible(true);
                  }}
                >
                  Edit User
                </Button>
                <Button
                  type="default"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    // Could add view permissions functionality here
                    message.info('Permission details coming soon');
                  }}
                >
                  View Permissions
                </Button>
                <Button
                  type="default"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedUser.email);
                    message.success('Email copied to clipboard');
                  }}
                >
                  Copy Email
                </Button>
              </Space>
            </Card>

            {/* Additional Information */}
            {selectedUser.notes && (
              <Card 
                title="Notes" 
                size="small" 
                style={{ marginTop: 16 }}
              >
                <Text>{selectedUser.notes}</Text>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SettingsPage;
