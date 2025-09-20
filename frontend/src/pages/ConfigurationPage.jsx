import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  message,
  Row,
  Col,
  Tabs,
  Alert,
  Spin,
  Modal,
  Tag,
  Tooltip
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  EditOutlined,
  DollarOutlined,
  PercentageOutlined,
  GlobalOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import configurationService from '../services/configurationService';
import { useAuth } from '../contexts/AuthContext';
import { calculateVAT, getVATExplanation } from '../utils/vatCalculator';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ConfigurationPage = () => {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configurations, setConfigurations] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('TAX');
  const [editingConfig, setEditingConfig] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalForm] = Form.useForm();

  const configCategories = {
    TAX: {
      title: 'Tax & VAT Settings',
      icon: <PercentageOutlined />,
      color: '#ff4d4f',
      description: 'Configure VAT calculation formula and tax rates'
    },
    SERVICE: {
      title: 'Service Charges',
      icon: <DollarOutlined />,
      color: '#1890ff',
      description: 'Default charges for various services'
    },
    BUSINESS: {
      title: 'Business Information',
      icon: <GlobalOutlined />,
      color: '#52c41a',
      description: 'Company details and contact information'
    },
    INVOICE: {
      title: 'Invoice Settings',
      icon: <FileTextOutlined />,
      color: '#722ed1',
      description: 'Invoice generation and formatting settings'
    }
  };

  useEffect(() => {
    initializeAndLoadConfigurations();
  }, []);

  const initializeAndLoadConfigurations = async () => {
    setLoading(true);
    try {
      // First, try to load existing configurations
      const response = await configurationService.getConfigurations();
      
      if (response.success && response.data) {
        // Check if we have configurations in any category
        const hasConfigurations = Object.values(response.data).some(category => Array.isArray(category) && category.length > 0);
        
        if (hasConfigurations) {
          // Configurations exist, load them
          setConfigurations(response.data);
          setRefreshKey(prev => prev + 1);
        } else {
          // No configurations exist, initialize defaults
          await initializeDefaults();
        }
      } else {
        // No configurations exist, initialize defaults
        await initializeDefaults();
      }
    } catch (error) {
      console.error('Error initializing configurations:', error);
      message.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    try {
      const response = await configurationService.initializeDefaults();
      if (response.success) {
        // Reload configurations after initialization
        await loadConfigurations();
      } else {
        message.error('Failed to initialize default configurations');
      }
    } catch (error) {
      console.error('Error initializing defaults:', error);
      message.error('Failed to initialize default configurations');
    }
  };

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      const response = await configurationService.getConfigurations();
      
      if (response.success) {
        // Filter to only show essential categories
        const essentialCategories = ['TAX', 'SERVICE', 'BUSINESS', 'INVOICE'];
        const filteredConfigurations = {};
        
        essentialCategories.forEach(category => {
          if (response.data[category]) {
            filteredConfigurations[category] = response.data[category];
          }
        });
        
        setConfigurations(filteredConfigurations);
        setRefreshKey(prev => prev + 1); // Force re-render
      } else {
        message.error('Failed to load configurations');
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      message.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category) => {
    try {
      const categoryConfigs = configurations[category] || [];
      const updatedConfigs = categoryConfigs.map(config => ({
        key: config.key,
        value: config.value,
        type: config.type,
        category: config.category,
        description: config.description,
        isActive: config.isActive
      }));

      const response = await configurationService.saveConfigurations(updatedConfigs);
      if (response.success) {
        message.success(`${configCategories[category]?.title} settings saved successfully`);
        loadConfigurations();
      } else {
        message.error('Failed to save configurations');
      }
    } catch (error) {
      console.error('Error saving configurations:', error);
      message.error('Failed to save configurations');
    }
  };

  const handleAddConfig = () => {
    setEditingConfig(null);
    modalForm.resetFields();
    setIsModalVisible(true);
  };

  const handleEditConfig = (config) => {
    setEditingConfig(config);
    modalForm.setFieldsValue({
      key: config.key,
      value: config.value,
      type: config.type,
      category: config.category,
      description: config.description,
      isActive: config.isActive
    });
    setIsModalVisible(true);
  };

  const handleDeleteConfig = async (key) => {
    try {
      const response = await configurationService.deleteConfiguration(key);
      if (response.success) {
        message.success('Configuration deleted successfully');
        loadConfigurations();
      } else {
        message.error('Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      message.error('Failed to delete configuration');
    }
  };

  const handleModalSave = async (values) => {
    setSaving(true);
    try {
      const response = await configurationService.saveConfiguration(values);
      if (response.success) {
        message.success(editingConfig ? 'Configuration updated successfully' : 'Configuration created successfully');
        setIsModalVisible(false);
        modalForm.resetFields();
        loadConfigurations();
      } else {
        message.error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      message.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    setSaving(true);
    try {
      const response = await configurationService.initializeDefaults();
      
      if (response.success) {
        message.success('Configurations reset to default values successfully');
        // Force reload configurations after a short delay
        setTimeout(async () => {
          await loadConfigurations();
        }, 500);
      } else {
        message.error('Failed to reset configurations to defaults');
      }
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      message.error('Failed to reset configurations to defaults');
    } finally {
      setSaving(false);
    }
  };

  const updateConfigValue = (category, key, field, value) => {
    setConfigurations(prev => ({
      ...prev,
      [category]: prev[category]?.map(config => 
        config.key === key ? { ...config, [field]: value } : config
      ) || []
    }));
  };

  const renderConfigField = (config) => {
    const { key, value, type, isActive } = config;
    
    switch (type) {
      case 'BOOLEAN':
        return (
          <Switch
            checked={isActive}
            onChange={(checked) => updateConfigValue(config.category, key, 'isActive', checked)}
          />
        );
      case 'NUMBER':
      case 'CURRENCY':
      case 'PERCENTAGE':
        return (
          <InputNumber
            value={parseFloat(value) || 0}
            onChange={(val) => updateConfigValue(config.category, key, 'value', val?.toString() || '0')}
            style={{ width: '100%' }}
            min={0}
            precision={type === 'CURRENCY' ? 2 : type === 'PERCENTAGE' ? 2 : 0}
            formatter={type === 'CURRENCY' ? value => `GHS ${value}` : type === 'PERCENTAGE' ? value => `${value}%` : undefined}
            parser={type === 'CURRENCY' ? value => value.replace('GHS ', '') : type === 'PERCENTAGE' ? value => value.replace('%', '') : value}
          />
        );
      case 'JSON':
        return (
          <TextArea
            value={value}
            onChange={(e) => updateConfigValue(config.category, key, 'value', e.target.value)}
            rows={3}
            placeholder="Enter JSON configuration"
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateConfigValue(config.category, key, 'value', e.target.value)}
            placeholder="Enter configuration value"
          />
        );
    }
  };

  const renderConfigCard = (category) => {
    const categoryConfigs = configurations[category] || [];
    const categoryInfo = configCategories[category];

    if (!categoryInfo) return null;

    return (
      <Card
        key={category}
        title={
          <Space>
            {categoryInfo.icon}
            <span>{categoryInfo.title}</span>
            <Tag color={categoryInfo.color}>{categoryConfigs.length} settings</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => handleSave(category)}
              loading={saving}
            >
              Save Changes
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {categoryConfigs.length === 0 ? (
          <Alert
            message="No configurations found"
            description={`System configurations for ${categoryInfo.title.toLowerCase()} are not available. Please contact your administrator.`}
            type="info"
            showIcon
          />
        ) : (
          <>
            {category === 'TAX' && configurations.TAX && (
              <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
                  <PercentageOutlined /> VAT Calculation Preview
                </Title>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    Test VAT calculation with a sample service charge of GHS 100:
                  </Text>
                  <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff', borderRadius: 4, border: '1px solid #d9d9d9' }}>
                    {(() => {
                      const testServiceCharge = 100;
                      const explanation = getVATExplanation(testServiceCharge, configurations);
                      return (
                        <div>
                          <div><strong>Formula:</strong> {explanation.formula}</div>
                          <div><strong>Calculation:</strong> {explanation.calculation}</div>
                          <div><strong>Result:</strong> GHS {explanation.result.toFixed(2)}</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </Card>
            )}
          <Row gutter={[16, 16]}>
            {categoryConfigs.map((config) => (
              <Col xs={24} sm={12} lg={8} key={config.key}>
                <Card size="small" style={{ height: '100%' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Space>
                      <Text strong>{config.key.replace(/_/g, ' ')}</Text>
                      <Tooltip title={config.description}>
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </Space>
                  </div>
                  
                  <div style={{ marginBottom: 8 }}>
                    {renderConfigField(config)}
                  </div>
                  
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {configurationService.formatConfigValue(config.value, config.type)}
                    </Text>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <Space size="small">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditConfig(config)}
                      />
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          </>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading configurations...</Text>
        </div>
      </div>
    );
  }

  return (
    <div key={refreshKey} style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <SettingOutlined /> System Configuration
        </Title>
        <Text type="secondary">
          Manage essential system settings for invoices, taxes, and business information. 
          Only the most important configurations are shown for easy management.
        </Text>
      </div>

      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadConfigurations}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={handleResetToDefaults}
            loading={saving}
          >
            Reset to Defaults
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="large"
      >
        {Object.entries(configCategories).map(([key, info]) => (
          <TabPane
            tab={
              <Space>
                {info.icon}
                {info.title}
              </Space>
            }
            key={key}
          >
            {renderConfigCard(key)}
          </TabPane>
        ))}
      </Tabs>

      <Modal
        title="Edit System Configuration"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          modalForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleModalSave}
        >
          <Form.Item
            name="key"
            label="Configuration Key (System-defined)"
            rules={[{ required: true, message: 'Please enter configuration key' }]}
          >
            <Input placeholder="e.g., VAT_RATE" disabled={true} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category (System-defined)"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select category" disabled={true}>
              {Object.entries(configCategories).map(([key, info]) => (
                <Option key={key} value={key.toUpperCase()}>
                  {info.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="Data Type (System-defined)"
            rules={[{ required: true, message: 'Please select data type' }]}
          >
            <Select placeholder="Select data type" disabled={true}>
              <Option value="STRING">String</Option>
              <Option value="NUMBER">Number</Option>
              <Option value="CURRENCY">Currency</Option>
              <Option value="PERCENTAGE">Percentage</Option>
              <Option value="BOOLEAN">Boolean</Option>
              <Option value="JSON">JSON</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="value"
            label="Value"
            rules={[{ required: true, message: 'Please enter value' }]}
          >
            <Input placeholder="Enter configuration value" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              placeholder="Enter description for this configuration"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<SaveOutlined />}
              >
                Update Configuration
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigurationPage;
