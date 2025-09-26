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
  Badge
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
import roleService from '../../services/roleService';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const RolePermissionManager = ({ currentUserRole, onRoleUpdate }) => {
  const [roles, setRoles] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Initialize roles with current permissions
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await roleService.getRoles();
        const rolesData = response.roles.map(roleData => ({
          key: roleData.role,
          role: roleData.role,
          ...ROLE_INFO[roleData.role],
          permissions: roleData.permissions,
          userCount: 0 // This would come from API
        }));
        setRoles(rolesData);
      } catch (error) {
        console.error('Error loading roles:', error);
        // Fallback to static roles if API fails
        const initialRoles = Object.keys(ROLE_INFO).map(role => ({
          key: role,
          role,
          ...ROLE_INFO[role],
          permissions: getRolePermissions(role),
          userCount: 0
        }));
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
    form.setFieldsValue({
      role: role.role,
      permissions: role.permissions
    });
    setIsModalVisible(true);
  };

  const handleSaveRole = async (values) => {
    setLoading(true);
    try {
      const { permissions } = values;
      
      // Call the API to save the role permissions
      await roleService.updateRolePermissions(editingRole.role, permissions);
      
      // Update local state
      const updatedRoles = roles.map(role => 
        role.role === editingRole.role 
          ? { ...role, permissions }
          : role
      );
      
      setRoles(updatedRoles);
      
      message.success('Role permissions updated successfully');
      setIsModalVisible(false);
      setEditingRole(null);
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
    form.resetFields();
  };

  const columns = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => (
        <Space>
          <span style={{ fontSize: '18px' }}>{record.icon}</span>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      ),
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
    const selectedPermissions = form.getFieldValue('permissions') || [];
    
    return (
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ marginBottom: '12px' }}>
          {categoryName}
        </Title>
        <Row gutter={[16, 8]}>
          {categoryPermissions.map(permission => (
            <Col span={12} key={permission}>
              <Checkbox
                value={permission}
                checked={selectedPermissions.includes(permission)}
                onChange={(e) => {
                  const currentPermissions = form.getFieldValue('permissions') || [];
                  const newPermissions = e.target.checked
                    ? [...currentPermissions, permission]
                    : currentPermissions.filter(p => p !== permission);
                  form.setFieldsValue({ permissions: newPermissions });
                }}
              >
                <div>
                  <Text strong>{permission.split(':')[1].replace(/_/g, ' ').toUpperCase()}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {PERMISSION_DESCRIPTIONS[permission]}
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
            rules={[{ required: true, message: 'Please select at least one permission' }]}
          >
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {Object.entries(PERMISSION_CATEGORIES).map(([categoryName, categoryPermissions]) =>
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
