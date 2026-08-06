import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  message, 
  Space
} from 'antd';
import { 
  LockOutlined, 
  MailOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ForgotPassword from '../components/auth/ForgotPassword';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginForm] = Form.useForm();
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access
  const from = location.state?.from?.pathname || '/dashboard';

  // Show success message if redirected from somewhere
  React.useEffect(() => {
    if (location.state?.message) {
      message.success(location.state.message);
    }
  }, [location.state]);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await login(values.email, values.password);
      message.success('Login successful!');
      
      // Redirect based on user role
      const user = response.user;
      let redirectPath = from;
      
      // ENQUIRY_OFFICER and ENTRY_OFFICER should go to Jobs page instead of Dashboard
      if ((user.role === 'ENQUIRY_OFFICER' || user.role === 'ENTRY_OFFICER') && from === '/dashboard') {
        redirectPath = '/enquiries';
      }
      
      navigate(redirectPath, { replace: true });
    } catch (error) {
      message.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show forgot password component if requested
  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />;
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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {/* Logo and Brand - Outside the form */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            Internal Access Portal
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
            Sign in with your company credentials
          </Text>
        </div>
        
        {/* Login Form Card */}
        <Card 
          style={{ 
            borderRadius: '16px', 
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            width: '100%'
          }}
        >
            {/* Form Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={4} style={{ color: '#333', fontWeight: '600', margin: 0 }}>
                Sign In
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Enter your credentials to continue
              </Text>
            </div>

            {/* Login Form */}
            <Form
              form={loginForm}
              onFinish={handleLogin}
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

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter your password' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Enter your password"
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
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Space direction="vertical" size="small">
                <Button 
                  type="link" 
                  onClick={() => setShowForgotPassword(true)}
                  style={{ color: '#1890ff', padding: 0, height: 'auto' }}
                >
                  Forgot Password?
                </Button>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Need access? Contact your administrator for an invitation.
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  This is an internal company portal. Access is by invitation only.
                </Text>
              </Space>
            </div>
          </Card>
        </div>
    </div>
  );
};

export default LoginPage;
