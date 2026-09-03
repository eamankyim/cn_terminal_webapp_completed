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
  FileTextOutlined,
  MessageOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import configurationService from '../services/configurationService';
import { useAuth } from '../contexts/AuthContext';
import { getVATExplanation } from '../utils/vatCalculator';
import { useNavigate } from 'react-router-dom';
import useResponsive from '../hooks/useResponsive';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const SENSITIVE_CONFIG_KEYS = new Set(['MNOTIFY_API_KEY']);

const ConfigurationPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  // Route guard: Only ADMIN and IT_CONSULTANT can access this page
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN' && currentUser.role !== 'IT_CONSULTANT') {
      message.error('Access denied. System configuration is only accessible to administrators.');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configurations, setConfigurations] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('TAX');
  const [editingConfig, setEditingConfig] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalForm] = Form.useForm();
  const [dirtyCategories, setDirtyCategories] = useState({});

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
    },
    SMS: {
      title: 'SMS Events',
      icon: <MessageOutlined />,
      color: '#13c2c2',
      description: 'Per-event SMS toggles and thresholds. Manage API key and send tests in Admin → SMS Settings.'
    },
    NOTIFICATIONS: {
      title: 'Notifications',
      icon: <MessageOutlined />,
      color: '#fa8c16',
      description: 'Master notification switches including SMS_NOTIFICATIONS'
    }
  };

  useEffect(() => {
    initializeAndLoadConfigurations();
  }, []);

  const initializeAndLoadConfigurations = async () => {
    setLoading(true);
    try {
      // Always call init first — it is idempotent (skips existing keys),
      // so new categories like SMS are seeded even on existing installations.
      await configurationService.initializeDefaults();
      await loadConfigurations();
    } catch (error) {
      message.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      const response = await configurationService.getConfigurations();
      
      if (response.success) {
        // Filter to only show essential categories
        const essentialCategories = ['TAX', 'SERVICE', 'BUSINESS', 'INVOICE', 'SMS', 'NOTIFICATIONS'];
        const filteredConfigurations = {};
        
        essentialCategories.forEach(category => {
          if (response.data[category]) {
            filteredConfigurations[category] = response.data[category];
          }
        });
        
        setConfigurations(filteredConfigurations);
        setDirtyCategories({});
        setRefreshKey(prev => prev + 1); // Force re-render
      } else {
        message.error('Failed to load configurations');
      }
    } catch (error) {

      message.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const markCategoryDirty = (category) => {
    setDirtyCategories((prev) => ({ ...prev, [category]: true }));
  };

  const handleSave = async (category) => {
    if (!dirtyCategories[category]) {
      message.info('No unsaved changes');
      return;
    }

    setSaving(true);
    try {
      const categoryConfigs = configurations[category] || [];
      const updatedConfigs = categoryConfigs
        .filter((config) => {
          // Never push redacted empty API key back — that would look like a wipe
          // (backend keeps existing on blank, but we still skip the no-op).
          if (
            SENSITIVE_CONFIG_KEYS.has(config.key) &&
            (!config.value || String(config.value).trim() === '')
          ) {
            return false;
          }
          return true;
        })
        .map((config) => ({
          key: config.key,
          value: config.value,
          type: config.type,
          category: config.category,
          description: config.description,
          isActive: config.isActive
        }));

      const response = await configurationService.saveConfigurations(updatedConfigs);
      if (response.success) {
        const failed = (response.data || []).filter((r) => r && r.success === false);
        if (failed.length > 0) {
          message.error(failed[0].message || 'Some settings failed to save');
        } else {
          message.success(`${configCategories[category]?.title} settings saved successfully`);
        }
        await loadConfigurations();
      } else {
        message.error('Failed to save configurations');
      }
    } catch (error) {
      message.error('Failed to save configurations');
    } finally {
      setSaving(false);
    }
  };

  const handleEditConfig = (config) => {
    if (SENSITIVE_CONFIG_KEYS.has(config.key)) {
      message.info('Manage the MNotify API key in Admin → SMS Settings');
      navigate('/admin?tab=sms-settings');
      return;
    }
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

  const handleModalSave = async (values) => {
    if (SENSITIVE_CONFIG_KEYS.has(values.key)) {
      message.error('API key cannot be edited here. Use Admin → SMS Settings.');
      return;
    }
    setSaving(true);
    try {
      const response = await configurationService.saveConfiguration(values);
      if (response.success) {
        message.success(editingConfig ? 'Configuration updated successfully' : 'Configuration created successfully');
        setIsModalVisible(false);
        modalForm.resetFields();
        await loadConfigurations();
      } else {
        message.error('Failed to save configuration');
      }
    } catch (error) {
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
    markCategoryDirty(category);
  };

  const isBooleanTrue = (value) => value === true || value === 'true';

  const renderConfigField = (config) => {
    const { key, value, type } = config;

    if (SENSITIVE_CONFIG_KEYS.has(key)) {
      return (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {config.isConfigured ? (
            <Tag color="success">Configured (hidden)</Tag>
          ) : (
            <Tag color="warning">Not configured</Tag>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            Edit only in Admin → SMS Settings (value is never shown here).
          </Text>
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => navigate('/admin?tab=sms-settings')}
          >
            Open SMS Settings
          </Button>
        </Space>
      );
    }
    
    switch (type) {
      case 'BOOLEAN':
        return (
          <Switch
            checked={isBooleanTrue(value)}
            onChange={(checked) =>
              updateConfigValue(config.category, key, 'value', checked ? 'true' : 'false')
            }
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
            formatter={type === 'CURRENCY' ? v => `GHS ${v}` : type === 'PERCENTAGE' ? v => `${v}%` : undefined}
            parser={type === 'CURRENCY' ? v => v.replace('GHS ', '') : type === 'PERCENTAGE' ? v => v.replace('%', '') : v => v}
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
    const isDirty = !!dirtyCategories[category];

    if (!categoryInfo) return null;

    return (
      <Card
        key={category}
        title={
          <Space>
            {categoryInfo.icon}
            <span>{categoryInfo.title}</span>
            <Tag color={categoryInfo.color}>{categoryConfigs.length} settings</Tag>
            {isDirty && <Tag color="orange">Unsaved changes</Tag>}
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => handleSave(category)}
              loading={saving}
              disabled={!isDirty}
            >
              {isDirty ? 'Save Changes' : 'Saved'}
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {category === 'SMS' && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Manage SMS & send a test"
            description="MNotify API key, Test SMS, and delivery statistics live in Admin → SMS Settings (not this list). The API key appears empty here on purpose — it is redacted after save."
            action={
              <Space direction="vertical" size={4}>
                <Button
                  type="primary"
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={() => navigate('/admin?tab=sms-settings')}
                >
                  Open SMS Settings
                </Button>
                <Button
                  size="small"
                  icon={<ExperimentOutlined />}
                  onClick={() => navigate('/admin?tab=sms-settings&smsTab=test')}
                >
                  Open Test SMS
                </Button>
              </Space>
            }
          />
        )}

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
                      {SENSITIVE_CONFIG_KEYS.has(config.key)
                        ? config.isConfigured
                          ? 'Configured (value hidden)'
                          : 'Not set'
                        : configurationService.formatConfigValue(config.value, config.type)}
                    </Text>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <Space size="small">
                      {!SENSITIVE_CONFIG_KEYS.has(config.key) && (
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEditConfig(config)}
                        />
                      )}
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

      {/* Mobile Alert - Hide on mobile */}
      {isMobile && (
        <Alert
          message="Configuration Not Available on Mobile"
          description="Please access this page on a desktop or tablet."
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Hide all configuration content on mobile */}
      {!isMobile && (
        <>
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
        </>
      )}

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
