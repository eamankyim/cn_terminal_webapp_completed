import React, { useState } from 'react';
import { 
  Input, 
  Button, 
  Card, 
  Row, 
  Col, 
  Progress, 
  Timeline, 
  Descriptions, 
  Tag, 
  Typography, 
  Space,
  message,
  Divider
} from 'antd';
import { SearchOutlined, CarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

const ShipmentTrackingPage = () => {
  const [trackingId, setTrackingId] = useState('');
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Shipment data - will be replaced with API call
  const mockShipment = null;

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      message.warning('Please enter a tracking ID');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, no mock data is returned
      setShipment(null);
      message.error('Tracking ID not found. Please check your tracking number.');
    } catch (error) {
      message.error('Failed to find shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Transit':
        return 'processing';
      case 'Delivered':
        return 'success';
      case 'Collection Pending':
        return 'error';
      case 'Out for Delivery':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Track Shipment
      </Title>

      {/* Search Section */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Enter tracking ID (e.g., CN001234)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onPressEnter={handleSearch}
              size="large"
            />
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              size="large"
              loading={loading}
              onClick={handleSearch}
            >
              Track
            </Button>
          </Col>
        </Row>
      </Card>

      {shipment && (
        <>
          {/* Status Overview */}
          <Card title="Shipment Status" style={{ marginBottom: '24px' }}>
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} md={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ marginBottom: '8px' }}>
                    {shipment.trackingId}
                  </Title>
                  <Tag color={getStatusColor(shipment.status)} size="large">
                    {shipment.status}
                  </Tag>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Progress</Text>
                  <br />
                  <Progress 
                    type="circle" 
                    percent={shipment.progress} 
                    size={80}
                    strokeColor={shipment.progress === 100 ? '#52c41a' : '#1890ff'}
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Estimated Delivery</Text>
                  <br />
                  <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                    {shipment.estimatedDelivery}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Timeline */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Shipment Timeline">
                <Timeline>
                  {shipment.timeline.map((item, index) => (
                    <Timeline.Item 
                      key={index} 
                      dot={item.icon}
                      color={item.status === 'completed' ? 'green' : item.status === 'in-progress' ? 'blue' : 'gray'}
                    >
                      <div>
                        <Text strong>{item.event}</Text>
                        <br />
                        <Text type="secondary">{item.location}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.time}
                        </Text>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            </Col>

            {/* Shipment Details */}
            <Col xs={24} lg={8}>
              <Card title="Shipment Details">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Customer">
                    {shipment.customer}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {shipment.customerPhone}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {shipment.customerEmail}
                  </Descriptions.Item>
                  <Descriptions.Item label="Package Type">
                    {shipment.packageType}
                  </Descriptions.Item>
                  <Descriptions.Item label="Weight">
                    {shipment.packageWeight}
                  </Descriptions.Item>
                  <Descriptions.Item label="Value">
                    {shipment.packageValue}
                  </Descriptions.Item>
                  <Descriptions.Item label="Service">
                    {shipment.serviceType}
                  </Descriptions.Item>
                  <Descriptions.Item label="Collection Date">
                    {shipment.collectionDate}
                  </Descriptions.Item>
                </Descriptions>

                <Divider />

                <div>
                  <Text strong>Collection Address:</Text>
                  <br />
                  <Text type="secondary">{shipment.collectionAddress}</Text>
                </div>

                <Divider />

                <div>
                  <Text strong>Delivery Address:</Text>
                  <br />
                  <Text type="secondary">{shipment.deliveryAddress}</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {!shipment && !loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <SearchOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Title level={4} type="secondary">
              Enter a tracking ID to get started
            </Title>
            <Text type="secondary">
              Track your shipment from collection to delivery
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ShipmentTrackingPage;
