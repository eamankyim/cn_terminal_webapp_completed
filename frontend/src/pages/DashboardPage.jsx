import React, { useState, useEffect } from 'react';
import PermissionGate from '../components/common/PermissionGate';
import { PERMISSIONS } from '../utils/permissions';
import { UI_PERMISSIONS } from '../utils/uiPermissions';
import { useAuth } from '../contexts/AuthContext';
import AccountingDashboard from './AccountingDashboard';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Typography,
  Avatar,
  Progress,
  Badge,
  Empty,
  Spin,
  Alert
} from 'antd';
import { 
  FileAddOutlined, 
  UserOutlined, 
  DollarOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CarOutlined,
  ContainerOutlined,
  CalculatorOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  ExclamationCircleFilled,
  SyncOutlined,
  FileTextOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { getJobStatusColor } from '../utils/statusUtils';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalJobs: 0,
      jobsInTransit: 0,
      totalClients: 0,
      revenueThisMonth: 0,
      workflowStatuses: {}
    },
    recentJobs: [],
    assignedJobs: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsResponse, recentJobsResponse, assignedJobsResponse] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecentJobs(5),
        apiService.getAssignedJobs(5)
      ]);

      setDashboardData({
        stats: statsResponse.stats,
        recentJobs: recentJobsResponse.jobs || [],
        assignedJobs: assignedJobsResponse.jobs || []
      });
    } catch (error) {

      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clearing agent statistics
  const stats = [
    {
      title: 'Total Jobs',
      value: dashboardData.stats.totalJobs,
      prefix: <FileAddOutlined />,
      color: '#1890ff',
      suffix: ''
    },
    {
      title: 'Jobs in Progress',
      value: dashboardData.stats.jobsInProgress,
      prefix: <ContainerOutlined />,
      color: '#faad14',
      suffix: ''
    },
    {
      title: 'Total Clients',
      value: dashboardData.stats.totalClients,
      prefix: <UserOutlined />,
      color: '#52c41a',
      suffix: ''
    },
    {
      title: 'Revenue This Month',
      value: dashboardData.stats.revenueThisMonth,
      prefix: <DollarOutlined />,
      suffix: 'GHS'
    }
  ];

  // Using centralized status color utilities

  const getStatusIcon = (status, isDraft) => {
    if (isDraft) {
      return <FileTextOutlined />;
    }
    const statusIcons = {
      'NEW': <FileAddOutlined />,
      'PREINVOICED': <FileTextOutlined />,
      'INVOICED': <CalculatorOutlined />,
      'ENTRY': <ContainerOutlined />,
      'RELEASE': <CheckCircleOutlined />,
      'CLEARED': <ContainerOutlined />,
      'DELIVERED': <CheckCircleFilled />
    };
    return statusIcons[status] || <FileAddOutlined />;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading dashboard data...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadDashboardData}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  // Show accounting dashboard for ACCOUNTANT users

  if (currentUser?.role === 'ACCOUNTANT') {

    return <AccountingDashboard />;
  }

  return (
    <PermissionGate 
      userRole={currentUser?.role} 
      userPermissions={currentUser?.permissions}
      permissions={UI_PERMISSIONS.DASHBOARD}
    >
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>Welcome to CN Terminal Dashboard</Title>
          <Text type="secondary">Monitor shipments, track status, and manage operations</Text>
        </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Jobs in Progress */}
        <Col xs={24} lg={16}>
          <Card 
            title="Jobs in Progress" 
            extra={
              <PermissionGate 
                userPermissions={currentUser?.permissions} 
                permissions={PERMISSIONS.JOB_CREATE}
              >
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/enquiries')}
                >
                  New Job
                </Button>
              </PermissionGate>
            }
            style={{ marginBottom: '16px' }}
          >
            <Table
              dataSource={dashboardData.recentJobs} 
              columns={[
                {
                  title: 'Job ID',
                  dataIndex: 'trackingId',
                  key: 'trackingId',
                  render: (text, record) => (
                    <Button 
                      type="link" 
                      onClick={() => navigate(`/enquiries?jobId=${record.id}`)}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      <Text strong style={{ color: '#1890ff' }}>{text}</Text>
                    </Button>
                  )
                },
                {
                  title: 'Client',
                  dataIndex: ['customer', 'name'],
                  key: 'customer',
                  render: (text) => <Text>{text}</Text>
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status, record) => {
                    const displayStatus = record.isDraft ? 'DRAFT' : status.replace(/_/g, ' ');
                    return (
                      <Tag color={getJobStatusColor(status, record.isDraft)} icon={getStatusIcon(status, record.isDraft)}>
                        {displayStatus}
                      </Tag>
                    );
                  }
                },
                {
                  title: 'Assigned To',
                  dataIndex: ['assignedTo', 'name'],
                  key: 'assignedTo',
                  render: (text) => <Text>{text || 'Unassigned'}</Text>
                },
                {
                  title: 'ETA',
                  dataIndex: 'eta',
                  key: 'eta',
                  render: (eta) => (
                    eta ? (
                      <Tag color="blue">
                        {new Date(eta).toLocaleDateString()}
                      </Tag>
                    ) : (
                      <Text type="secondary">Not set</Text>
                    )
                  )
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (_, record) => (
                    <Button 
                      type="link" 
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/enquiries?jobId=${record.id}`)}
                      size="small"
                    >
                      View
                    </Button>
                  )
                }
              ]}
              pagination={false}
              size="small"
              onRow={(record) => ({
                onClick: () => navigate(`/enquiries?jobId=${record.id}`),
                style: { cursor: 'pointer' }
              })}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: '14px', marginBottom: '4px' }}>
                          No jobs in progress
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Active jobs will appear here as they are processed
                        </Text>
                      </div>
                    }
                  />
                )
              }}
            />
          </Card>
        </Col>

        {/* Jobs Assigned to You */}
        <Col xs={24} lg={8}>
          <Card title="Jobs Assigned to You" style={{ marginBottom: '16px' }}>
            <Table
              dataSource={dashboardData.assignedJobs} 
              columns={[
                {
                  title: 'Job ID',
                  dataIndex: 'trackingId',
                  key: 'trackingId',
                  render: (text, record) => (
                    <Button 
                      type="link" 
                      onClick={() => navigate(`/enquiries?jobId=${record.id}`)}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      <Text strong style={{ color: '#1890ff' }}>{text}</Text>
                    </Button>
                  )
                },
                {
                  title: 'Client',
                  dataIndex: ['customer', 'name'],
                  key: 'customer',
                  render: (text) => <Text>{text}</Text>
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status, record) => {
                    const displayStatus = record.isDraft ? 'DRAFT' : status.replace(/_/g, ' ');
                    return (
                      <Tag color={getJobStatusColor(status, record.isDraft)} icon={getStatusIcon(status, record.isDraft)}>
                        {displayStatus}
                      </Tag>
                    );
                  }
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (_, record) => (
                    <Button 
                      type="link" 
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/enquiries?jobId=${record.id}`)}
                      size="small"
                    >
                      View
                    </Button>
                  )
                }
              ]}
              pagination={false}
              size="small"
              onRow={(record) => ({
                onClick: () => navigate(`/enquiries?jobId=${record.id}`),
                style: { cursor: 'pointer' }
              })}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: '14px', marginBottom: '4px' }}>
                          No jobs assigned to you
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Assigned jobs will appear here
                        </Text>
                      </div>
                    }
                  />
                )
              }}
            />
          </Card>

        </Col>
      </Row>

      </div>
    </PermissionGate>
  );
};

export default DashboardPage;
