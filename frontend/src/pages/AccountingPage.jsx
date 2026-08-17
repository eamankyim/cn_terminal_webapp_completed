import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tabs,
  Button,
  Space,
  message,
  DatePicker,
  Select
} from 'antd';
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import moment from 'moment';
import ExpenseRequestForm from '../components/accounting/ExpenseRequestForm';
import ExpenseRequestsList from '../components/accounting/ExpenseRequestsList';
import { useAuth } from '../contexts/AuthContext';
import PermissionGate from '../components/common/PermissionGate';
import { PERMISSIONS } from '../utils/permissions';
import expenseService from '../services/expenseService';
import payoutService from '../services/payoutService';
import cashflowService from '../services/cashflowService';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AccountingPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expenseRequestModalVisible, setExpenseRequestModalVisible] = useState(false);
  const [cashflowData, setCashflowData] = useState({});
  const [expenseStats, setExpenseStats] = useState({});
  const [payoutStats, setPayoutStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);
  const [period, setPeriod] = useState('month');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Route guard: Only ADMIN, IT_CONSULTANT, and ACCOUNTANT can access this page
  useEffect(() => {
    const allowedRoles = ['ADMIN', 'IT_CONSULTANT', 'ACCOUNTANT'];
    if (currentUser && !allowedRoles.includes(currentUser.role)) {
      message.warning('Access denied. Accounting is only accessible to administrators and accountants.');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange, period]);

  const loadDashboardData = async () => {
    try {
      console.log('🔍 AccountingPage: Starting loadDashboardData...');
      setLoading(true);
      // Remove date filters to show all-time data like AccountingDashboard
      const params = {
        period
        // Removed startDate and endDate to get all-time data
      };

      console.log('📋 AccountingPage: API call parameters:', params);

      const [cashflowResponse, expenseResponse, payoutResponse] = await Promise.all([
        cashflowService.getSummary(params),
        expenseService.getExpenseStats(params),
        payoutService.getPayoutStats(params)
      ]);

      console.log('📊 AccountingPage: API responses received:');
      console.log('  - Cashflow Response:', cashflowResponse);
      console.log('  - Expense Response:', expenseResponse);
      console.log('  - Payout Response:', payoutResponse);

      setCashflowData(cashflowResponse);
      setExpenseStats(expenseResponse);
      setPayoutStats(payoutResponse);

      console.log('✅ AccountingPage: State updated successfully');
    } catch (error) {
      console.error('❌ AccountingPage: Error in loadDashboardData:', error);
      console.error('❌ AccountingPage: Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseRequestSuccess = () => {
    loadDashboardData();
    message.success('Expense request submitted successfully');
  };

  const getCashflowColor = (value) => {
    if (value > 0) return '#52c41a';
    if (value < 0) return '#ff4d4f';
    return '#1890ff';
  };

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div>
          {/* Summary Cards */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Net Cashflow"
                  value={cashflowData.summary?.netCashflow || 0}
                  formatter={(value) => cashflowService.formatAmount(value)}
                  valueStyle={{ color: getCashflowColor(cashflowData.summary?.netCashflow) }}
                  prefix={cashflowData.summary?.netCashflow >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Inflows"
                  value={cashflowData.summary?.totalInflows || 0}
                  formatter={(value) => cashflowService.formatAmount(value)}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<ArrowUpOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Outflows"
                  value={cashflowData.summary?.totalOutflows || 0}
                  formatter={(value) => cashflowService.formatAmount(value)}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<ArrowDownOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Pending Expenses"
                  value={expenseStats.pendingRequests || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Expense Breakdown */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Expense Breakdown" size="small">
                <Row gutter={16}>
                  {expenseStats.categoryBreakdown?.map((category, index) => (
                    <Col xs={12} sm={12} key={index} style={{ marginBottom: 16 }}>
                      <Statistic
                        title={
                          expenseService.getExpenseCategories().find(
                            (c) => c.value === category.category
                          )?.label || category.category
                        }
                        value={category.amount}
                        formatter={(value) => cashflowService.formatAmount(value)}
                        prefix={<DollarOutlined />}
                      />
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Payout Breakdown" size="small">
                <Row gutter={16}>
                  {payoutStats.methodBreakdown?.map((method, index) => (
                    <Col xs={12} sm={12} key={index} style={{ marginBottom: 16 }}>
                      <Statistic
                        title={method.paymentMethod}
                        value={method.amount}
                        formatter={(value) => cashflowService.formatAmount(value)}
                        prefix={<DollarOutlined />}
                      />
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>

        </div>
      ),
    },
    {
      key: 'expenses',
      label: 'Expense Requests',
      children: <ExpenseRequestsList />,
    },
    {
      key: 'cashflow',
      label: 'Cashflow',
      children: (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
              />
              <Select
                value={period}
                onChange={setPeriod}
                style={{ width: 120 }}
              >
                <Option value="today">Today</Option>
                <Option value="week">This Week</Option>
                <Option value="month">This Month</Option>
                <Option value="year">This Year</Option>
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadDashboardData}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </div>
          
          <Row gutter={16}>
            <Col xs={24}>
              <Card title="Cashflow Summary" size="small">
                <Row gutter={16}>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title="Total Inflows"
                      value={cashflowData.summary?.totalInflows || 0}
                      formatter={(value) => cashflowService.formatAmount(value)}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title="Total Outflows"
                      value={cashflowData.summary?.totalOutflows || 0}
                      formatter={(value) => cashflowService.formatAmount(value)}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                  <Col xs={12} sm={8}>
                    <Statistic
                      title="Net Cashflow"
                      value={cashflowData.summary?.netCashflow || 0}
                      formatter={(value) => cashflowService.formatAmount(value)}
                      valueStyle={{ color: getCashflowColor(cashflowData.summary?.netCashflow) }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'payouts',
      label: 'Payouts',
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <BarChartOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Title level={4} style={{ marginTop: 16 }}>
              Payout Management
            </Title>
            <p>Payout management interface will be implemented in the next phase.</p>
            <PermissionGate 
              userRole={currentUser?.role} 
              userPermissions={currentUser?.permissions}
              permissions={PERMISSIONS.PAYOUT_CREATE}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Create New Payout
              </Button>
            </PermissionGate>
          </div>
        </Card>
      ),
    },
    {
      key: 'reports',
      label: 'Reports',
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Title level={4} style={{ marginTop: 16 }}>
              Financial Reports
            </Title>
            <p>Financial reporting interface will be implemented in the next phase.</p>
            <Button type="primary" icon={<FileTextOutlined />}>
              Generate Report
            </Button>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2}>
              <DollarOutlined /> Accounting & Finance
            </Title>
            <p>Manage expenses, payouts, and track cashflow</p>
          </div>
          
          <div style={{ marginTop: 8 }}>
            <PermissionGate 
              userRole={currentUser?.role} 
              userPermissions={currentUser?.permissions}
              permissions={PERMISSIONS.EXPENSE_CREATE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setExpenseRequestModalVisible(true)}
              >
                Record Expense
              </Button>
            </PermissionGate>
          </div>
        </div>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* Expense Request Modal */}
      <ExpenseRequestForm
        visible={expenseRequestModalVisible}
        onCancel={() => setExpenseRequestModalVisible(false)}
        onSuccess={handleExpenseRequestSuccess}
        mode="record"
      />

    </div>
  );
};

export default AccountingPage;
