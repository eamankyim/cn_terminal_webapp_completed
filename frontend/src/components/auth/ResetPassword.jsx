import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Space,
  Row,
  Col
} from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import passwordResetService from '../../services/passwordResetService';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Debug log to confirm component is mounting
  console.log('🚀 ResetPassword component mounted!');
  console.log('🔗 Current URL:', window.location.href);
  console.log('🔗 Current pathname:', window.location.pathname);
  console.log('🔗 Search params:', window.location.search);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      console.log('🔍 ResetPassword: Component mounted, verifying token...');
      console.log('🔑 Full URL:', window.location.href);
      console.log('🔑 Token from URL:', token ? token.substring(0, 20) + '...' : 'MISSING');
      console.log('🔑 Full token:', token);
      
      if (!token) {
        console.log('❌ ResetPassword: No token found in URL');
        message.error('Invalid reset link. Please request a new password reset.');
        navigate('/login');
        return;
      }

      try {
        console.log('🌐 ResetPassword: Calling verifyResetToken API...');
        console.log('🌐 ResetPassword: API URL:', '/api/auth/verify-reset-token');
        console.log('🌐 ResetPassword: Request body:', { token });
        
        const response = await passwordResetService.verifyResetToken(token);
        console.log('✅ ResetPassword: Token verification successful:', response);
        setTokenValid(true);
        setUserEmail(response.email);
      } catch (error) {
        console.log('❌ ResetPassword: Token verification failed:', error);
        console.log('❌ ResetPassword: Error response:', error.response?.data);
        console.log('❌ ResetPassword: Error status:', error.response?.status);
        console.log('❌ ResetPassword: Error message:', error.message);
        
        // Don't redirect immediately - let user see the error
        message.error(error.response?.data?.error || 'Invalid or expired reset link.');
        
        // Only redirect after a delay to show the error message
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  const handleSubmit = async (values) => {
    const token = searchParams.get('token');
    
    console.log('🔐 ResetPassword: Submitting password reset...');
    console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'MISSING');
    console.log('🔒 Password length:', values.password ? values.password.length : 'MISSING');
    
    if (!token) {
      console.log('❌ ResetPassword: No token found');
      message.error('Invalid reset link.');
      return;
    }

    setLoading(true);
    try {
      console.log('🌐 ResetPassword: Calling resetPassword API...');
      const response = await passwordResetService.resetPassword(token, values.password);
      console.log('✅ ResetPassword: Password reset successful:', response);
      message.success('Password reset successfully! You can now sign in with your new password.');
      navigate('/login');
    } catch (error) {
      console.log('❌ ResetPassword: Password reset failed:', error);
      console.log('❌ ResetPassword: Error response:', error.response?.data);
      message.error(error.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#00072D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Row justify="center" style={{ width: '100%' }}>
          <Col xs={24} style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <img 
                src="/cn_logo.png" 
                alt="CN Terminal" 
                style={{ 
                  width: '64px', 
                  height: '64px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }} 
              />
              <span style={{ 
                fontSize: '36px', 
                fontWeight: 'bold',
                color: '#ffffff'
              }}>
                CN Terminal
              </span>
            </div>
          </Col>
          
          <Col xs={24} sm={20} md={16} lg={12} xl={8}>
            <Card 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                textAlign: 'center'
              }}
            >
              <Title level={4} style={{ color: '#333', fontWeight: '600' }}>
                Verifying Reset Link...
              </Title>
              <Text type="secondary">
                Please wait while we verify your reset link.
              </Text>
              <div style={{ marginTop: '16px', textAlign: 'left', backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  <strong>Debug Info:</strong><br/>
                  URL: {window.location.href}<br/>
                  Token: {searchParams.get('token') ? searchParams.get('token').substring(0, 20) + '...' : 'MISSING'}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  if (!tokenValid) {
    return null; // Will redirect to login
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#00072D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%' }}>
        {/* Logo and Brand */}
        <Col xs={24} style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '16px',
            marginBottom: '16px'
          }}>
            <img 
              src="/cn_logo.png" 
              alt="CN Terminal" 
              style={{ 
                width: '64px', 
                height: '64px',
                objectFit: 'cover',
                borderRadius: '8px'
              }} 
            />
            <span style={{ 
              fontSize: '36px', 
              fontWeight: 'bold',
              color: '#ffffff'
            }}>
              CN Terminal
            </span>
          </div>
          <Title level={3} style={{ color: '#ffffff', fontWeight: 'normal', margin: 0, opacity: 0.9 }}>
            Reset Password
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
            Create a new password for {userEmail}
          </Text>
        </Col>
        
        {/* Reset Password Form Card */}
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card 
            style={{ 
              borderRadius: '16px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)'
            }}
          >
            {/* Form Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={4} style={{ color: '#333', fontWeight: '600', margin: 0 }}>
                New Password
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Enter your new password below
              </Text>
            </div>

            {/* Reset Password Form */}
            <Form
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="password"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter your new password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Enter your new password"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Confirm your new password"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ width: '100%', height: '48px', fontSize: '16px' }}
                >
                  Reset Password
                </Button>
              </Form.Item>
            </Form>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Password must be at least 6 characters long
              </Text>
              <div style={{ marginTop: '12px', textAlign: 'left', backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  <strong>Debug Info:</strong><br/>
                  Token Valid: {tokenValid ? 'YES' : 'NO'}<br/>
                  User Email: {userEmail || 'Not loaded'}<br/>
                  URL: {window.location.href}<br/>
                  Token: {searchParams.get('token') ? searchParams.get('token').substring(0, 20) + '...' : 'MISSING'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ResetPassword;
