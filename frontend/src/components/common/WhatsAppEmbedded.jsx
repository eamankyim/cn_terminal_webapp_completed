import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Form, message, Avatar, Typography, Space, Divider, Card, Select, Tag, Alert } from 'antd';
import { WhatsAppOutlined, SendOutlined, PhoneOutlined, UserOutlined, MessageOutlined, LinkOutlined } from '@ant-design/icons';
import { CONTACT_CONFIG } from '../../config/contactConfig';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const WhatsAppEmbedded = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [showIframe, setShowIframe] = useState(false);

  // Sample customer contacts (replace with real data from your database)
  const customerContacts = [
    { id: 1, name: 'John Doe', phone: '244123456', lastMessage: 'Hi, I need help with my shipment', time: '2 min ago', status: 'active' },
    { id: 2, name: 'Jane Smith', phone: '244123457', lastMessage: 'When will my package arrive?', time: '5 min ago', status: 'active' },
    { id: 3, name: 'Mike Johnson', phone: '244123458', lastMessage: 'Thank you for the update', time: '1 hour ago', status: 'inactive' },
    { id: 4, name: 'Sarah Wilson', phone: '244123459', lastMessage: 'Can I track my order?', time: '2 hours ago', status: 'active' },
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
      
      // Create WhatsApp Web URL
      const url = `https://web.whatsapp.com/send?phone=${phoneWithCountryCode}&text=${encodedMessage}`;
      setWhatsappUrl(url);
      setShowIframe(true);
      
      message.success('Opening WhatsApp Web...');
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
    setWhatsappUrl(whatsappUrl);
    setShowIframe(true);
  };

  const openInNewTab = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    }
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
      width={1200}
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

        {!showIframe ? (
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
                        <Tag color={contact.status === 'active' ? 'green' : 'default'} size="small">
                          {contact.status}
                        </Tag>
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
                      Open WhatsApp Web
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          </div>
        ) : (
          <div style={{ height: '600px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5}>WhatsApp Web</Title>
              <Space>
                <Button 
                  icon={<LinkOutlined />}
                  onClick={openInNewTab}
                >
                  Open in New Tab
                </Button>
                <Button onClick={() => setShowIframe(false)}>
                  Back to Form
                </Button>
              </Space>
            </div>
            
            <Alert
              message="WhatsApp Web Integration"
              description="WhatsApp Web is now embedded below. You can send messages directly to customers. If the iframe doesn't load, click 'Open in New Tab' to use WhatsApp Web in a separate window."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <div style={{ 
              height: '500px', 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <iframe
                src={whatsappUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="WhatsApp Web"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </div>
        )}

        <Divider />

        <div style={{ padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 <strong>How it works:</strong> This embeds WhatsApp Web directly in your application. 
            You can send messages to customers without leaving your terminal management system. 
            All messages are sent through your official WhatsApp Business account.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppEmbedded;
