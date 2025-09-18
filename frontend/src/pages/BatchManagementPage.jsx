import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Typography, 
  Tag, 
  Space,
  message,
  Progress,
  Badge,
  Drawer,
  Descriptions,
  Divider,
  Tabs,
  Transfer,
  Statistic
} from 'antd';
import { 
  PlusOutlined,
  CarOutlined,
  RocketOutlined,
  ContainerOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const BatchManagementPage = () => {
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('batches');

  // Available parcels - will be replaced with API call
  const availableParcels = [];

  // Existing batches - will be replaced with API call
  const existingBatches = [];

  // Vessel/flight options - will be replaced with API call
  const vesselOptions = [
    { value: 'MS Sea Express', label: 'MS Sea Express (Sea)', type: 'Sea' },
    { value: 'MS Atlantic Star', label: 'MS Atlantic Star (Sea)', type: 'Sea' },
    { value: 'BA Flight 123', label: 'BA Flight 123 (Air)', type: 'Air' },
    { value: 'AF Flight 456', label: 'AF Flight 456 (Air)', type: 'Air' }
  ];

  const batchColumns = [
    {
      title: 'Batch ID',
      dataIndex: 'batchId',
      key: 'batchId',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Batch Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let icon = null;
        
        switch (status) {
          case 'Ready for Departure':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'In Preparation':
            color = 'processing';
            icon = <ClockCircleOutlined />;
            break;
                   case 'At Airport':
           color = 'warning';
           icon = <RocketOutlined />;
           break;
                     case 'In Transit':
             color = 'blue';
             icon = <CarOutlined />;
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
      title: 'Parcels',
      dataIndex: 'totalParcels',
      key: 'totalParcels',
      render: (count) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} />,
    },
    {
      title: 'Total Weight',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
    },
    {
      title: 'Vessel/Flight',
      dataIndex: 'vessel',
      key: 'vessel',
                           render: (vessel) => (
          <Space>
            {vessel.includes('Flight') ? <RocketOutlined /> : <CarOutlined />}
            {vessel}
          </Space>
        ),
    },
    {
      title: 'Departure',
      dataIndex: 'departureDate',
      key: 'departureDate',
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => <Progress percent={progress} size="small" />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewBatch(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const parcelColumns = [
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
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => `£${value}`,
    },
    {
      title: 'Package Type',
      dataIndex: 'packageType',
      key: 'packageType',
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
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleAddToBatch(record)}
        >
          Add to Batch
        </Button>
      ),
    },
  ];

  const handleCreateBatch = () => {
    setSelectedBatch(null);
    batchForm.resetFields();
    setBatchModalVisible(true);
  };

  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
    setIsDetailsDrawerVisible(true);
  };

  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    batchForm.setFieldsValue(batch);
    setBatchModalVisible(true);
  };

  const handleAddToBatch = (parcel) => {
    message.info(`Adding ${parcel.trackingId} to batch...`);
  };

  const handleBatchSubmit = async (values) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (selectedBatch) {
        message.success('Batch updated successfully!');
      } else {
        message.success('Batch created successfully!');
      }
      setBatchModalVisible(false);
      batchForm.resetFields();
      setSelectedBatch(null);
    } catch (error) {
      message.error('Failed to save batch. Please try again.');
    }
  };

  const tabItems = [
    {
      key: 'batches',
      label: 'Batch Management',
      children: (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateBatch}
            >
              Create New Batch
            </Button>
          </div>
          <Table
            columns={batchColumns}
            dataSource={existingBatches}
            pagination={false}
            size="small"
          />
        </div>
      ),
    },
    {
      key: 'parcels',
      label: 'Available Parcels',
      children: (
        <div>
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Total Parcels"
                  value={availableParcels.length}
                  suffix=""
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Total Weight"
                  value={availableParcels.reduce((sum, p) => sum + parseFloat(p.weight), 0).toFixed(1)}
                  suffix=" kg"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Total Value"
                  value={availableParcels.reduce((sum, p) => sum + p.value, 0)}
                  suffix=" £"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="High Priority"
                  value={availableParcels.filter(p => p.priority === 'High').length}
                  suffix=""
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
          <Table
            columns={parcelColumns}
            dataSource={availableParcels}
            pagination={false}
            size="small"
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Batch Management
      </Title>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          defaultActiveKey="batches" 
          items={tabItems}
          onChange={setActiveTab}
        />
      </Card>

      {/* Create/Edit Batch Modal */}
      <Modal
        title={selectedBatch ? `Edit Batch - ${selectedBatch.batchId}` : 'Create New Batch'}
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchSubmit}
        >
          {/* Basic Information */}
          <Card size="small" title="Basic Information" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Batch Name"
                  rules={[{ required: true, message: 'Please enter batch name' }]}
                >
                  <Input placeholder="e.g., Accra Express Batch" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="route"
                  label="Route"
                  rules={[{ required: true, message: 'Please select route' }]}
                >
                  <Select placeholder="Select route">
                    <Option value="London → Accra">London → Accra</Option>
                    <Option value="London → Accra → Kumasi">London → Accra → Kumasi</Option>
                    <Option value="London → Accra → Tamale">London → Accra → Tamale</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Vessel/Flight Details */}
          <Card size="small" title="Vessel/Flight Details" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="vessel"
                  label="Vessel/Flight"
                  rules={[{ required: true, message: 'Please select vessel/flight' }]}
                >
                  <Select placeholder="Select vessel or flight">
                    {vesselOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        <Space>
                          {option.type === 'Air' ? <RocketOutlined /> : <CarOutlined />}
                          {option.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="departureDate"
                  label="Departure Date"
                  rules={[{ required: true, message: 'Please select departure date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="eta"
                  label="Estimated Time of Arrival"
                  rules={[{ required: true, message: 'Please select ETA' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="containerNumber"
                  label="Container Number (Optional)"
                >
                  <Input placeholder="e.g., CONT001234" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Batch Configuration */}
          <Card size="small" title="Batch Configuration" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="maxWeight"
                  label="Maximum Weight (kg)"
                  rules={[{ required: true, message: 'Please enter max weight' }]}
                >
                  <Input type="number" min={0} step={0.1} placeholder="e.g., 1000" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="maxParcels"
                  label="Maximum Parcels"
                  rules={[{ required: true, message: 'Please enter max parcels' }]}
                >
                  <Input type="number" min={1} placeholder="e.g., 50" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  name="notes"
                  label="Batch Notes"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="Any special instructions or notes for this batch"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button 
                onClick={() => setBatchModalVisible(false)}
                size="large"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                icon={<PlusOutlined />}
              >
                {selectedBatch ? 'Update Batch' : 'Create Batch'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Details Side Drawer */}
      <Drawer
        title="Batch Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={800}
        extra={[
          <Button 
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setIsDetailsDrawerVisible(false);
              handleEditBatch(selectedBatch);
            }}
          >
            Edit Batch
          </Button>,
        ]}
      >
        {selectedBatch && (
          <div>
            {/* Batch Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <ContainerOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                  <Title level={4} style={{ margin: '8px 0 0' }}>{selectedBatch.batchId}</Title>
                  <Text type="secondary">{selectedBatch.name}</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Status</Text>
                  <br />
                  <Tag color="processing" style={{ fontSize: '16px' }}>
                    {selectedBatch.status}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Progress</Text>
                  <br />
                  <Progress 
                    percent={selectedBatch.progress} 
                    size="small" 
                    style={{ marginTop: '8px' }}
                  />
                </div>
              </Col>
            </Row>
            <Divider />

            {/* Batch Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="Batch Information">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Total Parcels">
                      <Badge count={selectedBatch.totalParcels} style={{ backgroundColor: '#1890ff' }} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Weight">
                      <Text strong>{selectedBatch.totalWeight}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Value">
                      <Text strong>£{selectedBatch.totalValue}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Route">
                      {selectedBatch.route}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {/* Vessel/Flight Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="Transportation Details">
                  <Descriptions column={2} size="small">
                                                               <Descriptions.Item label="Vessel/Flight">
                        <Space>
                          {selectedBatch.vessel.includes('Flight') ? <RocketOutlined /> : <CarOutlined />}
                          {selectedBatch.vessel}
                        </Space>
                      </Descriptions.Item>
                    <Descriptions.Item label="Departure Date">
                      {selectedBatch.departureDate}
                    </Descriptions.Item>
                    <Descriptions.Item label="ETA">
                      {selectedBatch.eta}
                    </Descriptions.Item>
                    <Descriptions.Item label="Route">
                      {selectedBatch.route}
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

export default BatchManagementPage;
