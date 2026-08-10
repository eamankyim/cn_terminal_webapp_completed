import React, { useEffect, useState } from 'react';
import { Select, Button, Modal, Form, Row, Col, message, Input, Space, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import consignmentService from '../../services/consignmentService';

const { Option } = Select;
const { TextArea } = Input;

const ConsigneeSelector = ({
  value,
  onChange,
  customerId,
  placeholder = 'Select a consignee or N/A',
  style = {},
  allowCreate = true,
}) => {
  const [consignments, setConsignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm] = Form.useForm();

  const loadConsignments = async (id) => {
    if (!id) {
      setConsignments([]);
      return;
    }
    setLoading(true);
    try {
      const response = await consignmentService.getConsignmentsByCustomer(id);
      setConsignments(response.consignments || []);
    } catch (error) {
      setConsignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsignments(customerId);
  }, [customerId]);

  const handleSelect = (consignmentId) => {
    if (onChange) {
      onChange(consignmentId);
    }
  };

  const openCreateModal = () => {
    if (!customerId) {
      message.warning('Please select a client first before adding a consignee.');
      return;
    }
    setIsCreateModalVisible(true);
  };

  const handleCreateConsignee = async () => {
    try {
      const values = await createForm.validateFields();
      if (!customerId) {
        message.warning('Please select a client first before adding a consignee.');
        return;
      }

      setCreating(true);
      const response = await consignmentService.createConsignment({
        customerId,
        consigneeName: values.consigneeName.trim(),
        consigneePhone: values.consigneePhone.trim(),
        consigneeAddress: values.consigneeAddress.trim(),
        ...(values.ghanaCard?.trim() ? { ghanaCard: values.ghanaCard.trim() } : {}),
        ...(values.tin?.trim() ? { tin: values.tin.trim() } : {}),
      });

      const newConsignment = response.consignment;
      message.success('Consignee created successfully!');
      setIsCreateModalVisible(false);
      createForm.resetFields();

      setConsignments((prev) => [newConsignment, ...prev.filter((c) => c.id !== newConsignment.id)]);
      handleSelect(newConsignment.id);
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      message.error(error.message || error.error || 'Failed to create consignee');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Space.Compact style={{ width: '100%', ...style }}>
        <Select
          value={value === undefined ? undefined : value}
          onChange={handleSelect}
          placeholder={
            !customerId
              ? 'Select a client first'
              : loading
                ? 'Loading consignees…'
                : placeholder
          }
          style={{ flex: 1, width: '100%' }}
          allowClear
          loading={loading}
          disabled={!customerId && !loading}
          dropdownRender={(menu) => (
            <>
              {menu}
              {allowCreate && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ padding: '0 8px 8px' }}>
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={openCreateModal}
                      disabled={!customerId}
                      style={{ padding: 0, width: '100%', textAlign: 'left' }}
                    >
                      Create consignee
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
          notFoundContent={
            loading ? (
              <div style={{ padding: '8px', textAlign: 'center' }}>
                <span>Loading consignees...</span>
              </div>
            ) : !customerId ? (
              <div style={{ padding: '8px', textAlign: 'center' }}>
                <span>Select a client to see consignees</span>
              </div>
            ) : (
              <div style={{ padding: '8px', textAlign: 'center' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span>No consignees for this client</span>
                </div>
                {allowCreate && (
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={openCreateModal}
                    style={{ width: '100%' }}
                  >
                    Create First Consignee
                  </Button>
                )}
              </div>
            )
          }
        >
          <Option key="na" value={null}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#999' }}>N/A</span>
              <span style={{ fontSize: '12px', color: '#999' }}>- Not Available (Add Later)</span>
            </div>
          </Option>
          {customerId && consignments.length > 0 && (
            <>
              <Option disabled key="divider" style={{ borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '11px', color: '#999', fontWeight: 'bold' }}>
                  CONSIGNEES FOR SELECTED CLIENT
                </span>
              </Option>
              {consignments.map((consignment) => (
                <Option key={consignment.id} value={consignment.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {consignment.trackingId
                        ? `${consignment.trackingId} - ${consignment.consigneeName}`
                        : consignment.consigneeName}
                    </span>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {consignment.trackingId ? consignment.status : 'ID pending job'}
                    </span>
                  </div>
                </Option>
              ))}
            </>
          )}
        </Select>
        {allowCreate && (
          <Button
            type="default"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            title={customerId ? 'Create consignee' : 'Select a client first'}
            disabled={!customerId}
          >
            Create
          </Button>
        )}
      </Space.Compact>

      <Modal
        title="Create New Consignee"
        open={isCreateModalVisible}
        onOk={handleCreateConsignee}
        confirmLoading={creating}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
        }}
        okText="Create Consignee"
        cancelText="Cancel"
        width={700}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="consigneeName"
                label="Consignee Name"
                rules={[{ required: true, message: 'Please enter consignee name' }]}
              >
                <Input placeholder="Enter consignee name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="consigneePhone"
                label="Consignee Phone"
                rules={[{ required: true, message: 'Please enter consignee phone' }]}
              >
                <Input placeholder="Enter consignee phone" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="ghanaCard" label="Ghana Card Number">
                <Input placeholder="GHA-XXXXXXXXX-X" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tin" label="TIN">
                <Input placeholder="Enter TIN" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="consigneeAddress"
            label="Consignee Address"
            rules={[{ required: true, message: 'Please enter consignee address' }]}
          >
            <TextArea rows={2} placeholder="Enter consignee address" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ConsigneeSelector;
