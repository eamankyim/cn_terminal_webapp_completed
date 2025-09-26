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
  CloseCircleOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import invitationService from '../../services/invitationService';
import { ROLE_INFO } from '../../utils/permissions';

const { Title, Text } = Typography;
const { Option } = Select;

const InviteManagement = () => {
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState(() => {
    // Load from localStorage on component mount
    return localStorage.getItem('lastInviteLink') || null;
  });
  const [showInviteLink, setShowInviteLink] = useState(() => {
    // Show if we have a stored link
    return !!localStorage.getItem('lastInviteLink');
  });
  const [showLogs, setShowLogs] = useState(false);
  const [logsContent, setLogsContent] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  
  const { sendInvite, pendingInvites, loadPendingInvitations } = useAuth();

  // Load pending invitations when component mounts
  useEffect(() => {
    loadPendingInvitations();
  }, [loadPendingInvitations]);


  // Use the centralized role information
  const roleOptions = Object.entries(ROLE_INFO).map(([role, info]) => ({
    value: role,
    label: info.name,
    description: info.description
  }));

  const handleSendInvite = async (values) => {
    setLoading(true);
    try {
      const response = await sendInvite(values);
      
        // Extract invitation link from response
        if (response && response.inviteLink) {
          setInviteLink(response.inviteLink);
          setShowInviteLink(true);
          // Save to localStorage to survive page refreshes
          localStorage.setItem('lastInviteLink', response.inviteLink);
          localStorage.setItem('lastInviteTimestamp', new Date().toISOString());
          message.success('Invitation sent successfully! Check the link below.');
        } else {
          message.success('Invitation sent successfully!');
        }
      
      setInviteModalVisible(false);
      inviteForm.resetFields();
      loadPendingInvitations(); // Refresh the list
    } catch (error) {
      message.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'PENDING':
        return 'processing';
      case 'accepted':
      case 'ACCEPTED':
        return 'success';
      case 'expired':
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'PENDING':
        return <ClockCircleOutlined />;
      case 'accepted':
      case 'ACCEPTED':
        return <CheckCircleOutlined />;
      case 'expired':
      case 'EXPIRED':
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  const handleViewLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await invitationService.getInvitationLogs();
      setLogsContent(response);
      setShowLogs(true);
    } catch (error) {
      if (error.response?.status === 404) {
        setLogsContent('No invitation or password reset links found yet. Create an invitation or request a password reset to see the log file.');
        setShowLogs(true);
      } else {
        message.error('Failed to load links log');
      }
    } finally {
      setLogsLoading(false);
    }
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
            {status === 'PENDING' && !expired ? 'Pending' : 
             status === 'ACCEPTED' ? 'Accepted' : 
             status === 'EXPIRED' ? 'Expired' :
             expired ? 'Expired' : 'Pending'}
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

      {/* Invitation Link Display */}
      {showInviteLink && inviteLink && (
        <Card 
          style={{ 
            marginBottom: '24px', 
            border: '2px solid #52c41a',
            backgroundColor: '#f6ffed',
            position: 'sticky',
            top: '20px',
            zIndex: 1000
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Title level={4} style={{ color: '#52c41a', marginBottom: '8px' }}>
              🎉 Invitation Created Successfully!
            </Title>
            {localStorage.getItem('lastInviteTimestamp') && (
              <Text type="secondary" style={{ fontSize: '12px', marginBottom: '16px', display: 'block' }}>
                Created: {new Date(localStorage.getItem('lastInviteTimestamp')).toLocaleString()}
              </Text>
            )}
            <Text strong style={{ fontSize: '16px', marginBottom: '8px', display: 'block' }}>
              Copy the link below and share it with the user:
            </Text>
            <Input
              value={inviteLink}
              readOnly
              style={{ 
                fontSize: '14px',
                backgroundColor: '#fff',
                border: '2px solid #52c41a',
                marginBottom: '12px'
              }}
              addonAfter={
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    message.success('Link copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              }
            />
            <div>
              <Button 
                type="link" 
                onClick={() => {
                  setShowInviteLink(false);
                  setInviteLink(null);
                  // Clear from localStorage
                  localStorage.removeItem('lastInviteLink');
                  localStorage.removeItem('lastInviteTimestamp');
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}

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
          <Space>
            {inviteLink && (
              <Button 
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  message.success('Invitation link copied to clipboard!');
                }}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
              >
                Copy Last Link
              </Button>
            )}
            <Button 
              icon={<MailOutlined />}
              onClick={handleViewLogs}
              loading={logsLoading}
            >
              View All Links
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setInviteModalVisible(true)}
            >
              Send New Invite
            </Button>
          </Space>
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

      {/* Invitation & Password Reset Logs Modal */}
      <Modal
        title="Invitation & Password Reset Links Log"
        open={showLogs}
        onCancel={() => setShowLogs(false)}
        footer={[
          <Button key="close" onClick={() => setShowLogs(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <div style={{ maxHeight: '500px', overflow: 'auto' }}>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            fontSize: '12px',
            lineHeight: '1.4',
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '4px',
            border: '1px solid #d9d9d9'
          }}>
            {logsContent}
          </pre>
        </div>
      </Modal>
    </div>
  );
};

export default InviteManagement;
