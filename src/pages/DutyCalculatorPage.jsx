import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Table, 
  Input, 
  Tag, 
  Modal, 
  Descriptions, 
  Row, 
  Col,
  Statistic,
  Select,
  Form,
  message,
  InputNumber,
  Divider,
  Alert,
  Tabs,
  List,
  Tooltip,
  Drawer
} from 'antd';
import CustomerSelector from '../components/common/CustomerSelector';
import { useCustomers } from '../contexts/CustomerContext';
import { 
  CalculatorOutlined, 
  PlusOutlined, 
  SaveOutlined, 
  HistoryOutlined,
  FileTextOutlined,
  DollarOutlined,
  PercentageOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const DutyCalculatorPage = () => {
  const [form] = Form.useForm();
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [currentCalculation, setCurrentCalculation] = useState(null);

  // Mock duty rates data
  const dutyRates = {
    'Electronics': { duty: 20, vat: 15, nhil: 2.5, covid: 1 },
    'Textiles': { duty: 25, vat: 15, nhil: 2.5, covid: 1 },
    'Machinery': { duty: 15, vat: 15, nhil: 2.5, covid: 1 },
    'Vehicles': { duty: 35, vat: 15, nhil: 2.5, covid: 1 },
    'Food Items': { duty: 30, vat: 15, nhil: 2.5, covid: 1 },
    'Chemicals': { duty: 18, vat: 15, nhil: 2.5, covid: 1 },
    'Furniture': { duty: 22, vat: 15, nhil: 2.5, covid: 1 },
    'Pharmaceuticals': { duty: 12, vat: 15, nhil: 2.5, covid: 1 }
  };

  // Mock calculation history
  const mockHistory = [
    {
      id: 1,
      date: '2024-01-20',
      clientName: 'Ghana Import Export Ltd',
      goodsType: 'Electronics',
      declaredValue: 50000,
      duty: 10000,
      vat: 9000,
      nhil: 1500,
      covid: 600,
      total: 20100,
      notes: 'Laptop and accessories import'
    },
    {
      id: 2,
      date: '2024-01-18',
      clientName: 'West Africa Trading Co',
      goodsType: 'Textiles',
      declaredValue: 25000,
      duty: 6250,
      vat: 4687.5,
      nhil: 781.25,
      covid: 312.5,
      total: 12031.25,
      notes: 'Fabric and clothing materials'
    },
    {
      id: 3,
      date: '2024-01-15',
      clientName: 'Tema Port Services',
      goodsType: 'Machinery',
      declaredValue: 150000,
      duty: 22500,
      vat: 25875,
      nhil: 4312.5,
      covid: 1725,
      total: 54412.5,
      notes: 'Industrial machinery parts'
    }
  ];

  const [history, setHistory] = useState(mockHistory);



  const calculateDuty = (values) => {
    const { goodsType, declaredValue, portOfEntry } = values;
    
    if (!goodsType || !declaredValue) {
      message.error('Please fill in all required fields');
      return;
    }

    const rates = dutyRates[goodsType];
    if (!rates) {
      message.error('Please select a valid goods type');
      return;
    }

    const duty = (declaredValue * rates.duty) / 100;
    const vat = ((declaredValue + duty) * rates.vat) / 100;
    const nhil = ((declaredValue + duty) * rates.nhil) / 100;
    const covid = ((declaredValue + duty) * rates.covid) / 100;
    const total = duty + vat + nhil + covid;

    const calculation = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      clientName: values.clientName || 'N/A',
      goodsType,
      declaredValue,
      duty: Math.round(duty * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      nhil: Math.round(nhil * 100) / 100,
      covid: Math.round(covid * 100) / 100,
      total: Math.round(total * 100) / 100,
      portOfEntry,
      notes: values.notes || ''
    };

    setCurrentCalculation(calculation);
    message.success('Duty calculation completed successfully!');
  };

  const handleCustomerSelect = (customerId, customer) => {
    // Auto-fill client name when customer is selected
    form.setFieldsValue({
      clientName: customer.name
    });
  };

  const saveCalculation = () => {
    if (currentCalculation) {
      setHistory([currentCalculation, ...history]);
      message.success('Calculation saved to history');
      setCurrentCalculation(null);
      form.resetFields();
    }
  };

  const getGoodsTypeOptions = () => {
    return Object.keys(dutyRates).map(type => (
      <Option key={type} value={type}>
        {type} ({dutyRates[type].duty}% duty)
      </Option>
    ));
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
    },
    {
      title: 'Goods Type',
      dataIndex: 'goodsType',
      key: 'goodsType',
    },
    {
      title: 'Declared Value',
      key: 'declaredValue',
      render: (_, record) => `GHS ${record.declaredValue.toLocaleString()}`
    },
    {
      title: 'Total Duty & Taxes',
      key: 'total',
      render: (_, record) => (
        <div style={{ fontWeight: 'bold', color: '#2FA2EE' }}>
          GHS {record.total.toLocaleString()}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="text" 
          size="small"
          onClick={() => {
            setCurrentCalculation(record);
            setIsHistoryModalVisible(true);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>Duty Calculator</Title>
          <Text type="secondary">Calculate import duties, taxes, and fees for various goods types</Text>
        </div>
        <Button 
          icon={<HistoryOutlined />} 
          onClick={() => setIsHistoryModalVisible(true)}
        >
          View History
        </Button>
      </div>

      <Row gutter={24}>
        {/* Calculator Form */}
        <Col xs={24} lg={12}>
          <Card title="Duty Calculation" extra={<CalculatorOutlined />}>
            <Form
              form={form}
              layout="vertical"
              onFinish={calculateDuty}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="customerId"
                    label="Select Client"
                  >
                    <CustomerSelector
                      onChange={handleCustomerSelect}
                      placeholder="Search and select client..."
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="goodsType"
                    label="Goods Type"
                    rules={[{ required: true, message: 'Please select goods type' }]}
                  >
                    <Select placeholder="Select goods type">
                      {getGoodsTypeOptions()}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="declaredValue"
                    label="Declared Value (GHS)"
                    rules={[{ required: true, message: 'Please enter declared value' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Enter value"
                      formatter={value => `GHS ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\GHS\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="portOfEntry"
                    label="Port of Entry"
                  >
                    <Select placeholder="Select port of entry">
                      <Option value="Tema">Tema Port</Option>
                      <Option value="Takoradi">Takoradi Port</Option>
                      <Option value="Kumasi">Kumasi Airport</Option>
                      <Option value="Accra">Kotoka Airport</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notes"
                label="Notes"
              >
                <TextArea placeholder="Enter additional notes" rows={3} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<CalculatorOutlined />} size="large">
                  Calculate Duty
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Calculation Results */}
        <Col xs={24} lg={12}>
          <Card title="Calculation Results" extra={<DollarOutlined />}>
            {currentCalculation ? (
              <div>
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                  <Col span={12}>
                    <Statistic
                      title="Declared Value"
                      value={currentCalculation.declaredValue}
                      prefix="GHS"
                      valueStyle={{ color: '#2FA2EE' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Duty & Taxes"
                      value={currentCalculation.total}
                      prefix="GHS"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                </Row>

                <Divider />

                <Descriptions title="Breakdown" bordered column={1}>
                  <Descriptions.Item label="Duty">
                    GHS {currentCalculation.duty.toLocaleString()} 
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      ({dutyRates[currentCalculation.goodsType]?.duty}%)
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="VAT">
                    GHS {currentCalculation.vat.toLocaleString()}
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      ({dutyRates[currentCalculation.goodsType]?.vat}%)
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="NHIL">
                    GHS {currentCalculation.nhil.toLocaleString()}
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      ({dutyRates[currentCalculation.goodsType]?.nhil}%)
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="COVID Levy">
                    GHS {currentCalculation.covid.toLocaleString()}
                    <Text type="secondary" style={{ marginLeft: '8px' }}>
                      ({dutyRates[currentCalculation.goodsType]?.covid}%)
                    </Text>
                  </Descriptions.Item>
                </Descriptions>

                <Divider />

                <div style={{ textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    size="large"
                    onClick={saveCalculation}
                  >
                    Save Calculation
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <CalculatorOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Text type="secondary">Enter goods details and click Calculate to see results</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Duty Rates Information */}
      <Card title="Duty Rates Reference" style={{ marginTop: '24px' }}>
        <Alert
          message="Current Duty Rates"
          description="These are the current duty rates for different goods categories. Rates may vary based on specific goods and trade agreements."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Table
          dataSource={Object.entries(dutyRates).map(([type, rates]) => ({
            goodsType: type,
            duty: rates.duty,
            vat: rates.vat,
            nhil: rates.nhil,
            covid: rates.covid
          }))}
          columns={[
            { title: 'Goods Type', dataIndex: 'goodsType', key: 'goodsType' },
            { title: 'Duty (%)', dataIndex: 'duty', key: 'duty' },
            { title: 'VAT (%)', dataIndex: 'vat', key: 'vat' },
            { title: 'NHIL (%)', dataIndex: 'nhil', key: 'nhil' },
            { title: 'COVID Levy (%)', dataIndex: 'covid', key: 'covid' }
          ]}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Calculation History Modal */}
      <Drawer
        title="Calculation History"
        placement="right"
        onClose={() => {
          setIsHistoryModalVisible(false);
          setCurrentCalculation(null);
        }}
        open={isHistoryModalVisible}
        width={600}
      >
        <div>
          {/* Calculation Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <Title level={3}>Calculation #{currentCalculation?.id}</Title>
              <div>Date: {new Date(currentCalculation?.date).toLocaleDateString()}</div>
              <div>Client: {currentCalculation?.clientName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2FA2EE' }}>
                Total: GHS {currentCalculation?.total.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Calculation Details */}
          <div style={{ 
            marginBottom: '24px', 
            border: '1px solid #d9d9d9', 
            borderRadius: '8px', 
            padding: '20px',
            backgroundColor: '#ffffff'
          }}>
            <Title level={4} style={{ 
              marginBottom: '20px', 
              borderBottom: '1px solid #d9d9d9',
              paddingBottom: '8px'
            }}>
              Calculation Details
            </Title>
            <div style={{ marginBottom: '16px', display: 'flex' }}>
              <div style={{ width: '140px', fontWeight: 'bold' }}>Goods Type:</div>
              <div>{currentCalculation?.goodsType}</div>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex' }}>
              <div style={{ width: '140px', fontWeight: 'bold' }}>Port of Entry:</div>
              <div>{currentCalculation?.portOfEntry || 'N/A'}</div>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex' }}>
              <div style={{ width: '140px', fontWeight: 'bold' }}>Declared Value:</div>
              <div>GHS {currentCalculation?.declaredValue.toLocaleString()}</div>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex' }}>
              <div style={{ width: '140px', fontWeight: 'bold' }}>Calculation Date:</div>
              <div>{new Date(currentCalculation?.date).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Tax Breakdown */}
          <div style={{ 
            marginBottom: '24px', 
            border: '1px solid #d9d9d9', 
            borderRadius: '8px', 
            padding: '20px',
            backgroundColor: '#ffffff'
          }}>
            <Title level={4} style={{ 
              marginBottom: '20px', 
              borderBottom: '1px solid #d9d9d9',
              paddingBottom: '8px'
            }}>
              Tax Breakdown
            </Title>
            <div style={{ marginBottom: '16px', display: 'flex' }}>
              <div style={{ width: '140px', fontWeight: 'bold' }}>Duty:</div>
              <div>GHS {currentCalculation?.duty.toLocaleString()}</div>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex' }}>
              <div style={{ width: '140px', fontWeight: 'bold' }}>VAT:</div>
              <div>GHS {currentCalculation?.vat.toLocaleString()}</div>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex' }}>
              <div style={{ width: '140px', fontWeight: 'bold' }}>NHIL:</div>
              <div>GHS {currentCalculation?.nhil.toLocaleString()}</div>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex' }}>
              <div style={{ width: '140px', fontWeight: 'bold' }}>COVID Levy:</div>
              <div>GHS {currentCalculation?.covid.toLocaleString()}</div>
            </div>
          </div>

          {/* Notes */}
          {currentCalculation?.notes && (
            <div style={{ 
              marginBottom: '24px', 
              border: '1px solid #d9d9d9', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: '#ffffff'
            }}>
              <Title level={4} style={{ 
                marginBottom: '20px', 
                borderBottom: '1px solid #d9d9d9',
                paddingBottom: '8px'
              }}>
                Notes
              </Title>
              <div>{currentCalculation.notes}</div>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default DutyCalculatorPage;
