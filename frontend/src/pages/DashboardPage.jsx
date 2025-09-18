import React, { useState, useEffect } from 'react';
import IntegrationTest from '../components/IntegrationTest';
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
  Timeline,
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
  CreditCardOutlined,
  PlusOutlined,
  EyeOutlined,
  GlobalOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  ExclamationCircleFilled,
  SyncOutlined,
  FileTextOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();
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
    recentActivities: [],
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
        recentActivities: statsResponse.recentActivities || [],
        recentJobs: recentJobsResponse.jobs || [],
        assignedJobs: assignedJobsResponse.jobs || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
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
      title: 'Jobs in Transit',
      value: dashboardData.stats.jobsInTransit,
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



  // Recent activities
  const recentActivities = dashboardData.recentActivities;
 

  const getStatusColor = (status) => {
    const statusColors = {
      'SUBMITTED': 'blue',
      'UNDER_REVIEW': 'orange',
      'QUOTED': 'purple',
      'AWAITING_PAYMENT': 'magenta',
      'PAID': 'green',
      'CLEARING': 'green',
      'CLEARED': 'green',
      'READY_FOR_SHIPMENT': 'cyan',
      'IN_TRANSIT': 'blue',
      'ARRIVED_AT_PORT': 'purple',
      'OUT_FOR_DELIVERY': 'cyan',
      'DELIVERED': 'green',
      'CLOSED': 'default',
      'ON_HOLD': 'orange',
      'REJECTED': 'red'
    };
    return statusColors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'Submitted': <FileAddOutlined />,
      'Under Review': <ClockCircleOutlined />,
      'Quoted': <CalculatorOutlined />,
      'Awaiting Payment': <CreditCardOutlined />,
      'Paid': <CheckCircleOutlined />,
      'Clearing': <SyncOutlined />,
      'Cleared': <CheckCircleOutlined />,

      'Delivered': <CheckCircleFilled />,
      'Closed': <CheckCircleFilled />
    };
    return statusIcons[status] || <FileAddOutlined />;
  };


  const getActivityIcon = (type) => {
    const icons = {
      'invoice': <FileTextOutlined style={{ color: '#1890ff' }} />,
      'eta': <GlobalOutlined style={{ color: '#52c41a' }} />,
      'enquiry': <FileAddOutlined style={{ color: '#00072D' }} />,
      'payment': <CreditCardOutlined style={{ color: '#52c41a' }} />
    };
    return icons[type] || <FileAddOutlined />;
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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Clearing Agent Dashboard</Title>
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
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/enquiries')}
              >
                New Job
              </Button>
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
                  render: (text) => <Text strong>{text}</Text>
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
                  render: (status) => (
                    <Tag color={getStatusColor(status)}>
                      {status.replace(/_/g, ' ')}
                    </Tag>
                  )
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
                }
              ]}
              pagination={false}
              size="small"
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
                  render: (text) => <Text strong>{text}</Text>
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
                  render: (status) => (
                    <Tag color={getStatusColor(status)}>
                      {status.replace(/_/g, ' ')}
                    </Tag>
                  )
                }
              ]}
              pagination={false}
              size="small"
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

          {/* Recent Activities */}
          <Card title="Recent Activities">
            <Timeline size="small">
              {recentActivities.map((activity, index) => (
                <Timeline.Item 
                  key={index} 
                  dot={getActivityIcon(activity.type)}
                  color="blue"
                >
                  <div>
                    <Text strong>{activity.action}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {activity.time} • {activity.user}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* API Integration Test Section */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <IntegrationTest />
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
