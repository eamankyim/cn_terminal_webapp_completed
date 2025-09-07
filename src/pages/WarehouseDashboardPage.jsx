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
  Select, 
  DatePicker, 
  InputNumber, 
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
  HomeOutlined, 
  ScanOutlined, 
  PlusOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  UploadOutlined,
  EyeOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  BoxOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import CustomerSelector from '../components/common/CustomerSelector';
import { useCustomers } from '../contexts/CustomerContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const WarehouseDashboardPage = () => {
  const [intakeModalVisible, setIntakeModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [intakeForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  const { customers } = useCustomers();

  // Mock data for warehouse statistics
  const stats = [
    { title: 'Parcels Received Today', value: 45, suffix: '', color: '#1890ff' },
    { title: 'Pending Batching', value: 23, suffix: '', color: '#faad14' },
    { title: 'Batches Created', value: 8, suffix: '', color: '#52c41a' },
    { title: 'Total Weight', value: 67, suffix: ' kg', color: '#722ed1' },
  ];

  // Pending shipments - will be replaced with API call
  const pendingShipments = [];

  // Recent intake activities - will be replaced with API call
  const recentIntakeActivities = [];

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
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
    },
    {
      title: 'Dimensions',
      dataIndex: 'dimensions',
      key: 'dimensions',
    },
    {
      title: 'Received Time',
      dataIndex: 'receivedTime',
      key: 'receivedTime',
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="warning" icon={<ClockCircleOutlined />}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewParcel(record)}
        >
          View
        </Button>
      ),
    },
  ];

  const handleIntakeSubmit = async (values) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Parcel intake recorded successfully!');
      setIntakeModalVisible(false);
      intakeForm.resetFields();
    } catch (error) {
      message.error('Failed to record parcel intake. Please try again.');
    }
  };

  const handleCustomerSelect = (customerId, customer) => {
    // Auto-fill customer name when customer is selected
    intakeForm.setFieldsValue({
      customerName: customer.name
    });
  };

  const handleViewParcel = (parcel) => {
    setSelectedParcel(parcel);
    setIsDetailsDrawerVisible(true);
  };

  const handleBatchSubmit = async (values) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Shipment batch created successfully!');
      setBatchModalVisible(false);
      batchForm.resetFields();
    } catch (error) {
      message.error('Failed to create shipment batch. Please try again.');
    }
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Warehouse Dashboard
      </Title>

      {/* Warehouse Statistics */}
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

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Quick Actions">
            <Space wrap>
              <Button 
                type="primary" 
                icon={<ScanOutlined />}
                onClick={() => setIntakeModalVisible(true)}
                size="large"
              >
                Scan New Parcel
              </Button>
              <Button 
                icon={<PlusOutlined />}
                onClick={() => setBatchModalVisible(true)}
                size="large"
              >
                Create Shipment Batch
              </Button>
              <Button 
                icon={<UploadOutlined />}
                size="large"
              >
                Upload Manifest
              </Button>
              <Button 
                icon={<CheckCircleOutlined />}
                size="large"
              >
                Quality Check
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Pending Shipments for Batching */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Pending Shipments for Batching">
            <Table
              columns={columns}
              dataSource={pendingShipments}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Intake Activities and Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Intake Activities">
            <Timeline>
              {recentIntakeActivities.map((activity, index) => (
                <Timeline.Item 
                  key={index} 
                  dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                >
                  <div>
                    <Text strong>{activity.action}</Text>
                    <br />
                    <Text type="secondary">
                      {activity.customer && `${activity.customer} - ${activity.weight}`}
                      {activity.destination && `${activity.destination} - ${activity.vessel}`}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {activity.time}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Warehouse Status">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Storage Capacity:</Text>
                <br />
                <Text type="secondary">67 m³ / 100 m³ (67%)</Text>
              </div>
              <div>
                <Text strong>Temperature:</Text>
                <br />
                <Text type="secondary">22°C (Normal)</Text>
              </div>
              <div>
                <Text strong>Humidity:</Text>
                <br />
                <Text type="secondary">45% (Normal)</Text>
              </div>
              <div>
                <Text strong>Security Status:</Text>
                <br />
                <Tag color="success">Secure</Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Parcel Intake Modal */}
      <Modal
        title="Record Parcel Intake"
        open={intakeModalVisible}
        onCancel={() => setIntakeModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={intakeForm}
          layout="vertical"
          onFinish={handleIntakeSubmit}
        >
          <Form.Item
            name="trackingId"
            label="Tracking ID"
            rules={[{ required: true, message: 'Please enter tracking ID' }]}
          >
            <Input placeholder="Scan or enter tracking ID" />
          </Form.Item>

          <Form.Item
            name="customerId"
            label="Select Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <CustomerSelector
              onChange={handleCustomerSelect}
              placeholder="Search and select customer..."
            />
          </Form.Item>



          <Form.Item
            name="weight"
            label="Weight (kg)"
            rules={[{ required: true, message: 'Please enter weight' }]}
          >
            <InputNumber 
              min={0.1} 
              max={100} 
              step={0.1} 
              style={{ width: '100%' }}
              placeholder="Enter weight in kg"
            />
          </Form.Item>

          <Form.Item
            name="dimensions"
            label="Dimensions (L x W x H cm)"
          >
            <Input.Group compact>
              <Form.Item name="length" noStyle>
                <InputNumber placeholder="L" style={{ width: '33%' }} />
              </Form.Item>
              <Form.Item name="width" noStyle>
                <InputNumber placeholder="W" style={{ width: '33%' }} />
              </Form.Item>
              <Form.Item name="height" noStyle>
                <InputNumber placeholder="H" style={{ width: '33%' }} />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item
            name="condition"
            label="Parcel Condition"
            rules={[{ required: true, message: 'Please select condition' }]}
          >
            <Select placeholder="Select parcel condition">
              <Option value="excellent">Excellent</Option>
              <Option value="good">Good</Option>
              <Option value="fair">Fair</Option>
              <Option value="damaged">Damaged</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Intake Notes"
          >
            <TextArea 
              rows={3} 
              placeholder="Any notes about the parcel condition or special handling"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
              >
                Record Intake
              </Button>
              <Button 
                onClick={() => setIntakeModalVisible(false)}
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Shipment Batch Modal */}
      <Modal
        title="Create Shipment Batch"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchSubmit}
        >
          <Form.Item
            name="destination"
            label="Destination"
            rules={[{ required: true, message: 'Please select destination' }]}
          >
            <Select placeholder="Select destination">
              <Option value="accra">Accra, Ghana</Option>
              <Option value="kumasi">Kumasi, Ghana</Option>
              <Option value="tamale">Tamale, Ghana</Option>
              <Option value="cape-coast">Cape Coast, Ghana</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="vessel"
            label="Vessel/Flight Number"
            rules={[{ required: true, message: 'Please enter vessel/flight number' }]}
          >
            <Input placeholder="e.g., BA123 or Vessel Name" />
          </Form.Item>

          <Form.Item
            name="departureDate"
            label="Departure Date"
            rules={[{ required: true, message: 'Please select departure date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="estimatedArrival"
            label="Estimated Arrival"
            rules={[{ required: true, message: 'Please select estimated arrival' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="batchNotes"
            label="Batch Notes"
          >
            <TextArea 
              rows={3} 
              placeholder="Any special instructions for this batch"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
              >
                Create Batch
              </Button>
              <Button 
                onClick={() => setBatchModalVisible(false)}
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Parcel Details Side Drawer */}
      <Drawer
        title="Parcel Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={800}
      >
        {selectedParcel && (
          <div>
            {/* Parcel Status Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ marginBottom: '8px' }}>
                    {selectedParcel.trackingId}
                  </Title>
                  <Tag color="warning" size="large">
                    {selectedParcel.status}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Priority</Text>
                  <br />
                  <Tag color={selectedParcel.priority === 'High' ? 'error' : selectedParcel.priority === 'Medium' ? 'warning' : 'default'} size="large">
                    {selectedParcel.priority}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Weight</Text>
                  <br />
                  <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                    {selectedParcel.weight}
                  </Text>
                </div>
              </Col>
            </Row>
            <Divider />
            {/* Parcel Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="Parcel Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Customer">
                      <Space>
                        <UserOutlined />
                        {selectedParcel.customer}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Destination">
                      <Space>
                        <EnvironmentOutlined />
                        {selectedParcel.destination}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Weight">
                      <Space>
                        <InfoCircleOutlined />
                        {selectedParcel.weight}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Dimensions">
                      {selectedParcel.dimensions}
                    </Descriptions.Item>
                    <Descriptions.Item label="Received Time">
                      <Space>
                        <CalendarOutlined />
                        {selectedParcel.receivedTime}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Priority">
                      <Tag color={selectedParcel.priority === 'High' ? 'error' : selectedParcel.priority === 'Medium' ? 'warning' : 'default'}>
                        {selectedParcel.priority}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color="warning" icon={<ClockCircleOutlined />}>
                        {selectedParcel.status}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default WarehouseDashboardPage;
