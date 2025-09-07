import React, { useState } from 'react';
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
  Empty
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
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();

  // Clearing agent statistics - will be replaced with API call
  const stats = [
    {
      title: 'Total Jobs',
      value: 0,
      prefix: <FileAddOutlined />,
      color: '#1890ff',
      suffix: ''
    },
    {
      title: 'Active Shipments',
      value: 0,
      prefix: <ContainerOutlined />,
      color: '#faad14',
      suffix: ''
    },
    {
      title: 'Total Clients',
      value: 0,
      prefix: <UserOutlined />,
      color: '#52c41a',
      suffix: ''
    },
    {
      title: 'Revenue This Month',
      value: 0,
      prefix: <DollarOutlined />,
      suffix: 'GHS'
    }
  ];

  // Recent shipments - will be replaced with API call
  const recentShipments = [];

  // Workflow status counts - will be replaced with API call
  const workflowStatuses = [
    { status: 'Submitted', count: 0, color: '#1890ff', icon: <FileAddOutlined /> },
    { status: 'Under Review', count: 0, color: '#00072D', icon: <ClockCircleOutlined /> },
    { status: 'Quoted', count: 0, color: '#722ed1', icon: <CalculatorOutlined /> },
    { status: 'Awaiting Payment', count: 0, color: '#eb2f96', icon: <CreditCardOutlined /> },
    { status: 'Clearing', count: 0, color: '#52c41a', icon: <SyncOutlined /> },
    { status: 'Delivered', count: 0, color: '#52c41a', icon: <CheckCircleOutlined /> }
  ];

  // Recent activities - will be replaced with API call
  const recentActivities = [];
 

  const getStatusColor = (status) => {
    const statusColors = {
      'Submitted': 'blue',
      'Under Review': 'orange',
      'Quoted': 'purple',
      'Awaiting Payment': 'magenta',
      'Paid': 'green',
      'Clearing': 'green',
      'Cleared': 'green',

      'Delivered': 'green',
      'Closed': 'default'
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

  const shipmentColumns = [
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client'
    },
    {
      title: 'Goods',
      dataIndex: 'goods',
      key: 'goods'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status}
        </Tag>
      )
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta'
    },
    {
      title: 'Port',
      dataIndex: 'port',
      key: 'port'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            size="small" 
            onClick={() => navigate(`/shipments/${record.trackingId}`)}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const getActivityIcon = (type) => {
    const icons = {
      'invoice': <FileTextOutlined style={{ color: '#1890ff' }} />,
      'eta': <GlobalOutlined style={{ color: '#52c41a' }} />,
      'enquiry': <FileAddOutlined style={{ color: '#00072D' }} />,
      'payment': <CreditCardOutlined style={{ color: '#52c41a' }} />
    };
    return icons[type] || <FileAddOutlined />;
  };

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
        {/* Recent Shipments */}
        <Col xs={24} lg={16}>
          <Card 
            title="Recent Shipments" 
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
              dataSource={recentShipments} 
              columns={shipmentColumns} 
              pagination={false}
              size="small"
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: '14px', marginBottom: '4px' }}>
                          No recent shipments
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Shipments will appear here as they are processed
                        </Text>
                      </div>
                    }
                  />
                )
              }}
            />
          </Card>
        </Col>

        {/* Workflow Status Overview */}
        <Col xs={24} lg={8}>
          <Card title="Workflow Status" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {workflowStatuses.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0'
                }}>
                  <Space>
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <Text>{item.status}</Text>
                  </Space>
                  <Badge count={item.count} style={{ backgroundColor: item.color }} />
                </div>
              ))}
            </Space>
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
