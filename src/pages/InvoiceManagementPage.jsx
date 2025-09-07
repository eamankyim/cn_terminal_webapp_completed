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
  Badge,
  Drawer,
  Descriptions,
  Divider,
  Tabs,
  Statistic,
  InputNumber,
  Switch
} from 'antd';
import { 
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import CustomerSelector from '../components/common/CustomerSelector';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const InvoiceManagementPage = () => {
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('invoices');

  // Mock customers data - in real implementation, this would come from API/state management
  const customers = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+233 24 123 4567',
      address: '123 Main Street, Accra, Ghana',
      customerType: 'Regular'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+233 26 987 6543',
      address: '456 Oak Avenue, Kumasi, Ghana',
      customerType: 'Premium'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      phone: '+233 20 555 1234',
      address: '789 Pine Road, Tema, Ghana',
      customerType: 'VIP'
    }
  ];

  // Mock data for pricing structure
  const pricingStructure = {
    standard: { base: 50, perKg: 2, days: '7-10' },
    express: { base: 75, perKg: 3, days: '3-5' },
    premium: { base: 100, perKg: 4, days: '1-2' }
  };

  // Mock data for available shipments
  const availableShipments = [
    {
      key: '1',
      trackingId: 'CN001234',
      customer: 'John Smith',
      customerEmail: 'john.smith@email.com',
      weight: '2.5 kg',
      value: 1500,
      service: 'Standard',
      status: 'At UK Warehouse',
      destination: 'Accra, Ghana',
      collectionDate: '2024-01-20',
      invoiceGenerated: false
    },
    {
      key: '2',
      trackingId: 'CN001235',
      customer: 'Sarah Johnson',
      customerEmail: 'sarah.johnson@email.com',
      weight: '0.5 kg',
      value: 800,
      service: 'Express',
      status: 'At UK Warehouse',
      destination: 'Kumasi, Ghana',
      collectionDate: '2024-01-20',
      invoiceGenerated: false
    },
    {
      key: '3',
      trackingId: 'CN001236',
      customer: 'Mike Wilson',
      customerEmail: 'mike.wilson@email.com',
      weight: '1.8 kg',
      value: 1200,
      service: 'Standard',
      status: 'At UK Warehouse',
      destination: 'Accra, Ghana',
      collectionDate: '2024-01-19',
      invoiceGenerated: false
    },
    {
      key: '4',
      trackingId: 'CN001237',
      customer: 'Lisa Brown',
      customerEmail: 'lisa.brown@email.com',
      weight: '3.2 kg',
      value: 2000,
      service: 'Premium',
      status: 'At UK Warehouse',
      destination: 'Tamale, Ghana',
      collectionDate: '2024-01-19',
      invoiceGenerated: false
    }
  ];

  // Mock data for existing invoices
  const existingInvoices = [
    {
      key: '1',
      invoiceNumber: 'INV001234',
      trackingId: 'CN001230',
      customer: 'Emma Davis',
      customerEmail: 'emma.davis@email.com',
      amount: 58.50,
      service: 'Standard',
      status: 'Paid',
      issueDate: '2024-01-18',
      dueDate: '2024-01-25',
      paymentDate: '2024-01-20',
      paymentMethod: 'Bank Transfer'
    },
    {
      key: '2',
      invoiceNumber: 'INV001235',
      trackingId: 'CN001231',
      customer: 'David Lee',
      customerEmail: 'david.lee@email.com',
      amount: 81.00,
      service: 'Express',
      status: 'Pending',
      issueDate: '2024-01-19',
      dueDate: '2024-01-26',
      paymentDate: null,
      paymentMethod: null
    },
    {
      key: '3',
      invoiceNumber: 'INV001236',
      trackingId: 'CN001232',
      customer: 'Anna Wilson',
      customerEmail: 'anna.wilson@email.com',
      amount: 112.00,
      service: 'Premium',
      status: 'Overdue',
      issueDate: '2024-01-17',
      dueDate: '2024-01-24',
      paymentDate: null,
      paymentMethod: null
    }
  ];

  const invoiceColumns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>£{amount.toFixed(2)}</Text>,
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (service) => {
        let color = 'default';
        switch (service) {
          case 'Premium':
            color = 'purple';
            break;
          case 'Express':
            color = 'orange';
            break;
          case 'Standard':
            color = 'blue';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{service}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let icon = null;
        
        switch (status) {
          case 'Paid':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'Pending':
            color = 'processing';
            icon = <ClockCircleOutlined />;
            break;
          case 'Overdue':
            color = 'error';
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
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewInvoice(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const shipmentColumns = [
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
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (service) => {
        let color = 'default';
        switch (service) {
          case 'Premium':
            color = 'purple';
            break;
          case 'Express':
            color = 'orange';
            break;
          case 'Standard':
            color = 'blue';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{service}</Tag>;
      },
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: 'Collection Date',
      dataIndex: 'collectionDate',
      key: 'collectionDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleGenerateInvoice(record)}
          disabled={record.invoiceGenerated}
        >
          Generate Invoice
        </Button>
      ),
    },
  ];

  const handleGenerateInvoice = (shipment) => {
    setSelectedInvoice(shipment);
    invoiceForm.setFieldsValue({
      trackingId: shipment.trackingId,
      customer: shipment.customer,
      customerEmail: shipment.customerEmail,
      weight: parseFloat(shipment.weight),
      value: shipment.value,
      service: shipment.service,
      destination: shipment.destination
    });
    setInvoiceModalVisible(true);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsDrawerVisible(true);
  };

  const handleDownloadInvoice = (invoice) => {
    message.info(`Downloading invoice ${invoice.invoiceNumber}...`);
  };

  const handleResendInvoice = (invoice) => {
    message.success(`Invoice ${invoice.invoiceNumber} resent successfully!`);
  };

  const calculateShippingCost = (weight, service) => {
    const pricing = pricingStructure[service.toLowerCase()];
    if (!pricing) return 0;
    
    return pricing.base + (weight * pricing.perKg);
  };

  const handleInvoiceSubmit = async (values) => {
    try {
      const shippingCost = calculateShippingCost(values.weight, values.service);
      const totalAmount = shippingCost + (values.value * 0.01); // 1% insurance on declared value
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success(`Invoice generated successfully! Total amount: £${totalAmount.toFixed(2)}`);
      setInvoiceModalVisible(false);
      invoiceForm.resetFields();
      setSelectedInvoice(null);
    } catch (error) {
      message.error('Failed to generate invoice. Please try again.');
    }
  };

  const tabItems = [
    {
      key: 'invoices',
      label: 'Invoice Management',
      children: (
        <div>
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Total Invoices"
                  value={existingInvoices.length}
                  suffix=""
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Paid"
                  value={existingInvoices.filter(inv => inv.status === 'Paid').length}
                  suffix=""
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Pending"
                  value={existingInvoices.filter(inv => inv.status === 'Pending').length}
                  suffix=""
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Overdue"
                  value={existingInvoices.filter(inv => inv.status === 'Overdue').length}
                  suffix=""
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
            </Row>
          </Card>
          <Table
            columns={invoiceColumns}
            dataSource={existingInvoices}
            pagination={false}
            size="small"
          />
        </div>
      ),
    },
    {
      key: 'shipments',
      label: 'Available Shipments',
      children: (
        <div>
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Available for Invoice"
                  value={availableShipments.filter(s => !s.invoiceGenerated).length}
                  suffix=""
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Total Weight"
                  value={availableShipments.reduce((sum, s) => sum + parseFloat(s.weight), 0).toFixed(1)}
                  suffix=" kg"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Total Value"
                  value={availableShipments.reduce((sum, s) => sum + s.value, 0)}
                  suffix=" £"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="Premium Service"
                  value={availableShipments.filter(s => s.service === 'Premium').length}
                  suffix=""
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
          <Table
            columns={shipmentColumns}
            dataSource={availableShipments.filter(s => !s.invoiceGenerated)}
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
        Invoice Management
      </Title>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          defaultActiveKey="invoices" 
          items={tabItems}
          onChange={setActiveTab}
        />
      </Card>

      {/* Generate Invoice Modal */}
      <Modal
        title={`Generate Invoice - ${selectedInvoice?.trackingId}`}
        open={invoiceModalVisible}
        onCancel={() => setInvoiceModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={invoiceForm}
          layout="vertical"
          onFinish={handleInvoiceSubmit}
        >
          {/* Shipment Information */}
          <Card size="small" title="Shipment Information" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="trackingId"
                  label="Tracking ID"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customer"
                  label="Customer Name"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="customerEmail"
                  label="Customer Email"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="destination"
                  label="Destination"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Package Details */}
          <Card size="small" title="Package Details" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item
                  name="weight"
                  label="Weight (kg)"
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0} 
                    step={0.1} 
                    disabled 
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="value"
                  label="Declared Value (£)"
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0} 
                    disabled 
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="service"
                  label="Service Type"
                >
                  <Select disabled>
                    <Option value="Standard">Standard</Option>
                    <Option value="Express">Express</Option>
                    <Option value="Premium">Premium</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Cost Calculation */}
          <Card size="small" title="Cost Calculation" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="shippingBase"
                  label="Shipping Base Cost"
                >
                  <Input 
                    addonBefore="£"
                    value={pricingStructure[selectedInvoice?.service?.toLowerCase()]?.base || 0}
                    disabled
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shippingPerKg"
                  label="Shipping Per KG"
                >
                  <Input 
                    addonBefore="£"
                    value={pricingStructure[selectedInvoice?.service?.toLowerCase()]?.perKg || 0}
                    disabled
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="insuranceFee"
                  label="Insurance Fee (1% of value)"
                >
                  <Input 
                    addonBefore="£"
                    value={((selectedInvoice?.value || 0) * 0.01).toFixed(2)}
                    disabled
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="totalAmount"
                  label="Total Amount"
                >
                  <Input 
                    addonBefore="£"
                    value={calculateShippingCost(selectedInvoice?.weight || 0, selectedInvoice?.service || 'Standard') + ((selectedInvoice?.value || 0) * 0.01)}
                    disabled
                    style={{ fontWeight: 'bold', color: '#1890ff' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Invoice Settings */}
          <Card size="small" title="Invoice Settings" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="issueDate"
                  label="Issue Date"
                  rules={[{ required: true, message: 'Please select issue date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dueDate"
                  label="Due Date"
                  rules={[{ required: true, message: 'Please select due date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  name="notes"
                  label="Invoice Notes"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="Any additional notes for the customer"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  name="autoSend"
                  label="Auto-send to customer"
                  valuePropName="checked"
                >
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button 
                onClick={() => setInvoiceModalVisible(false)}
                size="large"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                icon={<FileTextOutlined />}
              >
                Generate Invoice
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Invoice Details Side Drawer */}
      <Drawer
        title="Invoice Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={800}
        extra={[
          <Button 
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadInvoice(selectedInvoice)}
          >
            Download
          </Button>,
          ...(selectedInvoice?.status === 'Pending' ? [
            <Button 
              key="resend"
              icon={<SendOutlined />}
              onClick={() => handleResendInvoice(selectedInvoice)}
            >
              Resend
            </Button>
          ] : []),
          <Button 
            key="print"
            icon={<PrinterOutlined />}
            onClick={() => message.info('Print functionality will be implemented')}
          >
            Print
          </Button>,
        ]}
      >
        {selectedInvoice && (
          <div>
            {/* Invoice Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                  <Title level={4} style={{ margin: '8px 0 0' }}>{selectedInvoice.invoiceNumber}</Title>
                  <Text type="secondary">Invoice</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Status</Text>
                  <br />
                  <Tag color="processing" style={{ fontSize: '16px' }}>
                    {selectedInvoice.status}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Amount</Text>
                  <br />
                  <Text style={{ fontSize: '24px', color: '#1890ff', fontWeight: 'bold' }}>
                    £{selectedInvoice.amount.toFixed(2)}
                  </Text>
                </div>
              </Col>
            </Row>
            <Divider />

            {/* Invoice Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="Invoice Information">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Tracking ID">
                      {selectedInvoice.trackingId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer">
                      {selectedInvoice.customer}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer Email">
                      {selectedInvoice.customerEmail}
                    </Descriptions.Item>
                    <Descriptions.Item label="Service">
                      <Tag color="blue">{selectedInvoice.service}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Issue Date">
                      {selectedInvoice.issueDate}
                    </Descriptions.Item>
                    <Descriptions.Item label="Due Date">
                      {selectedInvoice.dueDate}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {/* Payment Information */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="Payment Information">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Payment Status">
                      <Tag color={selectedInvoice.status === 'Paid' ? 'success' : 'processing'}>
                        {selectedInvoice.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Method">
                      {selectedInvoice.paymentMethod || 'Not specified'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Date">
                      {selectedInvoice.paymentDate || 'Not paid'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Amount">
                      <Text strong>£{selectedInvoice.amount.toFixed(2)}</Text>
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

export default InvoiceManagementPage;
