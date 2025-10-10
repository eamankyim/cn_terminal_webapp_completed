import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Form, message, Avatar, Typography, Space, Divider, Card, Select, Tag } from 'antd';
import { WhatsAppOutlined, SendOutlined, PhoneOutlined, MailOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import { CONTACT_CONFIG } from '../../config/contactConfig';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const WhatsAppWebModal = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');

  // Sample customer contacts (you can replace with real data from your database)
  const customerContacts = [
    { id: 1, name: 'John Doe', phone: '244123456', lastMessage: 'Hi, I need help with my shipment', time: '2 min ago' },
    { id: 2, name: 'Jane Smith', phone: '244123457', lastMessage: 'When will my package arrive?', time: '5 min ago' },
    { id: 3, name: 'Mike Johnson', phone: '244123458', lastMessage: 'Thank you for the update', time: '1 hour ago' },
    { id: 4, name: 'Sarah Wilson', phone: '244123459', lastMessage: 'Can I track my order?', time: '2 hours ago' },
  ];

  const handleSendMessage = async (values) => {
    setLoading(true);
    try {
      const { phone, message: messageText } = values;
      
      // Format phone number
      const cleanPhone = phone.replace(/\D/g, '');
      const phoneWithCountryCode = cleanPhone.startsWith('233') ? cleanPhone : `233${cleanPhone}`;
      
      // Create WhatsApp message
      const whatsappMessage = `Hello! This is CN Terminal. ${messageText}`;
      const encodedMessage = encodeURIComponent(whatsappMessage);
      
      // Open WhatsApp Web with the message
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneWithCountryCode}&text=${encodedMessage}`;
      
      // Add to message history
      const newMessage = {
        id: Date.now(),
        phone: phoneWithCountryCode,
        message: messageText,
        timestamp: new Date().toLocaleTimeString(),
        status: 'sent'
      };
      
      setMessageHistory(prev => [...prev, newMessage]);
      
      // Open WhatsApp Web in new tab
      window.open(whatsappUrl, '_blank');
      
      message.success('Opening WhatsApp Web...');
      form.resetFields();
    } catch (error) {
      message.error('Failed to open WhatsApp Web');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMessage = (contact) => {
    setSelectedContact(contact);
    form.setFieldsValue({
      phone: contact.phone,
      message: `Hello ${contact.name}, this is CN Terminal. How can I help you today?`
    });
  };

  const handleDirectWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountryCode = cleanPhone.startsWith('233') ? cleanPhone : `233${cleanPhone}`;
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneWithCountryCode}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Modal
      title={
        <Space>
          <Avatar 
            style={{ backgroundColor: '#25D366' }} 
            icon={<WhatsAppOutlined />} 
          />
          <Title level={4} style={{ margin: 0, color: '#25D366' }}>
            WhatsApp Web Integration
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      style={{ top: 20 }}
    >
      <div style={{ padding: '20px 0' }}>
        {/* Business Info */}
        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <UserOutlined style={{ color: '#1890ff' }} />
              <Text strong>{CONTACT_CONFIG.business.name} - Customer Support</Text>
            </Space>
            <Text type="secondary">Send messages directly to customers via WhatsApp Web</Text>
          </Space>
        </Card>

        <div style={{ display: 'flex', gap: '20px', height: '500px' }}>
          {/* Left Panel - Customer List */}
          <div style={{ width: '40%', borderRight: '1px solid #f0f0f0', paddingRight: '20px' }}>
            <Title level={5}>Recent Customers</Title>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {customerContacts.map(contact => (
                <Card
                  key={contact.id}
                  size="small"
                  hoverable
                  style={{ marginBottom: '8px', cursor: 'pointer' }}
                  onClick={() => handleQuickMessage(contact)}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space justify="space-between" style={{ width: '100%' }}>
                      <Text strong>{contact.name}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{contact.time}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {contact.lastMessage}
                    </Text>
                    <Space>
                      <Tag color="green">+233 {contact.phone}</Tag>
                      <Button
                        size="small"
                        type="link"
                        icon={<WhatsAppOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectWhatsApp(contact.phone);
                        }}
                      >
                        Open Chat
                      </Button>
                    </Space>
                  </Space>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Panel - Message Form */}
          <div style={{ width: '60%', paddingLeft: '20px' }}>
            <Title level={5}>Send Message</Title>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSendMessage}
            >
              <Form.Item
                name="phone"
                label="Customer Phone Number"
                rules={[
                  { required: true, message: 'Please enter phone number' },
                  { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number' }
                ]}
              >
                <Input 
                  placeholder="e.g., 0244123456 or +233244123456" 
                  addonBefore="+233"
                  prefix={<PhoneOutlined />}
                />
              </Form.Item>

              <Form.Item
                name="message"
                label="Message"
                rules={[{ required: true, message: 'Please enter your message' }]}
              >
                <TextArea 
                  rows={6} 
                  placeholder="Type your message here..."
                  maxLength={1000}
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
                    Send via WhatsApp Web
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            {/* Message History */}
            {messageHistory.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <Title level={5}>Recent Messages</Title>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '6px', padding: '10px' }}>
                  {messageHistory.slice(-5).map(msg => (
                    <div key={msg.id} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <Space justify="space-between" style={{ width: '100%' }}>
                        <Text strong>+{msg.phone}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{msg.timestamp}</Text>
                      </Space>
                      <Text style={{ fontSize: '12px' }}>{msg.message}</Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Divider />

        <div style={{ padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 <strong>How it works:</strong> This will open WhatsApp Web in a new tab with your message pre-filled. 
            You can then send the message directly to the customer. The customer will receive it as a normal WhatsApp message.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppWebModal;



