import React, { useState } from 'react';
import apiService from '../services/api';
import { 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Row, 
  Col, 
  Descriptions, 
  Timeline,
  Spin,
  Empty,
  Result,
  Divider,
  message
} from 'antd';
import { 
  SearchOutlined, 
  UserOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined,
  InboxOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

const PublicTrackingPage = () => {
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Tracking data - will be replaced with API call
  const mockTrackingData = {};

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      message.warning('Please enter a Job ID');
      return;
    }
    
    setLoading(true);
    setSearched(true);
    
    try {
      const result = await apiService.trackPackage(trackingId.trim());
      setTrackingResult(result);
    } catch (error) {
      console.error('Tracking error:', error);
      setTrackingResult(null);
      message.error(error.message || 'Job ID not found');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'success';
      case 'In Transit':
        return 'processing';
      case 'Out for Delivery':
        return 'warning';
      case 'Pending':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          {/* Header with Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img 
              src="/cn_logo.png" 
              alt="CN Terminal" 
              style={{ 
                width: '120px', 
                height: 'auto',
                objectFit: 'contain',
                marginBottom: '16px'
              }} 
            />
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              Track Your Job
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
              Enter your Job ID to get real-time updates
            </Text>
          </div>

          {/* Search Section */}
          <Card style={{ marginBottom: '24px' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                size="large"
                placeholder="Enter Job ID (e.g., JOB001)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
              />
              <Button 
                type="primary" 
                size="large"
                onClick={handleSearch}
                loading={loading}
              >
                Track
              </Button>
            </Space.Compact>
          </Card>

          {/* Results Section */}
          {searched && (
            <Card>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px' }}>
                    <Text>Tracking your package...</Text>
                  </div>
                </div>
              ) : trackingResult ? (
                <div>
                  {/* Package Overview */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                      <Title level={3} style={{ margin: '8px 0 0' }}>
                        {trackingResult.trackingId}
                      </Title>
                      <Tag
                        color={getStatusColor(trackingResult.status)}
                        style={{ fontSize: '16px', padding: '8px 16px' }}
                      >
                        {trackingResult.status}
                      </Tag>
                    </div>
                  </div>

                  {/* Package Details */}
                  <Card size="small" title="Package Details" style={{ marginBottom: '24px' }}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Customer">
                            <Space>
                              <UserOutlined />
                              {trackingResult.customer}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Service">
                            <Tag color="blue">{trackingResult.service}</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Weight">
                            <Space>
                              <InboxOutlined />
                              {trackingResult.weight}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Declared Value">
                            {trackingResult.value}
                          </Descriptions.Item>
                        </Descriptions>
                      </Col>
                      <Col xs={24} md={12}>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Origin">
                            <Space>
                              <EnvironmentOutlined />
                              {trackingResult.origin}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Destination">
                            <Space>
                              <EnvironmentOutlined />
                              {trackingResult.destination}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Collection Date">
                            <Space>
                              <CalendarOutlined />
                              {trackingResult.collectionDate}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Estimated Delivery">
                            <Space>
                              <CalendarOutlined />
                              {trackingResult.estimatedDelivery}
                            </Space>
                          </Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                  </Card>

                  {/* Current Location */}
                  <Card size="small" title="Current Location" style={{ marginBottom: '24px' }}>
                    <Space>
                      <EnvironmentOutlined style={{ color: '#1890ff' }} />
                      <Text strong>{trackingResult.currentLocation}</Text>
                    </Space>
                  </Card>

                  {/* Tracking Timeline */}
                  <Card size="small" title="Tracking Timeline">
                    <Timeline
                      items={trackingResult.timeline.map((item, index) => ({
                        color: item.status === 'completed' ? 'green' : 'blue',
                        children: (
                          <div>
                            <Text strong>{item.event}</Text>
                            <br />
                            <Space>
                              <EnvironmentOutlined />
                              <Text type="secondary">{item.location}</Text>
                            </Space>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {item.time}
                            </Text>
                          </div>
                        ),
                      }))}
                    />
                  </Card>
                </div>
              ) : (
                <Empty
                  description="No tracking information found"
                  style={{ padding: '40px' }}
                />
              )}
            </Card>
          )}

          {/* Footer */}
          <Card style={{ marginTop: '24px', textAlign: 'center' }}>
            <Text type="secondary">
              Need help? Contact us at support@shipease.com or call +44 20 1234 5678
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PublicTrackingPage;
