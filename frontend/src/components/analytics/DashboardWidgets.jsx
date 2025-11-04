import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Typography,
  Space,
  Tooltip,
  Badge,
  List,
  Avatar
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import reportService from '../../services/reportService';

const { Title, Text } = Typography;

const DashboardWidgets = ({ dateRange }) => {
  const [widgetData, setWidgetData] = useState({
    kpis: {
      totalJobs: 0,
      completedJobs: 0,
      completionRate: 0,
      avgProcessingTime: 0,
      totalRevenue: 0,
      activeCustomers: 0
    },
    alerts: [],
    recentActivity: [],
    performanceMetrics: {
      dailyAverageJobs: 0,
      dailyAverageRevenue: 0,
      efficiency: 0,
      revenuePerJob: 0
    }
  });

  useEffect(() => {
    loadWidgetData();
  }, [dateRange]);

  const loadWidgetData = async () => {
    try {
      const [summaryStats, dailyActivity, jobStatus] = await Promise.all([
        reportService.getSummaryStats(dateRange[0], dateRange[1]),
        reportService.getDailyActivity(dateRange[0], dateRange[1]),
        reportService.getJobStatusSummary(dateRange[0], dateRange[1])
      ]);

      // Calculate KPIs
      const kpis = {
        totalJobs: summaryStats.totalJobs,
        completedJobs: summaryStats.completedJobs,
        completionRate: summaryStats.totalJobs > 0 ? (summaryStats.completedJobs / summaryStats.totalJobs) * 100 : 0,
        avgProcessingTime: summaryStats.avgProcessingTime,
        totalRevenue: summaryStats.totalRevenue,
        activeCustomers: summaryStats.activeCustomers
      };

      // Generate alerts
      const alerts = generateAlerts(summaryStats, dailyActivity, jobStatus);

      // Recent activity
      const recentActivity = generateRecentActivity(dailyActivity);

      // Performance metrics
      const performanceMetrics = calculatePerformanceMetrics(dailyActivity, jobStatus);

      setWidgetData({
        kpis,
        alerts,
        recentActivity,
        performanceMetrics
      });
    } catch (error) {

    }
  };

  const generateAlerts = (summaryStats, dailyActivity, jobStatus) => {
    const alerts = [];

    // Low completion rate alert
    if (summaryStats.totalJobs > 0 && (summaryStats.completedJobs / summaryStats.totalJobs) < 0.7) {
      alerts.push({
        type: 'warning',
        title: 'Low Completion Rate',
        message: `Completion rate is ${((summaryStats.completedJobs / summaryStats.totalJobs) * 100).toFixed(1)}%`,
        icon: <ExclamationCircleOutlined />
      });
    }

    // High processing time alert
    if (summaryStats.avgProcessingTime > 7) {
      alerts.push({
        type: 'error',
        title: 'High Processing Time',
        message: `Average processing time is ${summaryStats.avgProcessingTime} days`,
        icon: <ClockCircleOutlined />
      });
    }

    // Revenue drop alert
    if (dailyActivity.length >= 2) {
      const recent = dailyActivity[dailyActivity.length - 1];
      const previous = dailyActivity[dailyActivity.length - 2];
      if (recent.revenue < previous.revenue * 0.8) {
        alerts.push({
          type: 'warning',
          title: 'Revenue Drop',
          message: `Revenue dropped by ${((1 - recent.revenue / previous.revenue) * 100).toFixed(1)}%`,
          icon: <FallOutlined />
        });
      }
    }

    return alerts;
  };

  const generateRecentActivity = (dailyActivity) => {
    return dailyActivity.slice(-5).map(activity => ({
      date: dayjs(activity.date).format('MMM DD'),
      jobs: activity.newJobs,
      completed: activity.completedJobs,
      revenue: activity.revenue
    }));
  };

  const calculatePerformanceMetrics = (dailyActivity, jobStatus) => {
    const totalDays = dailyActivity.length;
    const totalJobs = dailyActivity.reduce((sum, day) => sum + day.newJobs, 0);
    const totalCompleted = dailyActivity.reduce((sum, day) => sum + day.completedJobs, 0);
    const totalRevenue = dailyActivity.reduce((sum, day) => sum + day.revenue, 0);

    return {
      dailyAverageJobs: totalDays > 0 ? (totalJobs / totalDays).toFixed(1) : 0,
      dailyAverageRevenue: totalDays > 0 ? (totalRevenue / totalDays).toFixed(0) : 0,
      efficiency: totalJobs > 0 ? ((totalCompleted / totalJobs) * 100).toFixed(1) : 0,
      revenuePerJob: totalJobs > 0 ? (totalRevenue / totalJobs).toFixed(0) : 0
    };
  };

  const getAlertColor = (type) => {
    const colors = {
      success: 'success',
      warning: 'warning',
      error: 'error',
      info: 'processing'
    };
    return colors[type] || 'default';
  };

  return (
    <div>
      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Jobs"
              value={widgetData.kpis.totalJobs}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress
              percent={widgetData.kpis.completionRate || 0}
              size="small"
              status={(widgetData.kpis.completionRate || 0) > 80 ? 'success' : (widgetData.kpis.completionRate || 0) > 60 ? 'normal' : 'exception'}
              style={{ marginTop: '8px' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {(widgetData.kpis.completionRate || 0).toFixed(1)}% completion rate
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Processing Time"
              value={widgetData.kpis.avgProcessingTime}
              prefix={<ClockCircleOutlined />}
              suffix="days"
              precision={1}
              valueStyle={{ 
                color: (widgetData.kpis.avgProcessingTime || 0) > 7 ? '#f5222d' : '#52c41a' 
              }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {(widgetData.kpis.avgProcessingTime || 0) > 7 ? 'Above target' : 'Within target'}
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={widgetData.kpis.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="GHS"
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ₵{widgetData.performanceMetrics.revenuePerJob || 0} per job
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Customers"
              value={widgetData.kpis.activeCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {widgetData.performanceMetrics.dailyAverageJobs || 0} jobs/day avg
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Alerts and Recent Activity */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="System Alerts" size="small">
            {widgetData.alerts.length > 0 ? (
              <List
                dataSource={widgetData.alerts}
                renderItem={(alert) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge status={getAlertColor(alert.type)}>
                          {alert.icon}
                        </Badge>
                      }
                      title={alert.title}
                      description={alert.message}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">No alerts at this time</Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" size="small">
            <List
              dataSource={widgetData.recentActivity}
              renderItem={(activity) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar size="small">{activity.date}</Avatar>}
                    title={`${activity.jobs} new jobs, ${activity.completed} completed`}
                    description={`₵${(activity.revenue || 0).toLocaleString()} revenue`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Daily Average Jobs"
              value={widgetData.performanceMetrics.dailyAverageJobs}
              suffix="jobs"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Daily Average Revenue"
              value={widgetData.performanceMetrics.dailyAverageRevenue}
              prefix="₵"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Efficiency Rate"
              value={widgetData.performanceMetrics.efficiency}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Revenue per Job"
              value={widgetData.performanceMetrics.revenuePerJob}
              prefix="₵"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardWidgets;
