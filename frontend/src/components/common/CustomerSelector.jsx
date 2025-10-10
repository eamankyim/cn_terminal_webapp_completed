import React, { useState } from 'react';
import { Select, Button, Modal, Form, Row, Col, message, Checkbox, Input } from 'antd';
import { PlusOutlined, UserOutlined, PhoneOutlined, MailOutlined, SearchOutlined } from '@ant-design/icons';
import { useCustomers } from '../../contexts/CustomerContext';

const { Option } = Select;
const { TextArea } = Input;

const CustomerSelector = ({ 
  value, 
  onChange, 
  placeholder = "Select or search customer",
  style = {},
  allowCreate = true,
  multiple = false
}) => {
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [createForm] = Form.useForm();
  const { customers, addCustomer, loading } = useCustomers();

  // Filter customers based on search text
  const filteredCustomers = customers.filter(customer => {
    if (!searchText) return true;
    
    const searchTerm = searchText.toLowerCase().trim();
    return (
      customer.name?.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm) ||
      customer.phone?.includes(searchTerm) ||
      customer.companyName?.toLowerCase().includes(searchTerm) ||
      customer.contactPerson?.toLowerCase().includes(searchTerm)
    );
  });

  const handleCustomerSelect = (customerId) => {
    if (multiple) {
      // For multiselect, handle array of selected values
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.includes(customerId);
      
      let newValues;
      if (isSelected) {
        // Remove from selection
        newValues = currentValues.filter(id => id !== customerId);
      } else {
        // Add to selection
        newValues = [...currentValues, customerId];
      }
      
      if (onChange) {
        const selectedCustomers = newValues.map(id => customers.find(c => c.id === id)).filter(Boolean);
        onChange(newValues, selectedCustomers);
      }
    } else {
      // Single select behavior
      const selectedCustomer = customers.find(c => c.id === customerId);
      if (selectedCustomer && onChange) {
        onChange(customerId, selectedCustomer);
      }
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

      message.error(error.message || 'Failed to create customer');
    }
  };

  const getSelectedCustomers = () => {
    if (multiple) {
      const selectedIds = Array.isArray(value) ? value : [];
      return customers.filter(c => selectedIds.includes(c.id));
    } else {
      return customers.find(c => c.id === value) ? [customers.find(c => c.id === value)] : [];
    }
  };

  const selectedCustomers = getSelectedCustomers();

  return (
    <>
      <Select
        value={value}
        onChange={handleCustomerSelect}
        placeholder={multiple ? "Search and select multiple customers..." : "Search and select customer..."}
        style={{ width: '100%', ...style }}
        showSearch
        filterOption={false}
        onSearch={setSearchText}
        searchValue={searchText}
        allowClear
        loading={loading}
        popupMatchSelectWidth={false}
        mode={multiple ? "multiple" : undefined}
        maxTagCount={multiple ? "responsive" : undefined}
        suffixIcon={<SearchOutlined />}
        labelInValue={false}
        optionLabelProp="label"
        notFoundContent={
          loading ? (
            <div style={{ padding: '8px', textAlign: 'center' }}>
              <span>Loading customers...</span>
            </div>
          ) : filteredCustomers.length === 0 && customers.length > 0 ? (
            <div style={{ padding: '8px', textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}>
                <span>No customers found matching "{searchText}"</span>
              </div>
              {searchText && (
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  {filteredCustomers.length} of {customers.length} customers match
                </div>
              )}
              {allowCreate && (
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalVisible(true)}
                  style={{ width: '100%' }}
                >
                  Create New Customer
                </Button>
              )}
            </div>
          ) : customers.length === 0 ? (
            <div style={{ padding: '8px', textAlign: 'center' }}>
              <span>No customers available</span>
              {allowCreate && (
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalVisible(true)}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  Create First Customer
                </Button>
              )}
            </div>
          ) : (
            <span>No customers found</span>
          )
        }
      >
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => {
            const isSelected = multiple ? 
              (Array.isArray(value) ? value.includes(customer.id) : false) : 
              (value === customer.id);
            
            return (
              <Option key={customer.id} value={customer.id} label={customer.name}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {multiple && (
                    <Checkbox 
                      checked={isSelected}
                      onChange={() => handleCustomerSelect(customer.id)}
                      style={{ marginTop: '2px' }}
                    />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500' }}>{customer.name}</span>
                      <span style={{ fontSize: '11px', color: '#999' }}>
                        {customer.customerType || 'Regular'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>{customer.email}</span>
                      <span style={{ fontSize: '11px', color: '#999' }}>{customer.phone}</span>
                    </div>
                    {customer.companyName && (
                      <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                        {customer.companyName}
                      </div>
                    )}
                  </div>
                </div>
              </Option>
            );
          })
        ) : customers.length > 0 ? (
          customers.map(customer => {
            const isSelected = multiple ? 
              (Array.isArray(value) ? value.includes(customer.id) : false) : 
              (value === customer.id);
            
            return (
              <Option key={customer.id} value={customer.id} label={customer.name}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {multiple && (
                    <Checkbox 
                      checked={isSelected}
                      onChange={() => handleCustomerSelect(customer.id)}
                      style={{ marginTop: '2px' }}
                    />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500' }}>{customer.name}</span>
                      <span style={{ fontSize: '11px', color: '#999' }}>
                        {customer.customerType || 'Regular'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>{customer.email}</span>
                      <span style={{ fontSize: '11px', color: '#999' }}>{customer.phone}</span>
                    </div>
                    {customer.companyName && (
                      <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                        {customer.companyName}
                      </div>
                    )}
                  </div>
                </div>
              </Option>
            );
          })
        ) : (
          <Option disabled value="no-customers">
            No customers available
          </Option>
        )}
      </Select>

      {/* Customer details preview */}
      {selectedCustomers.length > 0 && (
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          {multiple ? (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                Selected Customers ({selectedCustomers.length}):
              </div>
              {selectedCustomers.map((customer, index) => (
                <div key={customer.id} style={{ 
                  marginBottom: index < selectedCustomers.length - 1 ? '4px' : '0',
                  padding: '4px 8px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8'
                }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <small><UserOutlined /> {customer.name}</small>
                    </Col>
                    <Col span={8}>
                      <small><MailOutlined /> {customer.email}</small>
                    </Col>
                    <Col span={8}>
                      <small><PhoneOutlined /> {customer.phone}</small>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          ) : (
            <Row gutter={16}>
              <Col span={8}>
                <small><UserOutlined /> {selectedCustomers[0]?.name}</small>
              </Col>
              <Col span={8}>
                <small><MailOutlined /> {selectedCustomers[0]?.email}</small>
              </Col>
              <Col span={8}>
                <small><PhoneOutlined /> {selectedCustomers[0]?.phone}</small>
              </Col>
            </Row>
          )}
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
