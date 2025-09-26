import React, { useState, useEffect } from 'react';
import moment from 'moment';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Button,
  message,
  Space,
  Card,
  Typography,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import payoutService from '../../services/payoutService';
import jobService from '../../services/jobService';

const { Title, Text } = Typography;

const PayoutRecordForm = ({ visible, onCancel, onSuccess, initialData = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [fileList, setFileList] = useState([]);

  const payoutCategories = payoutService.getPayoutCategories();
  const paymentMethods = payoutService.getPaymentMethods();

  useEffect(() => {
    if (visible) {
      loadJobs();
      if (initialData) {
        form.setFieldsValue({
          ...initialData,
          payoutDate: initialData.payoutDate ? moment(initialData.payoutDate) : null
        });
      } else {
        form.resetFields();
        setFileList([]);
      }
    }
  }, [visible, initialData, form]);

  const loadJobs = async () => {
    try {
      const response = await jobService.getJobs({ status: 'INVOICED,RELEASED,CLEARED' });
      setJobs(response.jobs || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      message.error('Failed to load jobs');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Prepare form data
      const formData = {
        amount: values.amount,
        category: values.category,
        recipientName: values.recipientName,
        recipientAccount: values.recipientAccount,
        paymentMethod: values.paymentMethod,
        description: values.description,
        paymentDate: values.paymentDate ? values.paymentDate.toISOString() : new Date().toISOString(),
        jobId: values.jobId || null
      };

      // Handle file upload if any
      if (fileList.length > 0 && fileList[0].originFileObj) {
        // TODO: Implement file upload service
        message.info('Document upload will be implemented with file service');
      }

      await payoutService.createPayoutRecord(formData);
      
      message.success('Payout record created successfully');
      form.resetFields();
      setFileList([]);
      onSuccess();
      onCancel();
    } catch (error) {
        console.error('Error creating payout record:', error);
        message.error(error.response?.data?.error || 'Failed to create payout record');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  const uploadProps = {
    name: 'file',
    fileList,
    beforeUpload: (file) => {
      const isPDF = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      if (!isPDF && !isImage) {
        message.error('You can only upload PDF or image files!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined />
          {initialData ? 'Edit Payout Record' : 'New Payout Record'}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            paymentDate: moment(),
            category: 'OPERATIONS',
            paymentMethod: 'BANK_TRANSFER'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Amount (GHS)"
                name="amount"
                rules={[
                  { required: true, message: 'Please enter the payout amount' },
                  { type: 'number', min: 0.01, message: 'Amount must be greater than 0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  min={0.01}
                  step={0.01}
                  precision={2}
                  prefix="₵"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select a category' }]}
              >
                <Select placeholder="Select payout category">
                  {payoutCategories.map(category => (
                    <Select.Option key={category.value} value={category.value}>
                      {category.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Recipient Name"
                name="recipientName"
                rules={[{ required: true, message: 'Please enter recipient name' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter recipient name"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Account Details"
                name="recipientAccount"
                rules={[{ required: true, message: 'Please enter account details' }]}
              >
                <Input
                  placeholder="Account number, mobile money number, etc."
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Payment Method"
                name="paymentMethod"
                rules={[{ required: true, message: 'Please select payment method' }]}
              >
                <Select placeholder="Select payment method">
                  {paymentMethods.map(method => (
                    <Select.Option key={method.value} value={method.value}>
                      {method.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Payment Date"
                name="paymentDate"
                rules={[{ required: true, message: 'Please select the payment date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="Select date"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Related Job (Optional)"
            name="jobId"
            tooltip="Link this payout to a specific job for tracking"
          >
            <Select
              placeholder="Select job (optional)"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {jobs.map(job => (
                <Select.Option key={job.id} value={job.id}>
                  {job.trackingId} - {job.goodsType}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please provide a description' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Provide a detailed description of the payout purpose..."
            />
          </Form.Item>

          <Form.Item
            label="Supporting Documents (Optional)"
            name="documents"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                Upload Documents
              </Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Upload receipts, contracts, or other supporting documents (PDF, images only, max 10MB)
            </Text>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
              >
                {loading ? 'Creating...' : 'Create Payout Record'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

    </Modal>
  );
};

export default PayoutRecordForm;
