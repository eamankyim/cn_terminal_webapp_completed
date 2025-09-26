import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Form, message, Avatar, Typography, Space, Divider, Card, Select, Tag, Alert, Table, Badge } from 'antd';
import { WhatsAppOutlined, SendOutlined, PhoneOutlined, UserOutlined, MessageOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
import { CONTACT_CONFIG } from '../../config/contactConfig';
import apiService from '../../services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const WhatsAppCustomerIntegration = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [showIframe, setShowIframe] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Load customers from your database
  useEffect(() => {
    if (visible) {
      loadCustomers();
    }
  }, [visible]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/customers');
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      message.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (values) => {
    setLoading(true);
    try {
      const { customerId, message: messageText } = values;
      
      // Find customer details
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        message.error('Customer not found');
        return;
      }
      
      // Format phone number
      const cleanPhone = customer.phone.replace(/\D/g, '');
      const phoneWithCountryCode = cleanPhone.startsWith('233') ? cleanPhone : `233${cleanPhone}`;
      
      // Create WhatsApp message
      const whatsappMessage = `Hello ${customer.name}, this is CN Terminal. ${messageText}`;
      const encodedMessage = encodeURIComponent(whatsappMessage);
      
      // Create WhatsApp Web URL
      const url = `https://web.whatsapp.com/send?phone=${phoneWithCountryCode}&text=${encodedMessage}`;
      setWhatsappUrl(url);
      setShowIframe(true);
      
      message.success(`Opening WhatsApp Web for ${customer.name}...`);
    } catch (error) {
      message.error('Failed to open WhatsApp Web');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMessage = (customer) => {
    setSelectedCustomer(customer);
    form.setFieldsValue({
      customerId: customer.id,
      message: `Hello ${customer.name}, this is CN Terminal. How can I help you today?`
    });
  };

  const handleDirectWhatsApp = (customer) => {
    const cleanPhone = customer.phone.replace(/\D/g, '');
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

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.phone.includes(searchText)
  );

  const customerColumns = [
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            {text.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => <Tag color="green">+233 {phone}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'ACTIVE' ? 'success' : 'default'} 
          text={status} 
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="link"
            icon={<MessageOutlined />}
            onClick={() => handleQuickMessage(record)}
          >
            Message
          </Button>
          <Button
            size="small"
            type="link"
            icon={<WhatsAppOutlined />}
            onClick={() => handleDirectWhatsApp(record)}
          >
            WhatsApp
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <Avatar 
            style={{ backgroundColor: '#25D366' }} 
            icon={<WhatsAppOutlined />} 
          />
          <Title level={4} style={{ margin: 0, color: '#25D366' }}>
            WhatsApp Customer Integration
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1400}
      centered
      style={{ top: 20 }}
    >
      <div style={{ padding: '20px 0' }}>
        {/* Business Info */}
        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <UserOutlined style={{ color: '#1890ff' }} />
              <Text strong>{CONTACT_CONFIG.business.name} - Customer Communication</Text>
            </Space>
            <Text type="secondary">Send messages directly to your customers via WhatsApp Web</Text>
          </Space>
        </Card>

        {!showIframe ? (
          <div style={{ display: 'flex', gap: '20px', height: '600px' }}>
            {/* Left Panel - Customer List */}
            <div style={{ width: '60%', borderRight: '1px solid #f0f0f0', paddingRight: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <Title level={5}>Your Customers</Title>
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ marginBottom: '16px' }}
                />
              </div>
              
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <Table
                  columns={customerColumns}
                  dataSource={filteredCustomers}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10, size: 'small' }}
                  loading={loading}
                  onRow={(record) => ({
                    onClick: () => handleQuickMessage(record),
                    style: { cursor: 'pointer' }
                  })}
                />
              </div>
            </div>

            {/* Right Panel - Message Form */}
            <div style={{ width: '40%', paddingLeft: '20px' }}>
              <Title level={5}>Send Message</Title>
              
              {selectedCustomer && (
                <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#e6f7ff' }}>
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Text strong>{selectedCustomer.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        +233 {selectedCustomer.phone}
                      </Text>
                    </div>
                  </Space>
                </Card>
              )}
              
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSendMessage}
              >
                <Form.Item
                  name="customerId"
                  label="Select Customer"
                  rules={[{ required: true, message: 'Please select a customer' }]}
                >
                  <Select
                    placeholder="Choose a customer"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {customers.map(customer => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.name} - +233 {customer.phone}
                      </Option>
                    ))}
                  </Select>
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
                  Back to Customer List
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
            💡 <strong>How it works:</strong> This integrates with your customer database and embeds WhatsApp Web directly in your application. 
            You can send messages to any of your customers without leaving your terminal management system. 
            All messages are sent through your official WhatsApp Business account.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppCustomerIntegration;
