import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Tabs, 
  Table, 
  Button, 
  Typography, 
  Tag, 
  Space,
  Statistic,
  Empty
} from 'antd';
import { 
  BarChartOutlined,
  PlusOutlined,
  DownloadOutlined,
  ShareAltOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabItems = [
    {
      key: 'overview',
      label: 'Report Overview',
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Shipment Volume">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chart placeholder</Text>
                  <br />
                  <Text>Monthly shipment volume trends</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Revenue Analysis">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chart placeholder</Text>
                  <br />
                  <Text>Revenue breakdown by service type</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Customer Satisfaction">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chart placeholder</Text>
                  <br />
                  <Text>Customer satisfaction ratings</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Performance Metrics">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chart placeholder</Text>
                  <br />
                  <Text>On-time delivery performance</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'generated',
      label: 'Generated Reports',
      children: (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
            >
              Generate New Report
            </Button>
          </div>
          <Table
            columns={[
              {
                title: 'Report Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
              },
              {
                title: 'Generated Date',
                dataIndex: 'date',
                key: 'date',
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                  <Tag color={status === 'Ready' ? 'success' : 'processing'}>
                    {status}
                  </Tag>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: () => (
                  <Space>
                    <Button size="small" icon={<DownloadOutlined />}>Download</Button>
                    <Button size="small" icon={<ShareAltOutlined />}>Share</Button>
                  </Space>
                ),
              },
            ]}
            dataSource={[]}
            pagination={false}
            size="small"
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: '14px', marginBottom: '4px' }}>
                        No reports generated yet
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Generate your first report to get started
                      </Text>
                    </div>
                  }
                >
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    size="small"
                  >
                    Generate Report
                  </Button>
                </Empty>
              )
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Reports & Analytics
      </Title>

      {/* Reports Statistics - will be replaced with API call */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Reports"
              value={0}
              suffix=""
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="This Month"
              value={0}
              suffix=""
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ready for Download"
              value={0}
              suffix=""
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Processing"
              value={0}
              suffix=""
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          defaultActiveKey="overview" 
          items={tabItems}
          onChange={setActiveTab}
        />
      </Card>
    </div>
  );
};

export default ReportsPage;
