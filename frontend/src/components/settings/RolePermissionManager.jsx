import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Checkbox,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Divider,
  Alert,
  Tooltip,
  message,
  Collapse,
  Spin
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import {
  ROLE_INFO,
  PERMISSION_CATEGORIES,
  PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  hasPermission,
  getRolePermissions,
  canManageRole,
  getAvailableRoles
} from '../../utils/permissions';
import { UI_PERMISSIONS, ROLE_UI_PERMISSIONS } from '../../utils/uiPermissions';
import roleService from '../../services/roleService';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// UI Permission Categories for role editing
const UI_PERMISSION_CATEGORIES = {
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
};

const RolePermissionManager = ({ currentUserRole, onRoleUpdate }) => {
  const [roles, setRoles] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [updatingPermissions, setUpdatingPermissions] = useState(new Set());
  const [currentRolePermissions, setCurrentRolePermissions] = useState([]);

  // Initialize roles with current permissions
  useEffect(() => {
    const loadRoles = async () => {
      try {
        console.log('🔍 ROLE MANAGER - Starting to load roles...');
        const response = await roleService.getRoles();
        console.log('🔍 ROLE MANAGER - API response:', JSON.stringify(response, null, 2));
        
        const rolesData = response.roles.map(roleData => {
          console.log('🔍 ROLE MAPPING - Processing roleData:', roleData);
          
          const roleInfo = ROLE_INFO[roleData.role] || {
            name: roleData.role,
            description: 'Unknown role',
            color: 'default',
            icon: '❓',
            level: 0
          };
          
          const mappedRole = {
            key: roleData.role,
            role: roleData.role,
            name: roleData.name || roleInfo.name, // Use API name first, fallback to ROLE_INFO
            description: roleData.description || roleInfo.description,
            color: roleInfo.color,
            icon: roleInfo.icon,
            level: roleInfo.level,
            permissions: roleData.permissions,
            userCount: roleData.userCount || 0
          };
          
          console.log('🔍 ROLE MAPPING - Mapped role:', mappedRole);
          return mappedRole;
        });
        
        console.log('🔍 ROLE MANAGER - Processed roles data:', JSON.stringify(rolesData, null, 2));
        setRoles(rolesData);
      } catch (error) {
        console.error('❌ ROLE MANAGER - Error loading roles:', error);
        console.log('🔍 ROLE MANAGER - Falling back to static roles...');
        // Fallback to static roles if API fails
        const initialRoles = Object.keys(ROLE_INFO).map(role => ({
          key: role,
          role,
          ...ROLE_INFO[role],
          permissions: getRolePermissions(role),
          userCount: 0
        }));
        console.log('🔍 ROLE MANAGER - Static roles fallback:', JSON.stringify(initialRoles, null, 2));
        setRoles(initialRoles);
      }
    };
    
    loadRoles();
  }, []);

  const handleEditRole = (role) => {
    if (!canManageRole(currentUserRole, role.role)) {
      message.warning('You cannot modify this role');
      return;
    }
    
    setEditingRole(role);
    const rolePermissions = Array.isArray(role.permissions) ? role.permissions : [];
    setCurrentRolePermissions(rolePermissions);
    form.setFieldsValue({
      role: role.role,
      permissions: rolePermissions
    });
    setIsModalVisible(true);
  };

  const handleSaveRole = async (values) => {
    setLoading(true);
    try {
      // Use currentRolePermissions instead of form values
      const permissions = Array.isArray(currentRolePermissions) ? currentRolePermissions : [];
      
      console.log(`🔄 Saving permissions for ${editingRole.role}:`, permissions);
      
      // Call the API to save the role permissions
      const response = await roleService.updateRolePermissions(editingRole.role, permissions);
      
      // Update local state
      const updatedRoles = roles.map(role => 
        role.role === editingRole.role 
          ? { ...role, permissions }
          : role
      );
      
      setRoles(updatedRoles);
      
      // Check if force logout is required
      if (response.forceLogout && response.affectedUsers > 0) {
        message.warning(
          `Role permissions updated successfully. ${response.affectedUsers} users with this role will be logged out.`,
          5
        );
      } else {
        message.success('Role permissions updated successfully');
      }
      setIsModalVisible(false);
      setEditingRole(null);
      setCurrentRolePermissions([]);
      form.resetFields();
      
      if (onRoleUpdate) {
        onRoleUpdate();
      }
    } catch (error) {
      message.error('Failed to update role permissions');
      console.error('Error updating role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRole(null);
    setCurrentRolePermissions([]);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => {
        console.log('🔍 TABLE RENDER - Role:', role, 'Record:', record);
        return (
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count, record) => {
        console.log('🔍 USER COUNT - Count:', count, 'Record userCount:', record.userCount);
        const userCount = count || record.userCount || 0;
        return (
          <div>
            <Text strong style={{ color: '#52c41a' }}>{userCount}</Text>
          </div>
        );
      },
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <Text type="secondary">{permissions?.length || 0} permissions</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Permissions">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditRole(record)}
              disabled={!canManageRole(currentUserRole, record.role)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const renderPermissionCategory = (categoryName, categoryPermissions) => {
    // Use the current role permissions state instead of form value
    const permissionsArray = Array.isArray(currentRolePermissions) ? currentRolePermissions : [];
    
    return (
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ marginBottom: '12px' }}>
          {categoryName}
        </Title>
        <Row gutter={[16, 8]}>
          {Object.entries(categoryPermissions).map(([permission, label]) => (
            <Col span={12} key={permission}>
              <Checkbox
                value={permission}
                checked={permissionsArray.includes(permission)}
                disabled={updatingPermissions.has(permission)}
                onChange={async (e) => {
                  // Use current role permissions state
                  const permissionsArray = Array.isArray(currentRolePermissions) ? currentRolePermissions : [];
                  const newPermissions = e.target.checked
                    ? [...permissionsArray, permission]
                    : permissionsArray.filter(p => p !== permission);
                  
                  // Update both form and state immediately for UI responsiveness
                  form.setFieldsValue({ permissions: newPermissions });
                  setCurrentRolePermissions(newPermissions);
                  
                  // Add to updating set
                  setUpdatingPermissions(prev => new Set([...prev, permission]));
                  
                  // Save to database immediately
                  try {
                    console.log(`🔄 Updating permissions for ${editingRole.role}:`, newPermissions);
                    const response = await roleService.updateRolePermissions(editingRole.role, newPermissions);
                    
                    // Update local state
                    const updatedRoles = roles.map(role => 
                      role.role === editingRole.role 
                        ? { ...role, permissions: newPermissions }
                        : role
                    );
                    setRoles(updatedRoles);
                    
                    // Check if force logout is required
                    if (response.forceLogout && response.affectedUsers > 0) {
                      message.warning(
                        `Permission ${e.target.checked ? 'granted' : 'revoked'} successfully. ${response.affectedUsers} users with this role will be logged out.`,
                        5
                      );
                    } else {
                      message.success(`Permission ${e.target.checked ? 'granted' : 'revoked'} successfully`);
                    }
                  } catch (error) {
                    // Revert both form and state if API call fails
                    form.setFieldsValue({ permissions: permissionsArray });
                    setCurrentRolePermissions(permissionsArray);
                    message.error(`Failed to ${e.target.checked ? 'grant' : 'revoke'} permission: ${error.message || 'Unknown error'}`);
                    console.error('Error updating permission:', error);
                  } finally {
                    // Remove from updating set
                    setUpdatingPermissions(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(permission);
                      return newSet;
                    });
                  }
                }}
              >
                <div>
                  <Text strong>{permission}</Text>
                  {updatingPermissions.has(permission) && (
                    <Spin size="small" style={{ marginLeft: '8px' }} />
                  )}
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {label}
                  </Text>
                </div>
              </Checkbox>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  return (
    <div>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4}>Role & Permission Management</Title>
          <Text type="secondary">
            Manage user roles and their associated permissions. Changes will affect all users with the modified role.
          </Text>
        </div>

        <Alert
          message="Permission Management"
          description="Only administrators can modify role permissions. Changes take effect immediately for all users with that role."
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />

        <Table
          columns={columns}
          dataSource={roles}
          pagination={false}
          rowKey="role"
          size="small"
        />
      </Card>

      <Modal
        title={`Edit Permissions - ${editingRole?.name}`}
        open={isModalVisible}
        onCancel={handleCancel}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={loading}
            onClick={() => form.submit()}
          >
            Save Changes
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveRole}
          initialValues={{
            permissions: []
          }}
        >
          <Form.Item
            name="role"
            label="Role"
          >
            <Select disabled>
              <Option value={editingRole?.role}>{editingRole?.name}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Permissions"
          >
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {Object.entries(UI_PERMISSION_CATEGORIES).map(([categoryName, categoryPermissions]) =>
                renderPermissionCategory(categoryName, categoryPermissions)
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RolePermissionManager;
