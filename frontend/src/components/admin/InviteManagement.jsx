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
  CopyOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import invitationService from '../../services/invitationService';
import { ROLE_INFO, RETIRED_ROLES } from '../../utils/permissions';

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
  const [lastInviteEmail, setLastInviteEmail] = useState(() => {
    // Load from localStorage on component mount
    return localStorage.getItem('lastInviteEmail') || null;
  });
  const [showInviteLink, setShowInviteLink] = useState(() => {
    // Show if we have a stored link
    return !!localStorage.getItem('lastInviteLink');
  });
  const [showLogs, setShowLogs] = useState(false);
  const [logsContent, setLogsContent] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareModalInvite, setShareModalInvite] = useState(null);
  
  const { sendInvite, pendingInvites, loadPendingInvitations } = useAuth();

  // Load pending invitations when component mounts
  useEffect(() => {
    loadPendingInvitations();
  }, [loadPendingInvitations]);

  // Use the centralized role information
  // VETTING_OFFICER is retired (vetting removed): never offered for new invites.
  const roleOptions = Object.entries(ROLE_INFO)
    .filter(([role]) => !RETIRED_ROLES.includes(role))
    .map(([role, info]) => ({
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
          setLastInviteEmail(values.email);
          setShowInviteLink(true);
          // Save to localStorage to survive page refreshes
          localStorage.setItem('lastInviteLink', response.inviteLink);
          localStorage.setItem('lastInviteEmail', values.email);
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

  const handleShareViaWhatsApp = () => {
    if (!inviteLink || !lastInviteEmail) {
      message.error('No invitation link available');
      return;
    }

    const message = `Hi! You have been invited to join CN Terminal. Please use this link to complete your account setup: ${inviteLink}`;
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp Web/App
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    message.success('Opening WhatsApp...');
  };

  const handleShareViaEmail = () => {
    if (!inviteLink || !lastInviteEmail) {
      message.error('No invitation link available');
      return;
    }

    const subject = 'Invitation to Join CN Terminal';
    const body = `Hi,

You have been invited to join CN Terminal.

Please use the following link to complete your account setup:
${inviteLink}

If you have any questions, please don't hesitate to contact us.

Best regards,
CN Terminal Team`;

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    // Open default email client
    window.location.href = `mailto:${lastInviteEmail}?subject=${encodedSubject}&body=${encodedBody}`;
    
    message.success('Opening email client...');
  };

  // Handle share for individual invitations
  const handleShareInvitation = (record) => {
    setShareModalInvite(record);
    setShareModalVisible(true);
  };

  const handleShareViaWhatsAppClick = () => {
    if (!shareModalInvite) return;
    const frontendOrigin = process.env.REACT_APP_API_URL?.replace('/api', '') || window.location.origin;
    const individualInviteLink = `${frontendOrigin}/accept-invitation/${shareModalInvite.id}`;
    const shareMessage = `Hi! You have been invited to join CN Terminal. Please use this link to complete your account setup: ${individualInviteLink}`;
    const encodedMessage = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    message.success('Opening WhatsApp...');
    setShareModalVisible(false);
  };

  const handleShareViaEmailClick = () => {
    if (!shareModalInvite) return;
    const frontendOrigin = process.env.REACT_APP_API_URL?.replace('/api', '') || window.location.origin;
    const individualInviteLink = `${frontendOrigin}/accept-invitation/${shareModalInvite.id}`;
    const subject = 'Invitation to Join CN Terminal';
    const body = `Hi,\n\nYou have been invited to join CN Terminal.\n\nPlease use the following link to complete your account setup:\n${individualInviteLink}\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nCN Terminal Team`;
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    window.location.href = `mailto:${shareModalInvite.email}?subject=${encodedSubject}&body=${encodedBody}`;
    message.success('Opening email client...');
    setShareModalVisible(false);
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
      case 'cancelled':
      case 'CANCELLED':
        return 'default';
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
    return Boolean(expiresAt) && new Date(expiresAt) < new Date();
  };

  const getEffectiveStatus = (record) => {
    if (record.status === 'ACCEPTED' || record.acceptedAt) return 'ACCEPTED';
    if (record.status === 'CANCELLED') return 'CANCELLED';
    if (record.status === 'EXPIRED') return 'EXPIRED';
    if (record.status === 'PENDING' && isExpired(record.expiresAt)) return 'EXPIRED';
    if (record.status === 'PENDING' || record.status === 'pending') return 'PENDING';
    if (isExpired(record.expiresAt) && record.status !== 'ACCEPTED') return 'EXPIRED';
    return record.status || 'PENDING';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACCEPTED':
      case 'accepted':
        return 'Accepted';
      case 'EXPIRED':
      case 'expired':
        return 'Expired';
      case 'CANCELLED':
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
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
        const status = getEffectiveStatus(record);
        if (status === 'ACCEPTED') {
          return <Tag color="success">Accepted</Tag>;
        }
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
        const status = getEffectiveStatus(record);
        return (
          <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
            {getStatusLabel(status)}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const status = getEffectiveStatus(record);
        const canManage = status === 'PENDING' || status === 'EXPIRED';
        return (
          <Space>
            {status === 'PENDING' ? (
            <Tooltip title="Share invitation link">
              <Button 
                size="small" 
                icon={<WhatsAppOutlined />}
                onClick={() => handleShareInvitation(record)}
              >
                Share
              </Button>
            </Tooltip>
            ) : null}
            {canManage ? (
            <Tooltip title="Resend invitation">
              <Button 
                size="small" 
                icon={<MailOutlined />}
                onClick={() => handleResendInvite(record)}
              >
                Resend
              </Button>
            </Tooltip>
            ) : null}
            {canManage ? (
            <Tooltip title="Cancel invitation">
              <Button 
                size="small" 
                danger
                onClick={() => handleCancelInvite(record.id)}
              >
                Cancel
              </Button>
            </Tooltip>
            ) : null}
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

          message.error(error.response?.data?.error || 'Failed to cancel invitation');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Calculate statistics
  const totalInvites = pendingInvites.length;
  const pendingInvitesCount = pendingInvites.filter(inv => getEffectiveStatus(inv) === 'PENDING').length;
  const acceptedInvitesCount = pendingInvites.filter(inv => getEffectiveStatus(inv) === 'ACCEPTED').length;
  const expiredInvitesCount = pendingInvites.filter(inv => getEffectiveStatus(inv) === 'EXPIRED').length;

  return (
    <div>
      <Title level={3} style={{ marginBottom: '24px' }}>
        User Invitation Management
      </Title>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Invites"
              value={totalInvites}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pending Invites"
              value={pendingInvitesCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Accepted Invites"
              value={acceptedInvitesCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
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

      {/* Invitation Link Display Modal */}
      <Modal
        title="🎉 Invitation Created Successfully!"
        open={showInviteLink}
        onCancel={() => {
          setShowInviteLink(false);
          setInviteLink(null);
          setLastInviteEmail(null);
          // Clear from localStorage
          localStorage.removeItem('lastInviteLink');
          localStorage.removeItem('lastInviteEmail');
          localStorage.removeItem('lastInviteTimestamp');
        }}
        footer={[
          <Button 
            key="whatsapp"
            type="primary"
            icon={<WhatsAppOutlined />}
            style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            onClick={handleShareViaWhatsApp}
            block
          >
            Share via WhatsApp
          </Button>,
          <Button 
            key="email"
            type="primary"
            icon={<MailOutlined />}
            onClick={handleShareViaEmail}
            block
          >
            Share via Email
          </Button>,
          <Button 
            key="close"
            onClick={() => {
              setShowInviteLink(false);
              setInviteLink(null);
              setLastInviteEmail(null);
              // Clear from localStorage
              localStorage.removeItem('lastInviteLink');
              localStorage.removeItem('lastInviteEmail');
              localStorage.removeItem('lastInviteTimestamp');
            }}
            block
          >
            Close
          </Button>
        ]}
        width={500}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text style={{ fontSize: '16px', display: 'block', marginBottom: '20px' }}>
            Copy the link below and share it with the user:
          </Text>
          <Input
            value={inviteLink}
            readOnly
            style={{ 
              fontSize: '14px',
              backgroundColor: '#f5f5f5',
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
        </div>
      </Modal>

      {/* Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Invitations
            </Title>
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

      {/* Share Invitation Modal */}
      {shareModalInvite && (
        <Modal
          title="Share Invitation"
          open={shareModalVisible}
          onCancel={() => setShareModalVisible(false)}
          footer={
            <Space size="middle" style={{ display: 'flex', justifyContent: 'stretch', width: '100%' }}>
              <Button 
                type="primary"
                icon={<WhatsAppOutlined />}
                style={{ backgroundColor: '#25D366', borderColor: '#25D366', flex: 1 }}
                onClick={handleShareViaWhatsAppClick}
              >
                Share via WhatsApp
              </Button>
              <Button 
                type="primary"
                icon={<MailOutlined />}
                onClick={handleShareViaEmailClick}
                style={{ flex: 1 }}
              >
                Share via Email
              </Button>
            </Space>
          }
          width={500}
          centered
        >
          <div>
            <Text>Choose how to share the invitation link:</Text>
            <Input
              value={shareModalInvite ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || window.location.origin}/accept-invitation/${shareModalInvite.id}` : ''}
              readOnly
              style={{ marginTop: '12px', fontSize: '12px' }}
              addonAfter={
                <Button 
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    const link = shareModalInvite ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || window.location.origin}/accept-invitation/${shareModalInvite.id}` : '';
                    navigator.clipboard.writeText(link);
                    message.success('Link copied!');
                  }}
                >
                  Copy
                </Button>
              }
            />
          </div>
        </Modal>
      )}

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
