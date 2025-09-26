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
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import expenseService from '../../services/expenseService';
import jobService from '../../services/jobService';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ExpenseRequestForm = ({ visible, onCancel, onSuccess, initialData = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [fileList, setFileList] = useState([]);
  const { currentUser } = useAuth();

  const expenseCategories = expenseService.getExpenseCategories();

  useEffect(() => {
    if (visible) {
      loadJobs();
      if (initialData) {
        form.setFieldsValue({
          ...initialData,
          expenseDate: initialData.expenseDate ? moment(initialData.expenseDate) : null
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
        description: values.description,
        expenseDate: values.expenseDate ? values.expenseDate.toISOString() : new Date().toISOString(),
        jobId: values.jobId || null
      };

      // Handle file upload if any
      if (fileList.length > 0 && fileList[0].originFileObj) {
        // TODO: Implement file upload service
        // For now, we'll just show a message
        message.info('Receipt upload will be implemented with file service');
      }

      await expenseService.createExpenseRequest(formData);
      
      message.success('Expense request submitted successfully');
      form.resetFields();
      setFileList([]);
      onSuccess && onSuccess();
      onCancel();
    } catch (error) {
      console.error('Error submitting expense request:', error);
      message.error(error.response?.data?.error || 'Failed to submit expense request');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      message.error('You can only upload image or PDF files!');
      return false;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must be smaller than 5MB!');
      return false;
    }
    
    return false; // Prevent auto upload
  };

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined />
          {initialData ? 'Edit Expense Request' : 'New Expense Request'}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            expenseDate: moment(),
            category: 'MISCELLANEOUS'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Amount (GHS)"
                name="amount"
                rules={[
                  { required: true, message: 'Please enter the expense amount' },
                  { type: 'number', min: 0.01, message: 'Amount must be greater than 0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  precision={2}
                  min={0.01}
                  prefix={<DollarOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select a category' }]}
              >
                <Select placeholder="Select expense category">
                  {expenseCategories.map(category => (
                    <Option key={category.value} value={category.value}>
                      <Space>
                        <span>{category.label}</span>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {category.description}
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Expense Date"
                name="expenseDate"
                rules={[{ required: true, message: 'Please select the expense date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="Select date"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Related Job (Optional)"
                name="jobId"
                tooltip="Link this expense to a specific job for tracking"
              >
                <Select
                  placeholder="Select a job"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {jobs.map(job => (
                    <Option key={job.id} value={job.id}>
                      <Space direction="vertical" size={0}>
                        <Text strong>{job.trackingId}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {job.customer?.name} • {job.status}
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Please enter a description' },
              { min: 10, message: 'Description must be at least 10 characters' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Provide a detailed description of the expense..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Receipt (Optional)"
            name="receipt"
            tooltip="Upload a receipt or supporting document"
          >
            <Upload
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={beforeUpload}
              listType="picture-card"
              maxCount={1}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload Receipt</div>
                </div>
              )}
            </Upload>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 8 }}>
              Supported formats: JPG, PNG, PDF (Max 5MB)
            </Text>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                <PlusOutlined />
                Submit Request
              </Button>
              <Button onClick={onCancel}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
};

export default ExpenseRequestForm;

