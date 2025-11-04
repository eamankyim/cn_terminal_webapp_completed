import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Alert, 
  Spin, 
  Row, 
  Col,
  Space,
  Divider,
  message
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import invitationService from '../services/invitationService';

const { Title, Text, Paragraph } = Typography;

const AcceptInvitationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (!validated && id) {
      validateInvitation();
    }
  }, [id, validated]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      setValidated(true);
      
      const response = await invitationService.validateInvitation(id);
      setInvitation(response.invitation);
      
      // Auto-populate email in form
      if (response.invitation?.email) {
        form.setFieldsValue({ email: response.invitation.email });
      }
    } catch (error) {
      setError(error.message || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await invitationService.acceptInvitation(id, {
        name: values.name,
        password: values.password,
        confirmPassword: values.confirmPassword
      });

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Account created successfully! Please login with your new credentials.',
            email: invitation.email
          }
        });
      }, 3000);

    } catch (error) {
      setError(error.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#00072D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Spin size="large" style={{ color: '#ffffff' }} />
      </div>
    );
  }

  if (error) {
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
          <Col xs={24} sm={20} md={16} lg={12} xl={8}>
            <Card 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ color: '#ff4d4f' }}>Invalid Invitation</Title>
                <Alert
                  message="Invitation Error"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 20 }}
                />
                <Button type="primary" onClick={() => navigate('/login')}>
                  Go to Login
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  if (success) {
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
          <Col xs={24} sm={20} md={16} lg={12} xl={8}>
            <Card 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 20 }} />
                <Title level={2} style={{ color: '#52c41a' }}>Welcome to CN Terminal!</Title>
                <Paragraph>
                  Your account has been created successfully. You will be redirected to the login page shortly.
                </Paragraph>
                <Alert
                  message="Account Created"
                  description="Please use your email and password to login."
                  type="success"
                  showIcon
                />
              </div>
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
        {/* Logo and Brand - Outside the form */}
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
            Account Setup
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
            Complete your account setup to join our team
          </Text>
        </Col>
        
        {/* Setup Form Card */}
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card 
            style={{ 
              borderRadius: '16px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)'
            }}
          >

            {/* Setup Form */}
            <Form
              form={form}
              name="accept-invitation"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                label="Email Address"
              >
                <Input 
                  prefix={<MailOutlined />} 
                  value={invitation?.email}
                  disabled
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    fontWeight: '500'
                  }}
                />
              </Form.Item>

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
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter a password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                  { 
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                  }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Create a strong password"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
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
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 20 }}
                />
              )}

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                  style={{ width: '100%', height: '48px', fontSize: '16px' }}
                >
                  Create Account & Join CN Terminal
                </Button>
              </Form.Item>
            </Form>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Already have an account?{' '}
                  <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0 }}>
                    Sign in here
                  </Button>
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  This invitation was sent by your administrator.
                </Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AcceptInvitationPage;
