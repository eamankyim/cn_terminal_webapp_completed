import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Button,
  Space,
  Typography,
  message,
  Divider
} from 'antd';
import { ArrowDownOutlined } from '@ant-design/icons';
import apiService from '../../services/api';
import cashflowService from '../../services/cashflowService';
import payoutService from '../../services/payoutService';

const { Text } = Typography;
const { Option } = Select;

const OPEN_STATUSES = ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'];

const invoicePaidTotal = (invoice) =>
  (invoice?.payments || [])
    .filter((p) => p.status !== 'FAILED' && p.status !== 'CANCELLED')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

const CashInForm = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const customerId = Form.useWatch('customerId', form);
  const invoiceId = Form.useWatch('invoiceId', form);
  const paymentType = Form.useWatch('paymentType', form);

  useEffect(() => {
    if (!visible) return;
    form.resetFields();
    setShowNewCustomer(false);
    setInvoices([]);
    form.setFieldsValue({
      paymentType: 'FULL',
      paymentMethod: 'MOBILE_MONEY'
    });
    loadCustomers();
  }, [visible, form]);

  const loadCustomers = async () => {
    try {
      const response = await apiService.getCustomersForSelector();
      setCustomers(response.customers || []);
    } catch (error) {
      setCustomers([]);
    }
  };

  useEffect(() => {
    const loadInvoices = async () => {
      if (!customerId) {
        setInvoices([]);
        form.setFieldsValue({ invoiceId: undefined, amount: undefined });
        return;
      }
      try {
        const response = await apiService.getInvoices({
          customerId,
          limit: 100
        });
        const open = (response.invoices || []).filter((invoice) => {
          const remaining = Number(invoice.amount) - invoicePaidTotal(invoice);
          return OPEN_STATUSES.includes(invoice.status) && remaining > 0.009;
        });
        setInvoices(open);
        form.setFieldsValue({ invoiceId: undefined, amount: undefined });
      } catch (error) {
        setInvoices([]);
      }
    };
    loadInvoices();
  }, [customerId, form]);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === invoiceId),
    [invoices, invoiceId]
  );
  const remaining = selectedInvoice
    ? Math.max(0, Number(selectedInvoice.amount) - invoicePaidTotal(selectedInvoice))
    : 0;

  useEffect(() => {
    if (!selectedInvoice) return;
    if (paymentType === 'FULL') {
      form.setFieldsValue({ amount: Number(remaining.toFixed(2)) });
    }
  }, [selectedInvoice, paymentType, remaining, form]);

  const handleCreateCustomer = async () => {
    try {
      const name = form.getFieldValue('newCustomerName')?.trim();
      const phone = form.getFieldValue('newCustomerPhone')?.trim();
      const address = form.getFieldValue('newCustomerAddress')?.trim() || 'N/A';
      if (!name || !phone) {
        message.error('Enter customer name and phone');
        return;
      }
      setSavingCustomer(true);
      const created = await apiService.createCustomer({
        name,
        phone,
        address,
        customerType: 'INDIVIDUAL'
      });
      const customer = created.customer || created;
      await loadCustomers();
      setShowNewCustomer(false);
      form.setFieldsValue({ customerId: customer.id });
      message.success('Customer created');
    } catch (error) {
      message.error(error.response?.data?.error || error.message || 'Failed to create customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await cashflowService.recordCashIn({
        customerId: values.customerId,
        invoiceId: values.invoiceId,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        accountName: values.accountName.trim()
      });
      message.success(
        values.paymentType === 'FULL'
          ? 'Full payment recorded'
          : 'Partial payment recorded'
      );
      onSuccess && onSuccess();
      onCancel();
    } catch (error) {
      message.error(error.response?.data?.error || error.message || 'Failed to record cash in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ArrowDownOutlined />
          Cash In
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={560}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Record money received from a customer against an invoice. Account name is the bank or MoMo name the customer gave you.
      </Text>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ paymentType: 'FULL', paymentMethod: 'MOBILE_MONEY' }}
      >
        <Form.Item
          name="customerId"
          label="Customer"
          rules={[{ required: true, message: 'Select or create a customer' }]}
        >
          <Select
            showSearch
            placeholder="Select customer"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {customers.map((customer) => (
              <Option key={customer.id} value={customer.id}>
                {customer.email ? `${customer.name} (${customer.email})` : customer.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Button type="link" style={{ padding: 0, marginBottom: 12 }} onClick={() => setShowNewCustomer(!showNewCustomer)}>
          {showNewCustomer ? 'Hide new customer' : 'Create customer'}
        </Button>

        {showNewCustomer && (
          <div style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Form.Item name="newCustomerName" label="Customer name">
              <Input placeholder="Customer name" />
            </Form.Item>
            <Form.Item name="newCustomerPhone" label="Phone">
              <Input placeholder="Phone number" />
            </Form.Item>
            <Form.Item name="newCustomerAddress" label="Address">
              <Input placeholder="Address (optional)" />
            </Form.Item>
            <Button onClick={handleCreateCustomer} loading={savingCustomer}>
              Save customer
            </Button>
          </div>
        )}

        <Form.Item
          name="invoiceId"
          label="Invoice"
          rules={[{ required: true, message: 'Select an invoice' }]}
        >
          <Select
            placeholder={customerId ? 'Select an unpaid invoice' : 'Select a customer first'}
            disabled={!customerId}
            notFoundContent={customerId ? 'No unpaid invoices for this customer' : null}
          >
            {invoices.map((invoice) => {
              const left = Number(invoice.amount) - invoicePaidTotal(invoice);
              return (
                <Option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} · remaining GH₵{left.toFixed(2)}
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        {selectedInvoice && (
          <Text style={{ display: 'block', marginBottom: 12 }}>
            Invoice total {cashflowService.formatAmount(selectedInvoice.amount)} · remaining{' '}
            <Text strong>{cashflowService.formatAmount(remaining)}</Text>
          </Text>
        )}

        <Form.Item name="paymentType" label="Payment">
          <Radio.Group disabled={!selectedInvoice}>
            <Radio value="FULL">Full remaining</Radio>
            <Radio value="PARTIAL">Partial payment</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount (GHS)"
          rules={[
            { required: true, message: 'Enter the amount received' },
            {
              validator: (_, value) => {
                if (!value || value <= 0) {
                  return Promise.reject(new Error('Amount must be greater than 0'));
                }
                if (remaining && value - remaining > 0.009) {
                  return Promise.reject(new Error('Amount cannot exceed the remaining balance'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            precision={2}
            disabled={!selectedInvoice || paymentType === 'FULL'}
          />
        </Form.Item>

        <Form.Item
          name="paymentMethod"
          label="Payment method"
          rules={[{ required: true, message: 'Select a payment method' }]}
        >
          <Select>
            {payoutService.getPaymentMethods().map((method) => (
              <Option key={method.value} value={method.value}>
                {method.label}
              </Option>
            ))}
            <Option value="CARD">Card</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="accountName"
          label="Account name"
          extra="Bank or MoMo name the customer gave you"
          rules={[{ required: true, message: 'Enter the bank or MoMo account name' }]}
        >
          <Input placeholder="e.g. MTN MoMo - Ama Mensah" />
        </Form.Item>

        <Divider />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Record cash in
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default CashInForm;
