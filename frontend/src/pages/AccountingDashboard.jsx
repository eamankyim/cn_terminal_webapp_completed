import React, { useState, useEffect } from 'react';
import PermissionGate from '../components/common/PermissionGate';
import { PERMISSIONS } from '../utils/permissions';
import { UI_PERMISSIONS } from '../utils/uiPermissions';
import { useAuth } from '../contexts/AuthContext';
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
  Empty,
  Spin,
  Alert,
  Badge
} from 'antd';
import { 
  DollarOutlined, 
  CalculatorOutlined, 
  RiseOutlined,
  FallOutlined,
  PlusOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  ExclamationCircleFilled,
  MoneyCollectOutlined,
  FundOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const { Title, Text } = Typography;

const AccountingDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    financialStats: {
      totalExpenses: 0,
      totalCashIn: 0,
      pendingExpenses: 0,
      approvedExpenses: 0,
      netProfit: 0,
      cashflow: 0
    },
    recentExpenses: [],
    recentPayouts: [],
    pendingApprovals: []
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load financial statistics
      const [expensesResponse, payoutsResponse, cashflowResponse, recentExpensesResponse, recentPayoutsResponse] = await Promise.all([
        apiService.get('/expenses/stats/summary'),
        apiService.get('/payouts/stats/summary'),
        apiService.get('/cashflow/summary'),
        apiService.get('/expenses?limit=5'),
        apiService.get('/payouts?limit=5')
      ]);

      // Get pre-calculated stats from backend
      const expenseStats = expensesResponse;
      const payoutStats = payoutsResponse;
      const cashflowStats = cashflowResponse;

      // Use pre-calculated backend stats
      const totalExpenses = cashflowStats.summary?.totalOutflows || 0; // Use cashflow data for consistency
      const pendingExpenses = expenseStats.pendingRequests || 0;
      const approvedExpenses = expenseStats.approvedRequests || 0;
      const netCashflow = cashflowStats.summary?.netCashflow || 0;
      const totalCashIn = cashflowStats.summary?.totalInflows || 0;
      
      // Calculate net profit based on cashflow (inflows - outflows)
      const netProfit = netCashflow;
      setDashboardData({
        financialStats: {
          totalExpenses,
          totalCashIn,
          pendingExpenses,
          approvedExpenses,
          netProfit,
          cashflow: netCashflow
        },
        recentExpenses: recentExpensesResponse.data || [],
        recentPayouts: recentPayoutsResponse.data || [],
        pendingApprovals: pendingExpenses
      });

    } catch (error) {

      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading financial dashboard...</Text>
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

  const stats = [
    {
      title: 'Total Expenses',
      value: dashboardData.financialStats.totalExpenses,
      prefix: <DollarOutlined />,
      suffix: 'GHS',
      color: '#cf1322'
    },
    {
      title: 'Total Cash In',
      value: dashboardData.financialStats.totalCashIn,
      prefix: <MoneyCollectOutlined />,
      suffix: 'GHS',
      color: '#389e0d'
    },
    {
      title: 'Net Profit',
      value: dashboardData.financialStats.netProfit,
      prefix: dashboardData.financialStats.netProfit >= 0 ? <RiseOutlined /> : <FallOutlined />,
      suffix: 'GHS',
      color: dashboardData.financialStats.netProfit >= 0 ? '#389e0d' : '#cf1322'
    }
  ];

  const expenseColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text style={{ color: '#cf1322', fontWeight: 'bold' }}>
          GHS {amount?.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="blue">{category}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          PENDING: { color: 'orange', icon: <ClockCircleFilled /> },
          APPROVED: { color: 'green', icon: <CheckCircleFilled /> },
          REJECTED: { color: 'red', icon: <ExclamationCircleFilled /> }
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        return (
          <Tag color={config.color} icon={config.icon}>
            {status}
          </Tag>
        );
      }
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    }
  ];

  const payoutColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text style={{ color: '#389e0d', fontWeight: 'bold' }}>
          GHS {amount?.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="green">{type}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          PENDING: { color: 'orange', icon: <ClockCircleFilled /> },
          PROCESSED: { color: 'green', icon: <CheckCircleFilled /> },
          FAILED: { color: 'red', icon: <ExclamationCircleFilled /> }
        };
        const config = statusConfig[status] || statusConfig.PENDING;
        return (
          <Tag color={config.color} icon={config.icon}>
            {status}
          </Tag>
        );
      }
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    }
  ];

  // Temporary bypass for debugging
  if (!currentUser) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="No User Data"
          description="Current user data is not available"
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Space align="center" size="middle">
          <Title level={2} style={{ margin: 0 }}>Financial Dashboard</Title>
          <Badge 
            count="Accountant View" 
            style={{ 
              backgroundColor: '#52c41a',
              fontSize: '12px',
              fontWeight: 'bold'
            }} 
          />
        </Space>
        <div style={{ marginTop: '8px' }}>
          <Text type="secondary">Monitor expenses, payouts, and financial performance</Text>
        </div>
        <div style={{ marginTop: '8px' }}>
          <Tag color="green" icon={<CalculatorOutlined />}>
            {currentUser.name} - {currentUser.role}
          </Tag>
        </div>
      </div>

        {/* Financial Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={8} lg={8} key={index}>
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

        {/* Additional Financial Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Pending Approvals"
                value={dashboardData.financialStats.pendingExpenses}
                prefix={<ClockCircleFilled />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Approved Expenses"
                value={dashboardData.financialStats.approvedExpenses}
                prefix={<CheckCircleFilled />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Current Cashflow"
                value={dashboardData.financialStats.cashflow}
                prefix={<FundOutlined />}
                suffix="GHS"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* Recent Expenses */}
          <Col xs={24} lg={12}>
            <Card 
              title="Recent Expenses" 
              extra={
                <PermissionGate 
                  userPermissions={currentUser?.permissions} 
                  permissions={PERMISSIONS.EXPENSE_CREATE}
                >
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/accounting')}
                  >
                    New Expense
                  </Button>
                </PermissionGate>
              }
              style={{ marginBottom: '16px' }}
            >
              <Table
                dataSource={dashboardData.recentExpenses}
                columns={expenseColumns}
                pagination={false}
                size="small"
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No recent expenses"
                    />
                  )
                }}
              />
            </Card>
          </Col>

          {/* Recent Payouts */}
          <Col xs={24} lg={12}>
            <Card 
              title="Recent Payouts" 
              extra={
                <PermissionGate 
                  userPermissions={currentUser?.permissions} 
                  permissions={PERMISSIONS.PAYOUT_CREATE}
                >
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/accounting')}
                  >
                    New Payout
                  </Button>
                </PermissionGate>
              }
              style={{ marginBottom: '16px' }}
            >
              <Table
                dataSource={dashboardData.recentPayouts}
                columns={payoutColumns}
                pagination={false}
                size="small"
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No recent payouts"
                    />
                  )
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Pending Approvals Alert */}
        {dashboardData.pendingApprovals.length > 0 && (
          <Alert
            message={`${dashboardData.pendingApprovals.length} expense(s) pending approval`}
            description="Review and approve pending expense requests to maintain financial flow."
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
            action={
              <Button 
                size="small" 
                onClick={() => navigate('/accounting')}
              >
                Review Now
              </Button>
            }
          />
        )}
    </div>
  );
};

export default AccountingDashboard;
