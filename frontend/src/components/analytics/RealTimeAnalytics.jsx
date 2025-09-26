import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Switch,
  Tooltip,
  Badge,
  Progress
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  WifiOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import reportService from '../../services/reportService';
import LineChart from '../charts/LineChart';

const { Title, Text } = Typography;

const RealTimeAnalytics = ({ dateRange }) => {
  const [isLive, setIsLive] = useState(false);
  const [liveData, setLiveData] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isLive) {
      startLiveUpdates();
    } else {
      stopLiveUpdates();
    }

    return () => stopLiveUpdates();
  }, [isLive]);

  const startLiveUpdates = () => {
    // Initial data load
    loadLiveData();
    
    // Set up interval for live updates (every 30 seconds)
    intervalRef.current = setInterval(() => {
      loadLiveData();
    }, 30000);
  };

  const stopLiveUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const loadLiveData = async () => {
    try {
      const [summaryStats, dailyActivity] = await Promise.all([
        reportService.getSummaryStats(dateRange[0], dateRange[1]),
        reportService.getDailyActivity(dateRange[0], dateRange[1])
      ]);

      // Update current metrics
      setCurrentMetrics({
        totalJobs: summaryStats.totalJobs,
        completedJobs: summaryStats.completedJobs,
        totalRevenue: summaryStats.totalRevenue,
        activeCustomers: summaryStats.activeCustomers,
        completionRate: summaryStats.totalJobs > 0 ? (summaryStats.completedJobs / summaryStats.totalJobs) * 100 : 0
      });

      // Update live data for charts
      const newDataPoint = {
        timestamp: dayjs().format('HH:mm:ss'),
        time: dayjs().format('HH:mm'),
        jobs: summaryStats.totalJobs,
        completed: summaryStats.completedJobs,
        revenue: summaryStats.totalRevenue,
        customers: summaryStats.activeCustomers
      };

      setLiveData(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points
        return updated.slice(-20);
      });

      setLastUpdate(dayjs());
    } catch (error) {
      console.error('Error loading live data:', error);
    }
  };

  const getTrendIcon = (current, previous) => {
    if (current > previous) return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (current < previous) return <FallOutlined style={{ color: '#f5222d' }} />;
    return null;
  };

  const getTrendValue = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div>
      {/* Live Controls */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                Real-Time Analytics
              </Title>
              <Badge 
                status={isLive ? "processing" : "default"} 
                text={isLive ? "Live" : "Paused"}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Tooltip title={isLive ? "Pause live updates" : "Start live updates"}>
                <Switch
                  checked={isLive}
                  onChange={setIsLive}
                  checkedChildren={<PlayCircleOutlined />}
                  unCheckedChildren={<PauseCircleOutlined />}
                />
              </Tooltip>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadLiveData}
                loading={!isLive}
              >
                Refresh Now
              </Button>
              {lastUpdate && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Last update: {lastUpdate.format('HH:mm:ss')}
                </Text>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Live Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Jobs"
              value={currentMetrics.totalJobs}
              prefix={getTrendIcon(
                currentMetrics.totalJobs,
                liveData.length > 1 ? liveData[liveData.length - 2]?.jobs : 0
              )}
              valueStyle={{ color: '#1890ff' }}
            />
            {liveData.length > 1 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {getTrendValue(
                  currentMetrics.totalJobs,
                  liveData[liveData.length - 2]?.jobs || 0
                )}% change
              </Text>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed Jobs"
              value={currentMetrics.completedJobs}
              prefix={getTrendIcon(
                currentMetrics.completedJobs,
                liveData.length > 1 ? liveData[liveData.length - 2]?.completed : 0
              )}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={currentMetrics.completionRate}
              size="small"
              status={currentMetrics.completionRate > 80 ? 'success' : 'normal'}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={currentMetrics.totalRevenue}
              prefix={getTrendIcon(
                currentMetrics.totalRevenue,
                liveData.length > 1 ? liveData[liveData.length - 2]?.revenue : 0
              )}
              suffix="GHS"
              valueStyle={{ color: '#722ed1' }}
            />
            {liveData.length > 1 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {getTrendValue(
                  currentMetrics.totalRevenue,
                  liveData[liveData.length - 2]?.revenue || 0
                )}% change
              </Text>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Customers"
              value={currentMetrics.activeCustomers}
              prefix={getTrendIcon(
                currentMetrics.activeCustomers,
                liveData.length > 1 ? liveData[liveData.length - 2]?.customers : 0
              )}
              valueStyle={{ color: '#fa8c16' }}
            />
            {liveData.length > 1 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {getTrendValue(
                  currentMetrics.activeCustomers,
                  liveData[liveData.length - 2]?.customers || 0
                )}% change
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Live Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Live Job Metrics" size="small">
            {liveData.length > 0 ? (
              <LineChart
                data={liveData}
                xAxisKey="time"
                datasets={[
                  {
                    label: 'Total Jobs',
                    key: 'jobs',
                    color: '#1890ff'
                  },
                  {
                    label: 'Completed Jobs',
                    key: 'completed',
                    color: '#52c41a'
                  }
                ]}
                height={250}
                showLegend={true}
              />
            ) : (
              <div style={{ 
                height: '250px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#999'
              }}>
                {isLive ? 'Waiting for data...' : 'Start live updates to see data'}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Live Revenue & Customers" size="small">
            {liveData.length > 0 ? (
              <LineChart
                data={liveData}
                xAxisKey="time"
                datasets={[
                  {
                    label: 'Revenue (GHS)',
                    key: 'revenue',
                    color: '#722ed1'
                  },
                  {
                    label: 'Active Customers',
                    key: 'customers',
                    color: '#fa8c16'
                  }
                ]}
                height={250}
                showLegend={true}
              />
            ) : (
              <div style={{ 
                height: '250px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#999'
              }}>
                {isLive ? 'Waiting for data...' : 'Start live updates to see data'}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Live Status */}
      <Card style={{ marginTop: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <WifiOutlined style={{ color: isLive ? '#52c41a' : '#999' }} />
              <Text type={isLive ? 'success' : 'secondary'}>
                {isLive ? 'Connected to live data stream' : 'Live updates paused'}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <ClockCircleOutlined />
              <Text type="secondary">
                Updates every 30 seconds
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RealTimeAnalytics;
