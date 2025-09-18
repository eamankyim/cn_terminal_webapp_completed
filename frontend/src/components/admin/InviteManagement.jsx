import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  message
} from 'antd';
import { 
  PlusOutlined, 
  MailOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import invitationService from '../../services/invitationService';

const { Title, Text } = Typography;
const { Option } = Select;

const InviteManagement = () => {
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const { sendInvite, pendingInvites, loadPendingInvitations } = useAuth();

  // Load pending invitations when component mounts
  useEffect(() => {
    loadPendingInvitations();
  }, [loadPendingInvitations]);


  const roleOptions = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'DRIVER', label: 'Driver' },
    { value: 'WAREHOUSE', label: 'Warehouse' }
  ];

  const handleSendInvite = async (values) => {
    setLoading(true);
    try {
      await sendInvite(values);
      message.success('Invitation sent successfully!');
      setInviteModalVisible(false);
      inviteForm.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'processing';
      case 'accepted':
        return 'success';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockCircleOutlined />;
      case 'accepted':
        return <CheckCircleOutlined />;
      case 'expired':
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  const inviteColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <Space>
          <MailOutlined />
          <Text strong>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleOption = roleOptions.find(r => r.value === role);
        return (
          <Space>
            <UserOutlined />
            <Text strong>{roleOption?.label || role}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Invited By',
      key: 'invitedBy',
      render: (_, record) => (
        <Text type="secondary">
          {record.invitedByUser?.name || record.invitedBy || 'Unknown'}
        </Text>
      ),
    },
    {
      title: 'Invited Date',
      key: 'invitedAt',
      render: (_, record) => (
        <Text>{new Date(record.invitedAt).toLocaleDateString()}</Text>
      ),
    },
    {
      title: 'Expires',
      key: 'expiresAt',
      render: (_, record) => {
        const expired = isExpired(record.expiresAt);
        return (
          <Tag color={expired ? 'error' : 'processing'}>
            {expired ? 'Expired' : new Date(record.expiresAt).toLocaleDateString()}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const expired = isExpired(record.expiresAt);
        const status = expired ? 'expired' : record.status;
        return (
          <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
            {status === 'pending' && !expired ? 'Pending' : 
             status === 'accepted' ? 'Accepted' : 'Expired'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const expired = isExpired(record.expiresAt);
        return (
          <Space>
            <Tooltip title="Resend invitation">
              <Button 
                size="small" 
                icon={<MailOutlined />}
                disabled={expired}
                onClick={() => handleResendInvite(record)}
              >
                Resend
              </Button>
            </Tooltip>
            <Tooltip title="Cancel invitation">
              <Button 
                size="small" 
                danger
                onClick={() => handleCancelInvite(record.id)}
              >
                Cancel
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const handleResendInvite = async (invite) => {
    Modal.confirm({
      title: 'Resend Invitation',
      content: `Are you sure you want to resend the invitation to ${invite.email}?`,
      okText: 'Yes, Resend',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          await invitationService.resendInvitation(invite.id);
          message.success('Invitation resent successfully!');
          // Reload invitations to get updated data
          loadPendingInvitations();
        } catch (error) {
          console.error('Resend invitation error:', error);
          message.error(error.response?.data?.error || 'Failed to resend invitation');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCancelInvite = async (inviteId) => {
    Modal.confirm({
      title: 'Cancel Invitation',
      content: 'Are you sure you want to cancel this invitation? This action cannot be undone.',
      okText: 'Yes, Cancel',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          setLoading(true);
          await invitationService.cancelInvitation(inviteId);
          message.success('Invitation cancelled successfully!');
          // Reload invitations to get updated data
          loadPendingInvitations();
        } catch (error) {
          console.error('Cancel invitation error:', error);
          message.error(error.response?.data?.error || 'Failed to cancel invitation');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Calculate statistics
  const totalInvites = pendingInvites.length;
  const pendingInvitesCount = pendingInvites.filter(inv => !isExpired(inv.expiresAt)).length;
  const expiredInvitesCount = pendingInvites.filter(inv => isExpired(inv.expiresAt)).length;

  return (
    <div>
      <Title level={3} style={{ marginBottom: '24px' }}>
        User Invitation Management
      </Title>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Invites"
              value={totalInvites}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Invites"
              value={pendingInvitesCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Expired Invites"
              value={expiredInvitesCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Pending Invitations
            </Title>
            <Text type="secondary">
              Manage user invitations and track their status
            </Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setInviteModalVisible(true)}
          >
            Send New Invite
          </Button>
        </div>
      </Card>

      {/* Invites Table */}
      <Card>
        <Table
          columns={inviteColumns}
          dataSource={pendingInvites}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Send Invite Modal */}
      <Modal
        title="Send User Invitation"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleSendInvite}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email address' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Enter email address"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="User Role"
            rules={[
              { required: true, message: 'Please select a role' }
            ]}
          >
            <Select 
              placeholder="Select user role"
              size="large"
            >
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="message"
            label="Personal Message (Optional)"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Add a personal message to the invitation email..."
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setInviteModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                icon={<MailOutlined />}
              >
                Send Invitation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InviteManagement;
