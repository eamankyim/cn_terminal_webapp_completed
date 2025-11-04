import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Tabs,
  Select,
  DatePicker,
  Space,
  Typography,
  Statistic,
  Progress,
  Tag,
  Button,
  Tooltip,
  Alert
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

// Chart Components
import ChartContainer from '../charts/ChartContainer';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import DoughnutChart from '../charts/DoughnutChart';

// Services
import reportService from '../../services/reportService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const AdvancedAnalytics = ({ dateRange, onDateRangeChange }) => {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    trends: [],
    performance: [],
    distribution: [],
    forecasts: []
  });

  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedMetric, selectedPeriod]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Load trend data
      const trendData = await loadTrendAnalysis();
      
      // Load performance data
      const performanceData = await loadPerformanceAnalytics();
      
      // Load distribution data
      const distributionData = await loadDistributionAnalysis();
      
      // Load forecast data
      const forecastData = await loadForecastData();

      setAnalyticsData({
        trends: trendData,
        performance: performanceData,
        distribution: distributionData,
        forecasts: forecastData
      });
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const loadTrendAnalysis = async () => {
    // Generate trend data based on historical data
    const dailyActivity = await reportService.getDailyActivity(dateRange[0], dateRange[1]);
    
    return dailyActivity.map((item, index) => ({
      date: dayjs(item.date).format('MMM DD'),
      revenue: item.revenue,
      jobs: item.newJobs,
      completed: item.completedJobs,
      efficiency: item.newJobs > 0 ? (item.completedJobs / item.newJobs) * 100 : 0
    }));
  };

  const loadPerformanceAnalytics = async () => {
    const jobStatus = await reportService.getJobStatusSummary(dateRange[0], dateRange[1]);
    const revenue = await reportService.getRevenueSummary(dateRange[0], dateRange[1]);
    
    return {
      jobStatus: jobStatus.map(item => ({
        label: item.status,
        value: item.count,
        percentage: item.percentage
      })),
      revenue: revenue.revenueByStatus.map(item => ({
        label: item.status,
        value: item.amount,
        percentage: item.percentage
      }))
    };
  };

  const loadDistributionAnalysis = async () => {
    const customers = await reportService.getCustomerActivity(dateRange[0], dateRange[1]);
    
    return customers.slice(0, 10).map(customer => ({
      label: customer.name,
      value: customer.revenue,
      jobs: customer.jobs
    }));
  };

  const loadForecastData = async () => {
    // Simple forecasting based on trend analysis
    const trends = await loadTrendAnalysis();
    const lastWeek = trends.slice(-7);
    const avgRevenue = lastWeek.reduce((sum, day) => sum + day.revenue, 0) / lastWeek.length;
    const avgJobs = lastWeek.reduce((sum, day) => sum + day.jobs, 0) / lastWeek.length;
    
    // Generate next 7 days forecast
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const futureDate = dayjs().add(i, 'days');
      forecast.push({
        date: futureDate.format('MMM DD'),
        revenue: Math.round(avgRevenue * (1 + (Math.random() - 0.5) * 0.2)),
        jobs: Math.round(avgJobs * (1 + (Math.random() - 0.5) * 0.2)),
        type: 'forecast'
      });
    }
    
    return forecast;
  };

  const getTrendIcon = (current, previous) => {
    if (current > previous) return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (current < previous) return <FallOutlined style={{ color: '#f5222d' }} />;
    return <BarChartOutlined style={{ color: '#1890ff' }} />;
  };

  const getTrendPercentage = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const exportAnalytics = () => {
    // Export functionality for analytics data

  };

  return (
    <div>
      {/* Analytics Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Advanced Analytics & Insights
            </Title>
            <Text type="secondary">
              Deep insights into your terminal operations with predictive analytics
            </Text>
          </Col>
          <Col>
            <Space>
              <Select
                value={selectedMetric}
                onChange={setSelectedMetric}
                style={{ width: 150 }}
              >
                <Option value="revenue">Revenue</Option>
                <Option value="jobs">Jobs</Option>
                <Option value="efficiency">Efficiency</Option>
              </Select>
              <Select
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                style={{ width: 120 }}
              >
                <Option value="7days">7 Days</Option>
                <Option value="30days">30 Days</Option>
                <Option value="90days">90 Days</Option>
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadAnalyticsData}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportAnalytics}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Key Metrics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Revenue Trend"
              value={analyticsData.trends.length > 0 ? analyticsData.trends[analyticsData.trends.length - 1]?.revenue : 0}
              prefix={getTrendIcon(
                analyticsData.trends.length > 1 ? analyticsData.trends[analyticsData.trends.length - 1]?.revenue : 0,
                analyticsData.trends.length > 1 ? analyticsData.trends[analyticsData.trends.length - 2]?.revenue : 0
              )}
              suffix="GHS"
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {getTrendPercentage(
                analyticsData.trends.length > 1 ? analyticsData.trends[analyticsData.trends.length - 1]?.revenue : 0,
                analyticsData.trends.length > 1 ? analyticsData.trends[analyticsData.trends.length - 2]?.revenue : 0
              )}% from previous period
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Job Efficiency"
              value={analyticsData.trends.length > 0 ? analyticsData.trends[analyticsData.trends.length - 1]?.efficiency : 0}
              prefix={getTrendIcon(
                analyticsData.trends.length > 1 ? analyticsData.trends[analyticsData.trends.length - 1]?.efficiency : 0,
                analyticsData.trends.length > 1 ? analyticsData.trends[analyticsData.trends.length - 2]?.efficiency : 0
              )}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Completion rate
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Jobs"
              value={analyticsData.trends.length > 0 ? analyticsData.trends[analyticsData.trends.length - 1]?.jobs : 0}
              prefix={getTrendIcon(
                analyticsData.trends.length > 1 ? analyticsData.trends[analyticsData.trends.length - 1]?.jobs : 0,
                analyticsData.trends.length > 1 ? analyticsData.trends[analyticsData.trends.length - 2]?.jobs : 0
              )}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              New jobs today
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed Jobs"
              value={analyticsData.trends.length > 0 ? analyticsData.trends[analyticsData.trends.length - 1]?.completed : 0}
              prefix={getTrendIcon(
                analyticsData.trends.length > 1 ? analyticsData.trends[analyticsData.trends.length - 1]?.completed : 0,
                analyticsData.trends.length > 1 ? analyticsData.trends[analyticsData.trends.length - 2]?.completed : 0
              )}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Completed today
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Analytics Tabs */}
      <Card>
        <Tabs defaultActiveKey="trends">
          <TabPane tab="Trend Analysis" key="trends">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <ChartContainer
                  title="Revenue & Job Trends"
                  loading={loading}
                  height={400}
                >
                  <LineChart
                    data={analyticsData.trends}
                    xAxisKey="date"
                    datasets={[
                      {
                        label: 'Revenue (GHS)',
                        key: 'revenue',
                        color: '#1890ff'
                      },
                      {
                        label: 'New Jobs',
                        key: 'jobs',
                        color: '#52c41a'
                      },
                      {
                        label: 'Completed Jobs',
                        key: 'completed',
                        color: '#fa8c16'
                      }
                    ]}
                    fillArea={true}
                    height={400}
                  />
                </ChartContainer>
              </Col>
              <Col xs={24} lg={8}>
                <ChartContainer
                  title="Efficiency Trend"
                  loading={loading}
                  height={400}
                >
                  <LineChart
                    data={analyticsData.trends}
                    xAxisKey="date"
                    datasets={[
                      {
                        label: 'Efficiency %',
                        key: 'efficiency',
                        color: '#722ed1'
                      }
                    ]}
                    height={400}
                  />
                </ChartContainer>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Performance Analytics" key="performance">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <ChartContainer
                  title="Job Status Distribution"
                  loading={loading}
                  height={350}
                >
                  <DoughnutChart
                    data={analyticsData.performance.jobStatus || []}
                    labelKey="label"
                    valueKey="value"
                    height={350}
                    centerText="Jobs"
                  />
                </ChartContainer>
              </Col>
              <Col xs={24} lg={12}>
                <ChartContainer
                  title="Revenue by Status"
                  loading={loading}
                  height={350}
                >
                  <PieChart
                    data={analyticsData.performance.revenue || []}
                    labelKey="label"
                    valueKey="value"
                    height={350}
                  />
                </ChartContainer>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Customer Analysis" key="customers">
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <ChartContainer
                  title="Top Customers by Revenue"
                  loading={loading}
                  height={400}
                >
                  <BarChart
                    data={analyticsData.distribution}
                    xAxisKey="label"
                    datasets={[
                      {
                        label: 'Revenue (GHS)',
                        key: 'value',
                        colors: '#1890ff'
                      }
                    ]}
                    height={400}
                    horizontal={true}
                  />
                </ChartContainer>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Forecasting" key="forecasting">
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Alert
                  message="Predictive Analytics"
                  description="These forecasts are based on historical trends and may not reflect actual future performance. Use for planning purposes only."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                <ChartContainer
                  title="7-Day Revenue Forecast"
                  loading={loading}
                  height={400}
                >
                  <LineChart
                    data={analyticsData.forecasts}
                    xAxisKey="date"
                    datasets={[
                      {
                        label: 'Forecasted Revenue (GHS)',
                        key: 'revenue',
                        color: '#722ed1'
                      },
                      {
                        label: 'Forecasted Jobs',
                        key: 'jobs',
                        color: '#52c41a'
                      }
                    ]}
                    height={400}
                  />
                </ChartContainer>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;
