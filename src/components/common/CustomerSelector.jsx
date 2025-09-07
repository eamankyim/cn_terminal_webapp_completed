import React, { useState } from 'react';
import { Select, Input, Button, Modal, Form, Row, Col, message } from 'antd';
import { PlusOutlined, UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useCustomers } from '../../contexts/CustomerContext';

const { Option } = Select;
const { TextArea } = Input;

const CustomerSelector = ({ 
  value, 
  onChange, 
  placeholder = "Select or search customer",
  style = {},
  allowCreate = true
}) => {
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [createForm] = Form.useForm();
  const { customers, addCustomer } = useCustomers();

  // Filter customers based on search text
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.phone.includes(searchText)
  );

  const handleCustomerSelect = (customerId) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (selectedCustomer && onChange) {
      onChange(customerId, selectedCustomer);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      const values = await createForm.validateFields();
      
      // Add customer to centralized context
      const newCustomer = await addCustomer({
        ...values,
        customerType: values.customerType || 'Regular'
      });
      
      message.success('Customer created successfully!');
      setIsCreateModalVisible(false);
      createForm.resetFields();
      
      // Auto-select the newly created customer
      handleCustomerSelect(newCustomer.id);
      
    } catch (error) {
      console.error('Failed to create customer:', error);
      message.error(error.message || 'Failed to create customer');
    }
  };

  const getSelectedCustomer = () => {
    return customers.find(c => c.id === value);
  };

  const selectedCustomer = getSelectedCustomer();

  return (
    <>
      <Select
        value={value}
        onChange={handleCustomerSelect}
        placeholder={placeholder}
        style={{ width: '100%', ...style }}
        showSearch
        filterOption={false}
        onSearch={setSearchText}
        notFoundContent={
          allowCreate ? (
            <div style={{ padding: '8px', textAlign: 'center' }}>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
                style={{ width: '100%' }}
              >
                Create New Customer
              </Button>
            </div>
          ) : (
            <span>No customers found</span>
          )
        }
      >
        {filteredCustomers.map(customer => (
          <Option key={customer.id} value={customer.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{customer.name}</span>
              <span style={{ fontSize: '12px', color: '#999' }}>{customer.email}</span>
            </div>
          </Option>
        ))}
      </Select>

      {/* Customer details preview */}
      {selectedCustomer && (
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <Row gutter={16}>
            <Col span={8}>
              <small><UserOutlined /> {selectedCustomer.name}</small>
            </Col>
            <Col span={8}>
              <small><MailOutlined /> {selectedCustomer.email}</small>
            </Col>
            <Col span={8}>
              <small><PhoneOutlined /> {selectedCustomer.phone}</small>
            </Col>
          </Row>
        </div>
      )}

      {/* Create New Customer Modal */}
      <Modal
        title="Create New Customer"
        open={isCreateModalVisible}
        onOk={handleCreateCustomer}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
        }}
        okText="Create Customer"
        cancelText="Cancel"
        width={800}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{
            customerType: 'Regular',
            country: 'Ghana',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter customer name!' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter email address!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number!' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerType"
                label="Customer Type"
                rules={[{ required: true, message: 'Please select customer type!' }]}
              >
                <Select>
                  <Option value="Regular">Regular</Option>
                  <Option value="Premium">Premium</Option>
                  <Option value="VIP">VIP</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address!' }]}
          >
            <TextArea rows={3} placeholder="Enter full address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city!' }]}
              >
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: 'Please select country!' }]}
              >
                <Select>
                  <Option value="Ghana">Ghana</Option>
                  <Option value="Nigeria">Nigeria</Option>
                  <Option value="Kenya">Kenya</Option>
                  <Option value="South Africa">South Africa</Option>
                  <Option value="United Kingdom">United Kingdom</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <TextArea rows={3} placeholder="Any additional notes about the customer" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CustomerSelector;
