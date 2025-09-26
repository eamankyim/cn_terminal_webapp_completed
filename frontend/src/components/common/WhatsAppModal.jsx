import React, { useState } from 'react';
import { Modal, Button, Input, Form, message, Avatar, Typography, Space, Divider, Card } from 'antd';
import { WhatsAppOutlined, SendOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { CONTACT_CONFIG } from '../../config/contactConfig';

const { TextArea } = Input;
const { Title, Text } = Typography;

const WhatsAppModal = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (values) => {
    setLoading(true);
    try {
      const { name, phone, message: messageText } = values;
      
      // Format phone number (remove any non-digits and add country code if needed)
      const cleanPhone = phone.replace(/\D/g, '');
      const phoneWithCountryCode = cleanPhone.startsWith('233') ? cleanPhone : `233${cleanPhone}`;
      
      // Create WhatsApp message
      const whatsappMessage = `Hello! I'm ${name} from CN Terminal. ${messageText}`;
      const encodedMessage = encodeURIComponent(whatsappMessage);
      
      // Open WhatsApp Web/App
      const whatsappUrl = `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
      message.success('Opening WhatsApp...');
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Failed to open WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickContact = (type, value) => {
    if (type === 'whatsapp') {
      const whatsappUrl = `https://wa.me/233${value.replace(/\D/g, '')}`;
      window.open(whatsappUrl, '_blank');
    } else if (type === 'phone') {
      window.open(`tel:${value}`, '_self');
    } else if (type === 'email') {
      window.open(`mailto:${value}`, '_self');
    }
  };

  return (
    <Modal
      className="whatsapp-modal"
      title={
        <Space>
          <Avatar 
            style={{ backgroundColor: '#25D366' }} 
            icon={<WhatsAppOutlined />} 
          />
          <Title level={4} style={{ margin: 0, color: 'white' }}>
            Contact Us via WhatsApp
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
    >
      <div style={{ padding: '20px 0' }}>
        {/* Business Info */}
        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <EnvironmentOutlined style={{ color: '#1890ff' }} />
              <Text strong>{CONTACT_CONFIG.business.name}</Text>
            </Space>
            <Space>
              <ClockCircleOutlined style={{ color: '#52c41a' }} />
              <Text type="secondary">{CONTACT_CONFIG.business.hours}</Text>
            </Space>
          </Space>
        </Card>

        {/* Quick Contact Options */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={5}>Quick Contact</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              icon={<WhatsAppOutlined />}
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
              block
              onClick={() => handleQuickContact('whatsapp', CONTACT_CONFIG.whatsapp.primary.number)}
            >
              WhatsApp: {CONTACT_CONFIG.whatsapp.primary.display}
            </Button>
            <Button 
              icon={<PhoneOutlined />}
              block
              onClick={() => handleQuickContact('phone', CONTACT_CONFIG.phone.primary)}
            >
              Call: {CONTACT_CONFIG.phone.display}
            </Button>
            <Button 
              icon={<MailOutlined />}
              block
              onClick={() => handleQuickContact('email', CONTACT_CONFIG.email.primary)}
            >
              Email: {CONTACT_CONFIG.email.primary}
            </Button>
          </Space>
        </div>

        <Divider>Or Send a Message</Divider>

        {/* Message Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSendMessage}
        >
          <Form.Item
            name="name"
            label="Your Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please enter your phone number' },
              { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number' }
            ]}
          >
            <Input 
              placeholder="e.g., 0244123456 or +233244123456" 
              addonBefore="+233"
            />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please enter your message' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Type your message here..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SendOutlined />}
                style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
              >
                Send via WhatsApp
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 <strong>Tip:</strong> This will open WhatsApp Web or the WhatsApp app on your device. 
            Make sure you have WhatsApp installed for the best experience.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppModal;
