import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  message, 
  Space, 
  Alert,
  Spin,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined,
  CheckCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import initService from '../services/initService';

const { Title, Text, Paragraph } = Typography;

const SetupPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await initService.checkInitialization();
      setIsInitialized(response.initialized);
      
      if (response.initialized) {
        message.info('System is already initialized. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      message.error('Failed to check system status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCreateSuperAdmin = async (values) => {
    setLoading(true);
    try {
      const response = await initService.createSuperAdmin(values);
      message.success('Super admin created successfully!');
      
      // Redirect to login page after successful creation
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create super admin';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <Text style={{ marginTop: '16px' }}>Checking system status...</Text>
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column'
      }}>
        <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
        <Title level={3}>System Already Initialized</Title>
        <Text>Redirecting to login page...</Text>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%', maxWidth: '500px' }}>
        <Col span={24}>
          <Card 
            style={{ 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              borderRadius: '12px',
              border: 'none'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <SettingOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                System Setup
              </Title>
              <Paragraph type="secondary" style={{ marginTop: '8px' }}>
                Create your first super administrator account
              </Paragraph>
            </div>

            <Alert
              message="Initial Setup Required"
              description="This is a one-time setup to create the first super administrator account. This account will have full system access."
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreateSuperAdmin}
              size="large"
            >
              <Form.Item
                name="name"
                label="Full Name"
                rules={[
                  { required: true, message: 'Please enter your full name' },
                  { min: 2, message: 'Name must be at least 2 characters' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Enter your full name"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Enter your email address"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter a password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Enter a secure password"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Confirm your password"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: '32px', marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                  size="large"
                >
                  Create Super Admin Account
                </Button>
              </Form.Item>
            </Form>

            <div style={{ 
              textAlign: 'center', 
              marginTop: '24px',
              padding: '16px',
              background: '#f6f8fa',
              borderRadius: '8px'
            }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <strong>Note:</strong> This setup can only be performed once. 
                After creating the super admin account, you can log in and create additional users.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SetupPage;

