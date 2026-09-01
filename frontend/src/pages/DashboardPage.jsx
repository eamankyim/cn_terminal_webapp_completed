import React, { useState, useEffect } from 'react';
import PermissionGate from '../components/common/PermissionGate';
import { PERMISSIONS } from '../utils/permissions';
import { UI_PERMISSIONS } from '../utils/uiPermissions';
import { useAuth } from '../contexts/AuthContext';
import AccountingDashboard from './AccountingDashboard';
import ResponsiveTable from '../components/common/ResponsiveTable';
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
  Alert,
  Select,
  message
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
import { getJobStatusColor, getEtaUrgency, getEtaAntColor, formatEtaDate, ETA_FILTER, ETA_FILTER_OPTIONS } from '../utils/statusUtils';
import { getDefaultEtaFilter, setDefaultEtaFilter } from '../utils/userPreferences';

const { Title, Text } = Typography;
const { Option } = Select;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [etaFilter, setEtaFilter] = useState(ETA_FILTER.ALL);
  const [defaultEtaFilter, setDefaultEtaFilterState] = useState(ETA_FILTER.ALL);
  const [prefsReady, setPrefsReady] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalJobs: 0,
      jobsInTransit: 0,
      totalClients: 0,
      jobsDelivered: 0,
      revenueThisMonth: 0,
      workflowStatuses: {}
    },
    recentJobs: [],
    assignedJobs: []
  });

  // Redirect all roles except ADMIN, ACCOUNTANT, and IT_CONSULTANT to Jobs page
  useEffect(() => {
    const allowedRoles = ['ADMIN', 'ACCOUNTANT', 'IT_CONSULTANT'];
    if (currentUser?.role && !allowedRoles.includes(currentUser.role)) {
      navigate('/enquiries', { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const saved = getDefaultEtaFilter(currentUser.id);
    setDefaultEtaFilterState(saved);
    setEtaFilter(saved);
    setPrefsReady(true);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || !prefsReady) return;
    loadDashboardData(etaFilter);
  }, [currentUser?.id, prefsReady, etaFilter]);

  const loadDashboardData = async (filter = etaFilter) => {
    const isInitial = loading;
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setJobsLoading(true);
      }
      setError(null);
      
      const [statsResponse, recentJobsResponse] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecentJobs(10, filter)
      ]);

      setDashboardData({
        stats: statsResponse.stats,
        recentJobs: recentJobsResponse.jobs || [],
        assignedJobs: []
      });
    } catch (error) {

      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
      setJobsLoading(false);
    }
  };

  const handleSaveEtaFilterDefault = () => {
    if (!currentUser?.id) return;
    const saved = setDefaultEtaFilter(currentUser.id, etaFilter || ETA_FILTER.ALL);
    setDefaultEtaFilterState(saved);
    message.success('ETA filter saved as your default');
  };

  // Clearing agent statistics
  // Employee roles that should NOT see revenue
  const employeeRoles = [
    'STAFF', 
    'DRIVER', 
    'WAREHOUSE', 
    'ENQUIRY_OFFICER',
    'ENTRY_OFFICER',
    'TRANSPORT_COORDINATOR',
    'RELEASE_OFFICER', 
    'PREINVOICE_OFFICER',
    'INVOICE_OFFICER',
    'SUPERVISOR',
    'REVIEW_OFFICER', 
    'VETTING_OFFICER', 
    'CLEARING_OFFICER'
  ];
  
  const shouldShowRevenue = !employeeRoles.includes(currentUser?.role);

  const allStats = [
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
      title: 'Jobs Delivered',
      value: dashboardData.stats.jobsDelivered || 0,
      prefix: <CheckCircleOutlined />,
      color: '#52c41a',
      suffix: ''
    },
    {
      title: 'Revenue This Month',
      value: dashboardData.stats.revenueThisMonth,
      prefix: <DollarOutlined />,
      suffix: 'GHS',
      hideForEmployees: true  // Flag to hide for employee roles
    }
  ];

  // Filter stats based on user role
  const stats = allStats.filter(stat => !(stat.hideForEmployees && !shouldShowRevenue));

  // Using centralized status color utilities

  const getStatusIcon = (status, isDraft) => {
    if (isDraft) {
      return <FileTextOutlined />;
    }
    const statusIcons = {
      'NEW': <FileAddOutlined />,
      'PREINVOICED': <FileTextOutlined />,
      'INVOICED': <CalculatorOutlined />,
      'VETTED': <CalculatorOutlined />,
      'ENTRY_COMPLETED': <ContainerOutlined />,
      'READY_FOR_RELEASE': <CarOutlined />,
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
          <Col xs={12} sm={12} lg={6} key={index}>
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
        <Col xs={24} lg={24}>
          <Card 
            title="Jobs in Progress" 
            extra={
              <Space wrap>
                <Select
                  value={etaFilter || ETA_FILTER.ALL}
                  onChange={(value) => setEtaFilter(value || ETA_FILTER.ALL)}
                  style={{ width: 190 }}
                >
                  {ETA_FILTER_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
                <Button
                  onClick={handleSaveEtaFilterDefault}
                  disabled={(etaFilter || ETA_FILTER.ALL) === defaultEtaFilter}
                >
                  Set as default
                </Button>
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
              </Space>
            }
            style={{ marginBottom: '16px' }}
          >
            <ResponsiveTable
              dataSource={dashboardData.recentJobs}
              loading={jobsLoading}
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
                    const displayStatus = record.isDraft ? 'DRAFT' : (status ? status.replace(/_/g, ' ') : 'N/A');
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
                  render: (eta, record) => {
                    if (!eta) return <Text type="secondary">Not set</Text>;
                    const label = formatEtaDate(eta);
                    const urgency = getEtaUrgency(eta, record.status);
                    if (urgency === 'normal' || urgency === 'none') {
                      return label;
                    }
                    return <Tag color={getEtaAntColor(eta, record.status)}>{label}</Tag>;
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
              mobileConfig={{
                primaryFields: ['trackingId', 'customer', 'status'],
                secondaryFields: ['assignedTo', 'eta']
              }}
              onRowClick={(record) => navigate(`/enquiries?jobId=${record.id}`)}
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

      </Row>

      </div>
    </PermissionGate>
  );
};

export default DashboardPage;

