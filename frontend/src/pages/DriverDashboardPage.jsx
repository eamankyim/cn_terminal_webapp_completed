import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Upload, 
  Typography, 
  Tag, 
  Space,
  message,
  Timeline,
  Drawer,
  Descriptions,
  Divider,
  Progress,
  Tabs
} from 'antd';
import { 
  CarOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  UploadOutlined,
  SignatureOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined as ClockIcon
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DriverDashboardPage = () => {
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form] = Form.useForm();

  // Driver statistics - will be replaced with API call
  const stats = [
    { title: 'Collections Today', value: 0, suffix: '', color: '#1890ff' },
    { title: 'Completed', value: 0, suffix: '', color: '#52c41a' },
    { title: 'Pending', value: 0, suffix: '', color: '#faad14' },
    { title: 'Total Weight', value: 0, suffix: ' kg', color: '#722ed1' },
  ];

  // Assigned collection jobs - will be replaced with API call
  const assignedJobs = [];

  // Recent collections - will be replaced with API call
  const recentCollections = [];
 

  // Helper functions for colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'processing';
      case 'Completed':
        return 'success';
      case 'Pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Scheduled Time',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let icon = null;
        
        switch (status) {
          case 'Completed':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'In Progress':
            color = 'processing';
            icon = <ClockCircleOutlined />;
            break;
          case 'Pending':
            color = 'warning';
            icon = <ClockCircleOutlined />;
            break;
          default:
            color = 'default';
        }
        
        return (
          <Tag color={color} icon={icon}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        let color = 'default';
        switch (priority) {
          case 'High':
            color = 'error';
            break;
          case 'Medium':
            color = 'warning';
            break;
          case 'Low':
            color = 'default';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewJob(record)}
        >
          View
        </Button>
      ),
    },
  ];

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setIsDetailsDrawerVisible(true);
  };

  const handleCompleteCollection = (job) => {
    setSelectedJob(job);
    setCompletionModalVisible(true);
  };

  const handleCompletionSubmit = async (values) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Collection completed successfully!');
      setCompletionModalVisible(false);
      form.resetFields();
      setSelectedJob(null);
    } catch (error) {
      message.error('Failed to complete collection. Please try again.');
    }
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Driver Dashboard
      </Title>

      {/* Driver Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Assigned Collection Jobs */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Assigned Collection Jobs">
            <Table
              columns={columns}
              dataSource={assignedJobs}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Collections */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Recent Collections">
            <Timeline>
              {recentCollections.map((collection, index) => (
                <Timeline.Item 
                  key={index} 
                  dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                >
                  <div>
                    <Text strong>{collection.action}</Text>
                    <br />
                    <Text type="secondary">{collection.customer} - {collection.location}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {collection.time}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Collection Completion Modal */}
      <Modal
        title={`Complete Collection - ${selectedJob?.trackingId}`}
        open={completionModalVisible}
        onCancel={() => setCompletionModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCompletionSubmit}
        >
          {/* Collection Proof Section */}
          <Card size="small" title="Collection Proof" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="collectionPhotos"
                  label="Collection Photos"
                  rules={[{ required: true, message: 'Please upload at least one photo' }]}
                >
                  <Upload
                    listType="picture-card"
                    maxCount={5}
                    beforeUpload={() => false}
                    accept="image/*"
                  >
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload Photos</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customerSignature"
                  label="Customer Signature"
                  rules={[{ required: true, message: 'Please capture customer signature' }]}
                >
                  <div style={{ 
                    border: '1px dashed #d9d9d9', 
                    borderRadius: '6px', 
                    padding: '20px', 
                    textAlign: 'center',
                    background: '#fafafa'
                  }}>
                    <SignatureOutlined style={{ fontSize: '24px', color: '#999' }} />
                    <div style={{ marginTop: 8, color: '#999' }}>
                      Signature capture will be implemented
                    </div>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Collection Details Section */}
          <Card size="small" title="Collection Details" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="collectionTime"
                  label="Actual Collection Time"
                  rules={[{ required: true, message: 'Please enter collection time' }]}
                >
                  <Input placeholder="e.g., 14:30" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="packageCondition"
                  label="Package Condition"
                  rules={[{ required: true, message: 'Please select package condition' }]}
                >
                  <Input placeholder="e.g., Good, Damaged, etc." />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  name="collectionNotes"
                  label="Collection Notes"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="Any additional notes about the collection, customer interaction, or package condition"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Confirmation Section */}
          <Card size="small" title="Confirmation" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="customerName"
                  label="Customer Name Confirmed"
                  rules={[{ required: true, message: 'Please confirm customer name' }]}
                >
                  <Input 
                    placeholder="Customer name" 
                    defaultValue={selectedJob?.customer}
                    disabled
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="packageCount"
                  label="Package Count"
                  rules={[{ required: true, message: 'Please enter package count' }]}
                >
                  <Input placeholder="e.g., 2 boxes, 1 envelope" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button 
                onClick={() => setCompletionModalVisible(false)}
                size="large"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                icon={<CheckCircleOutlined />}
              >
                Confirm Collection
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Job Details Side Drawer */}
      <Drawer
        title="Collection Job Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={800}
        extra={[
          <Button 
            key="complete"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleCompleteCollection(selectedJob)}
            disabled={selectedJob?.status === 'Completed'}
          >
            Complete Collection
          </Button>,
        ]}
      >
        {selectedJob && (
          <div>
            {/* Job Status Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ marginBottom: '8px' }}>
                    {selectedJob.trackingId}
                  </Title>
                  <Tag color={getStatusColor(selectedJob.status)} size="large">
                    {selectedJob.status}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Progress</Text>
                  <br />
                  <Progress 
                    type="circle" 
                    percent={selectedJob.progress} 
                    size={80}
                    strokeColor={selectedJob.progress === 100 ? '#52c41a' : '#1890ff'}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Scheduled Time</Text>
                  <br />
                  <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                    {selectedJob.scheduledTime}
                  </Text>
                </div>
              </Col>
            </Row>

            <Divider />

            {/* Tabs for Timeline, Activities, and Details */}
            <Tabs
              defaultActiveKey="timeline"
              items={[
                {
                  key: 'timeline',
                  label: 'Timeline',
                  children: (
                    <Card title="Collection Timeline" size="small">
                      <Timeline>
                        {selectedJob.timeline.map((item, index) => (
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
                  ),
                },
                {
                  key: 'activities',
                  label: 'Activities',
                  children: (
                    <Card title="User Activities" size="small">
                      <Timeline>
                        {selectedJob.activities.map((activity, index) => (
                          <Timeline.Item 
                            key={index}
                            dot={<UserOutlined style={{ color: '#1890ff' }} />}
                          >
                            <div>
                              <Text strong>{activity.user}</Text>
                              <Text> {activity.action}</Text>
                              <br />
                              <Text type="secondary">{activity.details}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {activity.time}
                              </Text>
                            </div>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </Card>
                  ),
                },
                {
                  key: 'details',
                  label: 'Details',
                  children: (
                    <div>
                      {/* Customer Information */}
                      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col span={24}>
                          <Card size="small" title="Customer Information">
                            <Descriptions column={1} size="small">
                              <Descriptions.Item label="Name">
                                <Space>
                                  <UserOutlined />
                                  {selectedJob.customer}
                                </Space>
                              </Descriptions.Item>
                              <Descriptions.Item label="Email">
                                {selectedJob.customerEmail}
                              </Descriptions.Item>
                              <Descriptions.Item label="Phone">
                                {selectedJob.customerPhone}
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        </Col>
                      </Row>

                      {/* Package Details */}
                      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col span={24}>
                          <Card size="small" title="Package Details">
                            <Descriptions column={1} size="small">
                              <Descriptions.Item label="Type">
                                {selectedJob.packageType}
                              </Descriptions.Item>
                              <Descriptions.Item label="Weight">
                                {selectedJob.weight}
                              </Descriptions.Item>
                              <Descriptions.Item label="Value">
                                <Space>
                                  <Text>£{selectedJob.value.toLocaleString()}</Text>
                                </Space>
                              </Descriptions.Item>
                              <Descriptions.Item label="Priority">
                                <Tag color={getPriorityColor(selectedJob.priority)}>
                                  {selectedJob.priority}
                                </Tag>
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        </Col>
                      </Row>

                      {/* Collection Information */}
                      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col span={24}>
                          <Card size="small" title="Collection Information">
                            <Descriptions column={1} size="small">
                              <Descriptions.Item label="Address">
                                <Space>
                                  <EnvironmentOutlined />
                                  {selectedJob.address}
                                </Space>
                              </Descriptions.Item>
                              <Descriptions.Item label="Scheduled Time">
                                <Space>
                                  <ClockIcon />
                                  {selectedJob.scheduledTime}
                                </Space>
                              </Descriptions.Item>
                              <Descriptions.Item label="Instructions">
                                {selectedJob.instructions}
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DriverDashboardPage;
