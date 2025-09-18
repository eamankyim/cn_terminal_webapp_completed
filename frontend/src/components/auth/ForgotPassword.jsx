import React, { useState } from 'react';
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
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import passwordResetService from '../../services/passwordResetService';

const { Title, Text } = Typography;

const ForgotPassword = ({ onBackToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await passwordResetService.requestPasswordReset(values.email);
      setEmailSent(true);
      message.success('If the email exists, a password reset link has been sent to your inbox.');
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
              <div style={{ marginBottom: '24px' }}>
                <Title level={4} style={{ color: '#52c41a', marginBottom: '16px' }}>
                  Check Your Email
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
                </Text>
                <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '24px' }}>
                  The reset link will expire in 1 hour for security reasons.
                </Text>
              </div>

              <Button 
                type="link" 
                icon={<ArrowLeftOutlined />}
                onClick={onBackToLogin}
                style={{ color: '#1890ff' }}
              >
                Back to Login
              </Button>
            </Card>
          </Col>
        </Row>
      </div>
    );
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
            Forgot Password
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
            Enter your email to receive a password reset link
          </Text>
        </Col>
        
        {/* Forgot Password Form Card */}
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
                Reset Password
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                We'll send you a link to reset your password
              </Text>
            </div>

            {/* Forgot Password Form */}
            <Form
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                label="Company Email"
                rules={[
                  { required: true, message: 'Please enter your company email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Enter your company email"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ width: '100%', height: '48px', fontSize: '16px', marginBottom: '16px' }}
                >
                  Send Reset Link
                </Button>
              </Form.Item>
            </Form>

            {/* Footer */}
            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Button 
                  type="link" 
                  icon={<ArrowLeftOutlined />}
                  onClick={onBackToLogin}
                  style={{ color: '#1890ff' }}
                >
                  Back to Login
                </Button>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Remember your password? Sign in instead.
                </Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ForgotPassword;


