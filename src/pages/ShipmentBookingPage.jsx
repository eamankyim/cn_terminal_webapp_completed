import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Row, 
  Col, 
  Select, 
  DatePicker, 
  InputNumber, 
  Switch, 
  Upload, 
  Typography, 
  Divider,
  message,
  Space
} from 'antd';
import { 
  UploadOutlined, 
  PlusOutlined, 
  MinusCircleOutlined,
  SaveOutlined,
  CalculatorOutlined
} from '@ant-design/icons';
import CustomerSelector from '../components/common/CustomerSelector';
import { useCustomers } from '../contexts/CustomerContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ShipmentBookingPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [costEstimate, setCostEstimate] = useState(null);
  const { customers } = useCustomers();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Shipment booked successfully!');
      form.resetFields();
      setCostEstimate(null);
    } catch (error) {
      message.error('Failed to book shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    const weight = form.getFieldValue('packageWeight') || 0;
    const service = form.getFieldValue('serviceType') || 'standard';
    
    let baseCost = 50; // Base cost in GBP
    let weightCost = weight * 2; // £2 per kg
    
    let serviceMultiplier = 1;
    switch (service) {
      case 'express':
        serviceMultiplier = 1.5;
        break;
      case 'premium':
        serviceMultiplier = 2;
        break;
      default:
        serviceMultiplier = 1;
    }
    
    const totalCost = (baseCost + weightCost) * serviceMultiplier;
    setCostEstimate({
      baseCost,
      weightCost,
      serviceMultiplier,
      totalCost: Math.round(totalCost * 100) / 100
    });
  };

  const handleCustomerSelect = (customerId, customer) => {
    // Auto-fill customer details when customer is selected
    form.setFieldsValue({
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address
    });
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Book New Shipment
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          fragile: false,
          serviceType: 'standard'
        }}
      >
        {/* Customer Information */}
        <Card title="Customer Information" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} md={24}>
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
            </Col>
          </Row>

        </Card>

        {/* Collection Details */}
        <Card title="Collection Details" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="collectionAddress"
                label="Collection Address"
                rules={[{ required: true, message: 'Please enter collection address' }]}
              >
                <TextArea rows={2} placeholder="Enter collection address" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="collectionDate"
                label="Preferred Collection Date"
                rules={[{ required: true, message: 'Please select collection date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="collectionTime"
                label="Preferred Collection Time"
                rules={[{ required: true, message: 'Please select collection time' }]}
              >
                <Select placeholder="Select collection time">
                  <Option value="morning">Morning (9 AM - 12 PM)</Option>
                  <Option value="afternoon">Afternoon (12 PM - 3 PM)</Option>
                  <Option value="evening">Evening (3 PM - 6 PM)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="collectionInstructions"
                label="Collection Instructions"
              >
                <TextArea rows={2} placeholder="Any special instructions for collection" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Delivery Details */}
        <Card title="Delivery Details" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="deliveryAddress"
                label="Delivery Address"
                rules={[{ required: true, message: 'Please enter delivery address' }]}
              >
                <TextArea rows={2} placeholder="Enter delivery address in Ghana" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="deliveryCity"
                label="City"
                rules={[{ required: true, message: 'Please select city' }]}
              >
                <Select placeholder="Select delivery city">
                  <Option value="accra">Accra</Option>
                  <Option value="kumasi">Kumasi</Option>
                  <Option value="tamale">Tamale</Option>
                  <Option value="cape-coast">Cape Coast</Option>
                  <Option value="sekondi-takoradi">Sekondi-Takoradi</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="recipientName"
                label="Recipient Name"
                rules={[{ required: true, message: 'Please enter recipient name' }]}
              >
                <Input placeholder="Enter recipient name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="recipientPhone"
                label="Recipient Phone"
                rules={[{ required: true, message: 'Please enter recipient phone' }]}
              >
                <Input placeholder="Enter recipient phone" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Package Details */}
        <Card title="Package Details" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="packageType"
                label="Package Type"
                rules={[{ required: true, message: 'Please select package type' }]}
              >
                <Select placeholder="Select package type">
                  <Option value="box">Box</Option>
                  <Option value="envelope">Envelope</Option>
                  <Option value="bag">Bag</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="packageWeight"
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
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="packageValue"
                label="Declared Value (£)"
                rules={[{ required: true, message: 'Please enter declared value' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Enter value in GBP"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="packageDescription"
                label="Package Description"
                rules={[{ required: true, message: 'Please describe the package contents' }]}
              >
                <TextArea rows={3} placeholder="Describe what is inside the package" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
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
                name="fragile"
                label="Fragile Item"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Service Options */}
        <Card title="Service Options" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="serviceType"
                label="Service Type"
                rules={[{ required: true, message: 'Please select service type' }]}
              >
                <Select placeholder="Select service type">
                  <Option value="standard">Standard (7-10 days)</Option>
                  <Option value="express">Express (3-5 days)</Option>
                  <Option value="premium">Premium (1-2 days)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="insurance"
                label="Insurance"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="signatureRequired"
                label="Signature Required"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="specialInstructions"
                label="Special Instructions"
              >
                <TextArea rows={2} placeholder="Any special handling instructions" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Space>
                <Button 
                  icon={<CalculatorOutlined />} 
                  onClick={calculateCost}
                  type="dashed"
                >
                  Calculate Cost
                </Button>
                {costEstimate && (
                  <Text strong style={{ color: '#1890ff' }}>
                    Estimated Cost: £{costEstimate.totalCost}
                  </Text>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Documents */}
        <Card title="Documents (Optional)" style={{ marginBottom: '24px' }}>
          <Form.Item
            name="documents"
            label="Upload Documents"
          >
            <Upload
              listType="text"
              maxCount={5}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Upload Files</Button>
            </Upload>
          </Form.Item>
          <Text type="secondary">
            Upload any relevant documents like invoices, packing lists, or customs forms
          </Text>
        </Card>

        {/* Submit */}
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
            style={{ width: '200px' }}
          >
            Book Shipment
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ShipmentBookingPage;
