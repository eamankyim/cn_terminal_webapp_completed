import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Tag,
  Space,
  Typography,
  message,
  Tooltip,
  Badge,
  Alert,
  Divider
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SwapOutlined,
  InfoCircleOutlined,
  CrownOutlined
} from '@ant-design/icons';
import {
  ROLE_INFO,
  hasPermission,
  canManageRole,
  getAvailableRoles,
  PERMISSIONS
} from '../../utils/permissions';
import roleService from '../../services/roleService';

const { Title, Text } = Typography;
const { Option } = Select;

const UserRoleAssignment = ({ currentUserRole, users, onUserUpdate }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleEditUser = (user) => {
    if (!hasPermission(currentUserRole, PERMISSIONS.USER_MANAGE_ROLES)) {
      message.warning('You do not have permission to manage user roles');
      return;
    }

    if (!canManageRole(currentUserRole, user.role)) {
      message.warning('You cannot modify this user\'s role');
      return;
    }

    setEditingUser(user);
    form.setFieldsValue({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsModalVisible(true);
  };

  const handleSaveUser = async (values) => {
    setLoading(true);
    try {
      const { role } = values;
      
      // Call the API to update the user's role
      await roleService.updateUserRole(editingUser.id, role);
      
      message.success('User role updated successfully');
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      
      if (onUserUpdate) {
        onUserUpdate();
      }
    } catch (error) {
      message.error('Failed to update user role');
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const getRoleColor = (role) => {
    return ROLE_INFO[role]?.color || 'default';
  };

  const getRoleIcon = (role) => {
    return ROLE_INFO[role]?.icon || '❓';
  };

  const getRoleName = (role) => {
    return ROLE_INFO[role]?.name || role;
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <UserOutlined />
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
      title: 'Current Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)} icon={<CrownOutlined />}>
          {getRoleIcon(role)} {getRoleName(role)}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (lastLogin) => (
        <Text type="secondary">
          {lastLogin ? new Date(lastLogin).toLocaleDateString() : 'Never'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Change Role">
            <Button
              type="text"
              icon={<SwapOutlined />}
              onClick={() => handleEditUser(record)}
              disabled={!canManageRole(currentUserRole, record.role)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const availableRoles = getAvailableRoles(currentUserRole);

  return (
    <div>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4}>User Role Assignment</Title>
          <Text type="secondary">
            Assign and modify user roles. You can only assign roles that are lower than your current role level.
          </Text>
        </div>

        <Alert
          message="Role Assignment Rules"
          description={
            <div>
              <Text>• You can only assign roles with lower privilege levels than your own</Text><br />
              <Text>• Users with higher privilege levels cannot be modified</Text><br />
              <Text>• Role changes take effect immediately</Text>
            </div>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />

        <Table
          columns={columns}
          dataSource={users}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          size="small"
        />
      </Card>

      <Modal
        title={`Change Role - ${editingUser?.name}`}
        open={isModalVisible}
        onCancel={handleCancel}
        width={500}
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
            Update Role
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveUser}
        >
          <Form.Item
            name="name"
            label="User Name"
          >
            <Select disabled>
              <Option value={editingUser?.name}>{editingUser?.name}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
          >
            <Select disabled>
              <Option value={editingUser?.email}>{editingUser?.email}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select a role">
              {availableRoles.map(role => (
                <Option key={role} value={role}>
                  <Space>
                    <span>{ROLE_INFO[role]?.icon}</span>
                    <span>{ROLE_INFO[role]?.name}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          <div>
            <Text strong>Role Information:</Text>
            <div style={{ marginTop: '8px' }}>
              {editingUser && (
                <div>
                  <Text type="secondary">
                    {ROLE_INFO[form.getFieldValue('role')]?.description || 'No description available'}
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserRoleAssignment;
