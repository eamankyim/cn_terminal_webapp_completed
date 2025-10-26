import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Table, 
  Input, 
  Tag, 
  Modal, 
  Descriptions, 
  Row, 
  Col,
  Statistic,
  Select,
  DatePicker,
  Form,
  message,
  InputNumber,
  Divider,
  Badge,
  Drawer,
  Dropdown,
  Spin,
  Alert,
  Tabs,
  Empty,
  Collapse,
  Switch
} from 'antd';
import { 
  FileTextOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SendOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ShoppingCartOutlined,
  CalculatorOutlined,
  InfoCircleOutlined,
  CarOutlined,
  PrinterOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import invoiceService from '../services/invoiceService';
import estimateService from '../services/estimateService';
import jobService from '../services/jobService';
import configurationService from '../services/configurationService';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../utils/permissions';
import { calculateVAT, calculateTotalVAT, getVATExplanation } from '../utils/vatCalculator';
import { getJobStatusColor, getInvoiceStatusColor } from '../utils/statusUtils';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

// Payment Form Component
const PaymentForm = React.forwardRef(({ invoice, onSuccess }, ref) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Format the date properly for the API
      if (values.paymentDate) {
        values.paymentDate = values.paymentDate.format('YYYY-MM-DD');
      }
      
      await onSuccess(values);
    } catch (error) {

    }
  };

  // Expose handleSubmit through ref
  React.useImperativeHandle(ref, () => ({
    handleSubmit
  }));

  return (
    <div>
      <p style={{ marginBottom: '16px' }}>
        Please provide payment details for invoice <strong>{invoice.invoiceNumber}</strong>
      </p>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          paymentMethod: 'BANK_TRANSFER',
          paymentDate: null, // Let DatePicker handle the default
          amount: invoice.amount || 0
        }}
      >
        <Form.Item
          name="paymentMethod"
          label="Payment Method"
          rules={[{ required: true, message: 'Please select payment method' }]}
        >
          <Select>
            <Select.Option value="BANK_TRANSFER">Bank Transfer</Select.Option>
            <Select.Option value="CASH">Cash</Select.Option>
            <Select.Option value="MOBILE_MONEY">Mobile Money</Select.Option>
            <Select.Option value="CARD">Card Payment</Select.Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="paymentDate"
          label="Payment Date"
          rules={[{ required: true, message: 'Please select payment date' }]}
        >
          <DatePicker 
            style={{ width: '100%' }} 
            placeholder="Select payment date"
            defaultValue={null}
          />
        </Form.Item>
        
        <Form.Item
          name="amount"
          label="Amount Paid (GHS)"
          rules={[{ required: true, message: 'Please enter amount paid' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={value => `GHS ${Number(value || 0).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => parseFloat(value.replace(/GHS\s?|(,*)/g, '') || 0).toFixed(2)}
            min={0}
            step={0.01}
          />
        </Form.Item>
        
        <Form.Item
          name="transactionReference"
          label="Transaction Reference (Optional)"
        >
          <Input placeholder="Enter transaction reference or receipt number" />
        </Form.Item>
        
        <Form.Item
          name="paymentNotes"
          label="Payment Notes (Optional)"
        >
          <Input.TextArea 
            placeholder="Additional payment notes or comments"
            rows={3}
          />
        </Form.Item>
      </Form>
    </div>
  );
});

const InvoicesPage = () => {
  const { hasPermission } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [form] = Form.useForm();
  const [invoices, setInvoices] = useState([]);
  const [jobs, setJobs] = useState([]); // Jobs available for invoice creation (filtered)
  const [allJobs, setAllJobs] = useState([]); // All jobs for display in table
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('invoices');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [configurations, setConfigurations] = useState({});

  useEffect(() => {
    loadInvoices();
    loadConfigurations();
  }, []);

  // Reload jobs when invoices change to update filtering
  useEffect(() => {
    if (invoices.length >= 0) { // Only load jobs after invoices are loaded
      loadJobs();
    }
  }, [invoices]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await invoiceService.getInvoices({ limit: 100 });

      setInvoices(response.invoices || []);
    } catch (error) {

      // Check if it's an authentication error
      if (error.message.includes('Access token required') || error.message.includes('401')) {
        setError('Authentication required. Please log in again.');
      } else if (error.message.includes('403')) {
        setError('Access denied. You do not have permission to view invoices.');
      } else if (error.message.includes('500')) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Failed to load invoices: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      setJobsLoading(true);

      // Fetch all jobs
      const response = await jobService.getJobs({ limit: 100 });

      const allJobsData = response.jobs || [];
      
      // Set all jobs for display in table (status comes from database)
      setAllJobs(allJobsData);
      
      // Filter jobs available for invoice creation (any job without invoices, excluding drafts)
      const jobsForInvoicing = allJobsData.filter(job => 
        !job.isDraft &&
        !invoices.some(invoice => invoice.jobId === job.id)
      );

      setJobs(jobsForInvoicing);
    } catch (error) {

    } finally {
      setJobsLoading(false);
    }
  };

  const loadConfigurations = async () => {
    try {
      const response = await configurationService.getConfigurations();
      if (response.success) {
        setConfigurations(response.data);

      }
    } catch (error) {

    }
  };

  // Calculate VAT based on current form values and configuration
  const calculateVATForForm = (formValues) => {
    if (!formValues) return 0;

    const customDuty = parseFloat(formValues.customDuty || 0);
    const shippingCharges = parseFloat(formValues.shippingCharges || 0);
    const terminalCharges = parseFloat(formValues.terminalCharges || 0);
    const miscellaneous = parseFloat(formValues.miscellaneous || 0);
    const clearanceCharges = parseFloat(formValues.clearanceCharges || 0);
    const serviceCharge = parseFloat(formValues.serviceCharge || 0);
    
    // Calculate total of all charges (excluding VAT)
    const totalCharges = customDuty + shippingCharges + terminalCharges + miscellaneous + clearanceCharges + serviceCharge;
    
    // Get VAT rate from configuration (default 15%)
    const vatRate = parseFloat(configurations.VAT_RATE?.value || '15') / 100;
    
    // Calculate VAT on total charges
    const vatAmount = totalCharges * vatRate;
    
    return Math.round(vatAmount * 100) / 100; // Round to 2 decimal places
  };

  // Update VAT when other charges change
  const updateVATCalculation = (changedValues, allValues) => {
    const newVAT = calculateVATForForm(allValues);
    form.setFieldsValue({ vat: newVAT });
  };

  // Calculate total amount from all charges
  const calculateTotalAmount = (formValues) => {
    const customDuty = parseFloat(formValues.customDuty || 0);
    const shippingCharges = parseFloat(formValues.shippingCharges || 0);
    const terminalCharges = parseFloat(formValues.terminalCharges || 0);
    const miscellaneous = parseFloat(formValues.miscellaneous || 0);
    const clearanceCharges = parseFloat(formValues.clearanceCharges || 0);
    const serviceCharge = parseFloat(formValues.serviceCharge || 0);
    const vat = parseFloat(formValues.vat || 0);
    
    const total = customDuty + shippingCharges + terminalCharges + miscellaneous + clearanceCharges + serviceCharge + vat;
    return parseFloat(total.toFixed(2));
  };

  // Update total amount when any charge changes
  const updateTotalAmount = (changedValues, allValues) => {
    const newVAT = calculateVATForForm(allValues);
    const totalAmount = calculateTotalAmount({ ...allValues, vat: newVAT });
    form.setFieldsValue({ 
      vat: newVAT,
      totalAmount: totalAmount 
    });
  };

  // Using centralized status color utilities

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID': return '✓';
      case 'PENDING': return '⏳';
      case 'OVERDUE': return '⚠';
      case 'DRAFT': return '📝';
      default: return '';
    }
  };

  const getJobStatusColor = (status, isDraft) => {
    if (isDraft) return 'default';
    const statusColors = {
      'NEW': 'green',
      'PREINVOICED': 'blue',
      'INVOICED': 'purple',
      'ENTRY_COMPLETED': 'orange',
      'READY_FOR_RELEASE': 'geekblue',
      'RELEASE': 'cyan',
      'CLEARED': 'green',
      'DELIVERED': 'green'
    };
    return statusColors[status] || 'default';
  };

  const getJobStatusIcon = (status, isDraft) => {
    if (isDraft) return <FileTextOutlined />;
    const statusIcons = {
      'NEW': <PlusOutlined />,
      'PREINVOICED': <FileTextOutlined />,
      'INVOICED': <DollarOutlined />,
      'ENTRY_COMPLETED': <CalendarOutlined />,
      'READY_FOR_RELEASE': <CarOutlined />,
      'RELEASE': <CheckCircleOutlined />,
      'CLEARED': <CheckCircleOutlined />,
      'DELIVERED': <CheckCircleOutlined />
    };
    return statusIcons[status] || <FileTextOutlined />;
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // In a real implementation, this would trigger an API call with search parameters
    // For now, we'll do client-side filtering
    if (value) {
      const filtered = invoices.filter(invoice =>
        invoice.invoiceNumber?.toLowerCase().includes(value.toLowerCase()) ||
        invoice.customer?.name?.toLowerCase().includes(value.toLowerCase()) ||
        invoice.customer?.email?.toLowerCase().includes(value.toLowerCase())
      );
      setInvoices(filtered);
    } else {
      loadInvoices(); // Reload all invoices
    }
  };

  const handleViewInvoice = async (invoice) => {
    // Open drawer immediately with basic invoice data
    setSelectedInvoice(invoice);
    setIsModalVisible(true);
    
    // Load detailed data in the background
    try {
      const response = await invoiceService.getInvoice(invoice.id);
      setSelectedInvoice(response); // response is already the invoice object
    } catch (error) {

      message.error('Failed to load invoice details');
    }
  };

  const handlePrintInvoice = () => {
    setIsPrintModalVisible(true);
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const invoiceContent = document.getElementById('invoice-print');
    
    if (printWindow && invoiceContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${selectedInvoice?.invoiceNumber || ''}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background: white;
              visibility: hidden;
            }
            @media print {
              body {
                visibility: visible !important;
              }
            }
            @page {
              margin: 0.5in;
              size: A4;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          </style>
          <script>
            // Maximize the window when it loads
            window.onload = function() {
              if (window.screen) {
                window.moveTo(0, 0);
                window.resizeTo(screen.availWidth, screen.availHeight);
              }
            };
          </script>
        </head>
        <body>
          ${invoiceContent.outerHTML}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Hide the window content and print immediately
      printWindow.onload = () => {
        // Maximize the window
        if (printWindow.screen) {
          printWindow.moveTo(0, 0);
          printWindow.resizeTo(printWindow.screen.availWidth, printWindow.screen.availHeight);
        }
        
        printWindow.focus();
        printWindow.print();
        // Close after a short delay to allow print dialog to appear
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };
    } else {
      // Fallback to regular print
      window.print();
    }
  };

  const handleShareInvoice = () => {
    if (selectedInvoice?.customer?.email) {
      const subject = `Invoice ${selectedInvoice.invoiceNumber} - CN Terminal`;
      const body = `Dear ${selectedInvoice.customer.name},\n\nPlease find attached your invoice for the services provided.\n\nInvoice Number: ${selectedInvoice.invoiceNumber}\nAmount: GHS ${(selectedInvoice.amount || 0).toFixed(2)}\nDue Date: ${selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-GB') : 'N/A'}\n\nThank you for choosing CN Terminal for your terminal services.\n\nBest regards,\nCN Terminal Team`;
      
      const mailtoLink = `mailto:${selectedInvoice.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
    } else {
      message.error('Customer email not available for sharing');
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    
    // Set all form values including charges
    const formValues = {
      customerId: invoice.customerId,
      jobId: invoice.jobId,
      shipmentId: invoice.shipmentId,
      amount: invoice.amount,
      dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : null,
      blAmendment: invoice.blAmendment,
      comments: invoice.comments,
      // Set charges from the charges object
      customDuty: invoice.charges?.customDuty || 0,
      shippingCharges: invoice.charges?.shippingCharges || 0,
      terminalCharges: invoice.charges?.terminalCharges || 0,
      miscellaneous: invoice.charges?.miscellaneous || 0,
      clearanceCharges: invoice.charges?.clearanceCharges || 0,
      serviceCharge: invoice.charges?.serviceCharge || 0,
      vat: invoice.charges?.vat || 0
    };
    
    form.setFieldsValue(formValues);
    
    // Load jobs if not already loaded to ensure job information is available
    if (jobs.length === 0) {
      loadJobs();
    }
    
    setIsCreateModalVisible(true);
  };

  const handleDeleteInvoice = (invoiceId) => {
    Modal.confirm({
      title: 'Delete Invoice',
      content: 'Are you sure you want to delete this invoice? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Get the invoice to find the associated job
          const invoice = invoices.find(inv => inv.id === invoiceId);
          
          await invoiceService.deleteInvoice(invoiceId);
          
          // Revert job status back to PREINVOICED if invoice was deleted
          if (invoice && invoice.jobId) {
            try {

              const statusResponse = await jobService.updateJobStatus(invoice.jobId, 'PREINVOICED', 'Invoice deleted', null);

            } catch (statusError) {

              message.error('Invoice deleted but failed to revert job status');
              // Don't fail the entire operation if status update fails
            }
          }
          
          message.success('Invoice deleted successfully');
          loadInvoices(); // Reload invoices
        } catch (error) {
          message.error('Failed to delete invoice');
        }
      }
    });
  };

  const handleMarkAsPaid = async (invoiceId) => {
    const invoice = selectedInvoice;
    if (!invoice) return;

    // Create a modal with form for payment details
    let paymentFormRef = null;
    
    const modal = Modal.confirm({
      title: <span style={{ fontSize: '16px', fontWeight: '500' }}>Mark Invoice as Paid</span>,
      width: 500,
      icon: null,
      content: (
        <PaymentForm 
          ref={(ref) => { paymentFormRef = ref; }}
          invoice={invoice}
          onSuccess={async (values) => {
            try {
              // Update invoice status with payment details
              await invoiceService.updateInvoiceStatus(
                invoiceId, 
                'PAID', 
                values.paymentDate, 
                values.paymentMethod
              );
              
              // Create payment record
              await invoiceService.createPayment(invoiceId, {
                amount: parseFloat(values.amount),
                paymentMethod: values.paymentMethod,
                gatewayRef: values.transactionReference,
                receiptUrl: null, // No receipt URL for manual payments
                payer: invoice.customer?.name || 'Unknown'
              });
              
              message.success('Invoice marked as paid successfully');
              loadInvoices();
              
              // Close the drawer and refresh the selected invoice
              setIsModalVisible(false);
              if (selectedInvoice) {
                const updatedInvoice = await invoiceService.getInvoice(invoiceId);
                setSelectedInvoice(updatedInvoice);
              }
              
              modal.destroy();
            } catch (error) {

              message.error('Failed to mark invoice as paid');
            }
          }}
        />
      ),
      okText: 'Mark as Paid',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        // Trigger form submission
        if (paymentFormRef) {
          await paymentFormRef.handleSubmit();
        }
        return false; // Prevent default modal close
      },
    });
  };

  const handleCreateInvoice = async (values) => {
    try {
      if (editingInvoice) {
        // Update existing invoice
        const updateData = {
          ...values,
          dueDate: values.dueDate ? dayjs(values.dueDate).toISOString() : null,
        };
        await invoiceService.updateInvoice(editingInvoice.id, updateData);
        message.success('Invoice updated successfully');
      } else {
        // Create new invoice with job linking
        const selectedJob = jobs.find(job => job.id === values.jobId);
        
        // Check if job already has an invoice
        const existingInvoice = invoices.find(invoice => invoice.jobId === values.jobId);
        if (existingInvoice) {
          message.error('An invoice already exists for this job');
          return;
        }
        
        // Use total amount from form (auto-calculated)
        const totalAmount = values.totalAmount || 0;
        
        const invoiceData = {
          ...values,
          jobId: values.jobId,
          customerId: selectedJob?.customerId,
          amount: totalAmount,
          invoiceNumber: `INV-${selectedJob?.trackingId}`,
          issueDate: new Date().toISOString(), // System generated
          dueDate: values.dueDate ? dayjs(values.dueDate).toISOString() : null,
          blAmendment: values.blAmendment,
          // Store individual charges for breakdown
          charges: {
            customDuty: values.customDuty || 0,
            shippingCharges: values.shippingCharges || 0,
            terminalCharges: values.terminalCharges || 0,
            miscellaneous: values.miscellaneous || 0,
            clearanceCharges: values.clearanceCharges || 0,
            serviceCharge: values.serviceCharge || 0,
            vat: values.vat || 0
          }
        };

        await invoiceService.createInvoice(invoiceData);
        
        // Invoice creation is now independent - no automatic status update
        
        message.success('Invoice created successfully');
      }
      setIsCreateModalVisible(false);
      setEditingInvoice(null);
      form.resetFields();
      loadInvoices(); // Reload invoices (this will also reload jobs due to useEffect)
    } catch (error) {

      message.error(error.message || 'Failed to save invoice');
    }
  };

  const handleCreateInvoiceFromJob = (job) => {

    // Check if job is a draft
    if (job.isDraft) {
      message.warning('Draft jobs cannot be used to create invoices');
      return;
    }
    
    // Invoice creation is now independent - any job can have an invoice created
    
    // Check if job already has an invoice
    const existingInvoice = invoices.find(invoice => invoice.jobId === job.id);
    if (existingInvoice) {
      message.warning('An invoice already exists for this job');
      return;
    }
    
    // Get default values from configurations
    const defaultServiceCharge = configurations.SERVICE?.find(c => c.key === 'DEFAULT_SERVICE_CHARGE')?.value || '50';
    const defaultClearanceCharge = configurations.SERVICE?.find(c => c.key === 'DEFAULT_CLEARANCE_CHARGE')?.value || '25';
    const defaultTerminalCharge = configurations.SERVICE?.find(c => c.key === 'DEFAULT_TERMINAL_CHARGE')?.value || '30';
    const defaultShippingCharge = configurations.SERVICE?.find(c => c.key === 'DEFAULT_SHIPPING_CHARGE')?.value || '40';

    // Set form values
    const formValues = {
      jobId: job.id,
      customerId: job.customerId,
      serviceCharge: parseFloat(defaultServiceCharge),
      clearanceCharges: parseFloat(defaultClearanceCharge),
      terminalCharges: parseFloat(defaultTerminalCharge),
      shippingCharges: parseFloat(defaultShippingCharge),
      notes: `Invoice for job ${job.trackingId}`
    };

    // Calculate VAT using the new formula
    const calculatedVAT = calculateVATForForm(formValues);
    formValues.vat = calculatedVAT;

    // Calculate total amount
    const totalAmount = calculateTotalAmount(formValues);
    formValues.totalAmount = totalAmount;

    form.setFieldsValue(formValues);
    
    setSelectedJobId(job.id);
    setEditingInvoice(null);
    setIsCreateModalVisible(true);
  };

  const jobColumns = [
    {
      title: 'Job ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Client',
      key: 'clientName',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.customer?.name || 'N/A'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.customer?.email || 'N/A'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Goods',
      dataIndex: 'goodsTypes',
      key: 'goodsTypes',
      render: (goodsTypes) => (
        <div>
          {goodsTypes && goodsTypes.length > 0 ? (
            goodsTypes.slice(0, 2).map((type, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: '2px' }}>
                {type}
              </Tag>
            ))
          ) : (
            <Tag color="default">No goods types</Tag>
          )}
          {goodsTypes && goodsTypes.length > 2 && (
            <Tag color="default">+{goodsTypes.length - 2} more</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const displayStatus = record.isDraft ? 'DRAFT' : status;
        return (
          <Tag color={getJobStatusColor(status, record.isDraft)} icon={getJobStatusIcon(status, record.isDraft)}>
            {displayStatus}
          </Tag>
        );
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => handleCreateInvoiceFromJob(record)}
            disabled={record.isDraft || invoices.some(invoice => invoice.jobId === record.id)}
            size="small"
              title={
                record.isDraft
                  ? 'Draft jobs cannot be used to create invoices'
                  : invoices.some(invoice => invoice.jobId === record.id)
                  ? 'Invoice already exists for this job'
                  : 'Create Invoice'
              }
          >
            Create Invoice
          </Button>
        </Space>
      )
    }
  ];

  const columns = [
    {
      title: 'Invoice',
      key: 'invoice',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.invoiceNumber}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.issueDate ? new Date(record.issueDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Client',
      key: 'client',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.customer?.name || 'N/A'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.customer?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>GHS {record.amount?.toLocaleString() || '0'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.job?.trackingId ? `Job: ${record.job.trackingId}` : 'Direct Invoice'}
          </div>
        </div>
      ),
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      render: (_, record) => (
        <div>
          <div>{record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.status === 'OVERDUE' ? 'Overdue' : 'Due'}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getInvoiceStatusColor(record.status)}>
          {record.status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="default" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewInvoice(record)}
          size="small"
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <style>
        {`
          @media print {
            /* Hide everything by default */
            * {
              visibility: hidden;
            }
            
            /* Show only the invoice content */
            #invoice-print,
            #invoice-print * {
              visibility: visible !important;
            }
            
            /* Position the invoice at the top */
            #invoice-print {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 20px !important;
              background: white !important;
              z-index: 9999 !important;
            }
            
            /* Hide modal and other elements */
            .ant-modal,
            .ant-modal-mask,
            .ant-modal-wrap {
              display: none !important;
            }
            
            /* Page settings */
            @page {
              margin: 0.5in;
              size: A4;
            }
            
            /* Ensure colors print correctly */
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            /* Hide browser UI elements */
            @media print {
              body {
                margin: 0 !important;
                padding: 0 !important;
              }
            }
          }
        `}
      </style>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>Invoice Management</Title>
          <Text type="secondary">Create, manage, and track client invoices and payments</Text>
        </div>
        {hasPermission(PERMISSIONS.INVOICE_CREATE) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            onClick={() => {
              setEditingInvoice(null);
              form.resetFields();
              setIsCreateModalVisible(true);
            }}
          >
            New Invoice
          </Button>
        )}
      </div>

      {/* Statistics Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={invoices.length}
              valueStyle={{ color: '#2FA2EE' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Paid Invoices"
              value={invoices.filter(i => i.status === 'PAID').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Payment"
              value={invoices.filter(i => i.status === 'PENDING').length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue"
              value={invoices.filter(i => {
                if (i.status === 'PAID') return false;
                const dueDate = new Date(i.dueDate);
                const today = new Date();
                return dueDate < today;
              }).length}
              valueStyle={{ color: '#f5222d' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'invoices',
              label: 'All Invoices',
              children: (
                <div>
      {/* Search and Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Search invoices by ID, client, or email"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => {
                if (value) {
                  setInvoices(invoices.filter(i => i.status === value));
                } else {
                  loadInvoices();
                }
              }}
            >
              <Option value="paid">Paid</Option>
              <Option value="pending">Pending</Option>
              <Option value="overdue">Overdue</Option>
              <Option value="draft">Draft</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <DatePicker
              placeholder="From Date"
              style={{ width: '100%' }}
              onChange={(date) => {
                if (date) {
                  const filtered = invoices.filter(i => new Date(i.issueDate) >= dayjs(date).toDate());
                  setInvoices(filtered);
                } else {
                  loadInvoices();
                }
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* Invoices Table */}
        {error && (
          <Alert
            message="Error Loading Invoices"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" onClick={loadInvoices}>
                Retry
              </Button>
            }
          />
        )}
        <Table
          columns={columns}
          dataSource={invoices}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`
          }}
                  />
                </div>
              )
            },
            {
              key: 'jobs',
              label: 'Jobs for Invoicing',
              children: (
                <div>
                  {/* Jobs Table */}
                    <Table
                      columns={jobColumns}
                      dataSource={jobs}
                      loading={jobsLoading}
                      rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} jobs available for invoicing`
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <Text type="secondary" style={{ fontSize: '16px', marginBottom: '8px' }}>
                                No jobs available for invoicing
                              </Text>
                              <Text type="secondary" style={{ fontSize: '14px' }}>
                                Jobs without existing invoices will appear here
                              </Text>
                            </div>
                          }
                        />
                      )
                    }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Invoice Details Modal */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <span>Invoice Details</span>
            {selectedInvoice && (
              <Tag color={getInvoiceStatusColor(selectedInvoice.status)} style={{ marginLeft: 'auto' }}>
                {selectedInvoice.status}
              </Tag>
            )}
          </div>
        }
        placement="right"
        onClose={() => setIsModalVisible(false)}
        open={isModalVisible}
        width={800}
        extra={
          selectedInvoice && (
            <Space>
              {selectedInvoice.status === 'PENDING' && (
                <Button 
                  type="primary"
                  icon={<CheckCircleOutlined />} 
                  onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                >
                  Mark as Paid
                </Button>
              )}
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit',
                      label: selectedInvoice.status === 'PAID' ? 'Edit Invoice' : 'Edit Invoice',
                      icon: <EditOutlined />,
                      disabled: selectedInvoice.status === 'PAID',
                      onClick: () => {
                        if (selectedInvoice.status !== 'PAID') {
                        setIsModalVisible(false);
                        handleEditInvoice(selectedInvoice);
                        } else {
                          message.warning('Cannot edit paid invoices');
                        }
                      },
                    },
                    {
                      key: 'print',
                      label: 'Print Invoice',
                      icon: <PrinterOutlined />,
                      onClick: handlePrintInvoice,
                    },
                    {
                      type: 'divider',
                    },
                    {
                      key: 'delete',
                      label: selectedInvoice.status === 'PAID' ? 'Delete Invoice' : 'Delete Invoice',
                      icon: <DeleteOutlined />,
                      danger: true,
                      disabled: selectedInvoice.status === 'PAID',
                      onClick: () => {
                        if (selectedInvoice.status !== 'PAID') {
                        setIsModalVisible(false);
                        handleDeleteInvoice(selectedInvoice.id);
                        } else {
                          message.warning('Cannot delete paid invoices');
                        }
                      },
                    },
                  ],
                }}
                placement="bottomRight"
                arrow
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          )
        }
      >
        {selectedInvoice && (
          <Collapse 
            defaultActiveKey={['1', '2', '3', '4']} 
            size="large"
            items={[
              {
                key: '1',
                label: (
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '16px'
                  }}>
                    Customer Details
            </div>
                ),
                children: (
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: '8px', 
              padding: '20px',
                    backgroundColor: '#fafafa'
                  }}>
                    <Descriptions 
                      column={1} 
                      size="small"
                      labelStyle={{ 
                        width: '40%', 
                        textAlign: 'left',
                        fontWeight: '500'
                      }}
                      contentStyle={{ 
                        width: '60%', 
                        textAlign: 'right'
                      }}
                    >
                      <Descriptions.Item label="Customer Name">
                        <Text strong>{selectedInvoice.customer?.name || 'N/A'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {selectedInvoice.customer?.email || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Phone">
                        {selectedInvoice.customer?.phone || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Address">
                        {selectedInvoice.customer?.address || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="City">
                        {selectedInvoice.customer?.city || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Country">
                        {selectedInvoice.customer?.country || 'N/A'}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                )
              },
              {
                key: '2',
                label: (
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '16px'
                  }}>
                    Job Details
              </div>
                ),
                children: (
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: '8px', 
              padding: '20px',
                    backgroundColor: '#fafafa'
                  }}>
                    <Descriptions 
                      column={1} 
                      size="small"
                      labelStyle={{ 
                        width: '40%', 
                        textAlign: 'left',
                        fontWeight: '500'
                      }}
                      contentStyle={{ 
                        width: '60%', 
                        textAlign: 'right'
                      }}
                    >
                      <Descriptions.Item label="Job ID">
                        <Text strong>{selectedInvoice.job?.trackingId || 'N/A'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Goods Types">
                        {selectedInvoice.job?.goodsTypes?.join(', ') || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Consignee">
                        {selectedInvoice.job?.consignment?.consigneeName || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Consignee Phone">
                        {selectedInvoice.job?.consignment?.consigneePhone || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Consignee Address">
                        {selectedInvoice.job?.consignment?.consigneeAddress || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Job Status">
                        <Tag color={getJobStatusColor(selectedInvoice.job?.status)}>
                          {selectedInvoice.job?.status || 'N/A'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                )
              },
              {
                key: '3',
                label: (
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '16px'
                  }}>
                    Invoice Details
              </div>
                ),
                children: (
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: '8px', 
              padding: '20px',
                    backgroundColor: '#fafafa'
                  }}>
                    <Descriptions 
                      column={1} 
                      size="small"
                      labelStyle={{ 
                        width: '40%', 
                        textAlign: 'left',
                        fontWeight: '500'
                      }}
                      contentStyle={{ 
                        width: '60%', 
                        textAlign: 'right'
                      }}
                    >
                      <Descriptions.Item label="Invoice Number">
                        <Text strong>{selectedInvoice.invoiceNumber || 'N/A'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Issue Date">
                        {selectedInvoice.issueDate ? new Date(selectedInvoice.issueDate).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Due Date">
                        {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={getInvoiceStatusColor(selectedInvoice.status || 'PENDING')}>
                          {selectedInvoice.status || 'PENDING'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="BL Amendment">
                        <Tag color={selectedInvoice.blAmendment === 'yes' ? 'orange' : 'green'}>
                          {selectedInvoice.blAmendment === 'yes' ? 'Yes' : 'No'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                    
                    <Divider />
                    
                    <Title level={5} style={{ marginBottom: '16px' }}>Service Charges</Title>
                    <Descriptions 
                      column={1} 
                      size="small"
                      labelStyle={{ 
                        width: '40%', 
                        textAlign: 'left',
                        fontWeight: '500'
                      }}
                      contentStyle={{ 
                        width: '60%', 
                        textAlign: 'right'
                      }}
                    >
                      <Descriptions.Item label="Custom Duty">
                        <Text>GHS {(selectedInvoice.charges?.customDuty || 0).toFixed(2)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Shipping Charges">
                        <Text>GHS {(selectedInvoice.charges?.shippingCharges || 0).toFixed(2)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Terminal Charges">
                        <Text>GHS {(selectedInvoice.charges?.terminalCharges || 0).toFixed(2)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Miscellaneous">
                        <Text>GHS {(selectedInvoice.charges?.miscellaneous || 0).toFixed(2)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Clearance Charges">
                        <Text>GHS {(selectedInvoice.charges?.clearanceCharges || 0).toFixed(2)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Service Charge">
                        <Text>GHS {(selectedInvoice.charges?.serviceCharge || 0).toFixed(2)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="VAT">
                        <Text>GHS {(selectedInvoice.charges?.vat || 0).toFixed(2)}</Text>
                      </Descriptions.Item>
                    </Descriptions>
                    
                    <Divider />
                    
            <div style={{ 
                      background: '#f8f9fa', 
              padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Total Amount"
                            value={selectedInvoice.amount || 0}
                            precision={2}
                            prefix="GHS"
                            valueStyle={{ color: '#000000', fontSize: '24px', fontWeight: 'bold' }}
                          />
                        </Col>
                      </Row>
                      <Divider />
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">
                          Invoice created on {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Unknown'}
                        </Text>
              </div>
            </div>

                    {selectedInvoice.comments && (
                      <>
                        <Divider />
                        <Title level={5} style={{ marginBottom: '16px' }}>Comments & Remarks</Title>
              <div style={{ 
                          background: '#f8f9fa', 
                          padding: '16px', 
                borderRadius: '8px', 
                          border: '1px solid #e9ecef'
                        }}>
                          <Text>{selectedInvoice.comments}</Text>
              </div>
                      </>
                    )}
                  </div>
                )
              },
              ...(selectedInvoice.status === 'PAID' ? [{
                key: '4',
                label: (
            <div style={{ 
                    fontWeight: '600', 
                    fontSize: '16px'
                  }}>
                    Payment Details
                  </div>
                ),
                children: (
                  <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: '8px', 
              padding: '20px',
                    backgroundColor: '#fafafa'
                  }}>
                    {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                      selectedInvoice.payments.map((payment, index) => (
                        <div key={payment.id || index} style={{ marginBottom: index < selectedInvoice.payments.length - 1 ? '20px' : '0' }}>
                          {index > 0 && <Divider style={{ margin: '16px 0' }} />}
                          <Descriptions 
                            column={1} 
                            size="small"
                            labelStyle={{ 
                              width: '40%', 
                              textAlign: 'left',
                              fontWeight: '500'
                            }}
                            contentStyle={{ 
                              width: '60%', 
                              textAlign: 'right'
                            }}
                          >
                            <Descriptions.Item label="Payment Date">
                              {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-GB', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Payment Method">
                              <Text>{payment.paymentMethod || 'N/A'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Transaction Reference">
                              <Text>{payment.gatewayRef || 'N/A'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Amount Paid">
                              <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                                GHS {(payment.amount || 0).toFixed(2)}
                              </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Payer">
                              <Text>{payment.payer || 'N/A'}</Text>
                            </Descriptions.Item>
                            {payment.receiptUrl && (
                              <Descriptions.Item label="Receipt">
                                <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                                  View Receipt
                                </a>
                              </Descriptions.Item>
                            )}
                          </Descriptions>
            </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                        No payment details available
          </div>
                    )}
            </div>
                )
              }] : [])
            ]}
          />
        )}
      </Drawer>

      {/* Create/Edit Invoice Modal */}
      <Modal
        title={editingInvoice ? 'Edit Invoice' : 'New Invoice'}
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setEditingInvoice(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: '24px'
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateInvoice}
          onValuesChange={updateTotalAmount}
        >
          {/* Job Selection - Only for new invoices */}
          {!editingInvoice && (
            <Card size="small" title="Job Selection" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
                Choose a job to create invoice for
              </div>
            <Form.Item
              name="jobId"
              label="Select Job to Create Invoice For"
              rules={[{ required: true, message: 'Please select a job' }]}
            >
              <Select
                placeholder="Choose a job to create invoice for"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const job = jobs.find(j => j.id === option.value);
                  const searchText = `${job?.trackingId} ${job?.customer?.name} ${job?.goodsTypes?.join(' ')} ${job?.consignment?.consigneeName || ''}`.toLowerCase();
                  return searchText.indexOf(input.toLowerCase()) >= 0;
                }}
                loading={jobsLoading}
                notFoundContent={jobsLoading ? 'Loading jobs...' : 'No jobs available for invoicing'}
                onChange={(jobId) => {

                  setSelectedJobId(jobId);
                  const selectedJob = jobs.find(job => job.id === jobId);
                  if (selectedJob) {
                    // Get default values from configurations
                    const defaultServiceCharge = configurations.SERVICE?.find(c => c.key === 'DEFAULT_SERVICE_CHARGE')?.value || '50';
                    const defaultClearanceCharge = configurations.SERVICE?.find(c => c.key === 'DEFAULT_CLEARANCE_CHARGE')?.value || '25';
                    const defaultTerminalCharge = configurations.SERVICE?.find(c => c.key === 'DEFAULT_TERMINAL_CHARGE')?.value || '30';
                    const defaultShippingCharge = configurations.SERVICE?.find(c => c.key === 'DEFAULT_SHIPPING_CHARGE')?.value || '40';

                    // Set form values
                    const formValues = {
                      customerId: selectedJob.customerId,
                      serviceCharge: parseFloat(defaultServiceCharge),
                      clearanceCharges: parseFloat(defaultClearanceCharge),
                      terminalCharges: parseFloat(defaultTerminalCharge),
                      shippingCharges: parseFloat(defaultShippingCharge),
                      notes: `Invoice for job ${selectedJob.trackingId}`
                    };

                    // Calculate VAT using the new formula
                    const calculatedVAT = calculateVATForForm(formValues);
                    formValues.vat = calculatedVAT;

                    form.setFieldsValue(formValues);
                  }
                }}
                labelInValue={false}
                optionLabelProp="label"
              >
                {jobs.map(job => (
                  <Option 
                    key={job.id} 
                    value={job.id}
                    label={job.trackingId}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{job.trackingId}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {job.customer?.name || 'N/A'} • {job.goodsTypes?.join(', ') || 'No goods types'} • {job.consignment?.consigneeName || 'No consignee'}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>
          )}

          {/* Job Information - Show when job is selected or when editing */}
          {(form.getFieldValue('jobId') || editingInvoice) && (() => {
            const jobId = form.getFieldValue('jobId') || editingInvoice?.jobId;
            let selectedJob = jobs.find(job => job.id === jobId);
            
            // If job not found in jobs array but we're editing, use job data from invoice
            if (!selectedJob && editingInvoice?.job) {
              selectedJob = editingInvoice.job;
            }

            return selectedJob ? (
              <Card size="small" title="Job Information" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={6} md={4}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>Job ID</Text>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                        {selectedJob.trackingId}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={6} md={4}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>Goods Types</Text>
                      <div style={{ fontSize: '13px' }}>
                        {selectedJob.goodsTypes && selectedJob.goodsTypes.length > 0 ? (
                          selectedJob.goodsTypes.map((type, index) => (
                            <Tag key={index} color="blue" size="small" style={{ marginRight: '2px', marginBottom: '1px' }}>
                              {type}
                            </Tag>
                          ))
                        ) : (
                          <Text type="secondary" style={{ fontSize: '12px' }}>No goods types</Text>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={6} md={6}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>Consignee</Text>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>
                        {selectedJob.consignment?.consigneeName || 'No consignee'}
                      </div>
                    </div>
                  </Col>
                  {selectedJob.consignment?.consigneePhone && (
                    <Col xs={24} sm={6} md={4}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>Consignee Phone</Text>
                        <div style={{ fontSize: '13px' }}>
                          {selectedJob.consignment.consigneePhone}
                        </div>
                      </div>
                    </Col>
                  )}
                  {selectedJob.consignment?.consigneeAddress && (
                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Consignee Address</Text>
                        <div style={{ fontSize: '14px' }}>
                          {selectedJob.consignment.consigneeAddress}
                        </div>
                      </div>
                    </Col>
                  )}
                  <Col xs={24}>
                    <Divider style={{ margin: '8px 0' }} />
                  </Col>
                  <Col xs={24} sm={6} md={6}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>Client Name</Text>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>
                        {selectedJob.customer?.name || 'N/A'}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={6} md={6}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>Client Email</Text>
                      <div style={{ fontSize: '13px' }}>
                        {selectedJob.customer?.email || 'N/A'}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={6} md={4}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>Client Phone</Text>
                      <div style={{ fontSize: '13px' }}>
                        {selectedJob.customer?.phone || 'N/A'}
                      </div>
                    </div>
                  </Col>
                  {selectedJob.customer?.address && (
                    <Col xs={24} sm={6} md={8}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>Client Address</Text>
                        <div style={{ fontSize: '13px' }}>
                          {selectedJob.customer.address}
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              </Card>
            ) : (
              <Card size="small" style={{ marginBottom: 16, textAlign: 'center', padding: '20px' }}>
                <Text type="secondary">
                  {editingInvoice ? 'Loading job details...' : 'Please select a job to view details'}
                </Text>
              </Card>
            );
          })()}

          {/* Invoice Details - Show when job is selected or when editing */}
          {(selectedJobId || editingInvoice) && (
            <Card size="small" title="Invoice Details" style={{ marginBottom: 16 }}>
            {/* Invoice Number - Auto-generated and read-only */}
            {(form.getFieldValue('jobId') || editingInvoice) && (() => {
              const jobId = form.getFieldValue('jobId') || editingInvoice?.jobId;
              let selectedJob = jobs.find(job => job.id === jobId);
              
              // If job not found in jobs array but we're editing, use job data from invoice
              if (!selectedJob && editingInvoice?.job) {
                selectedJob = editingInvoice.job;
              }
              
              const invoiceNumber = selectedJob ? `INV-${selectedJob.trackingId}` : (editingInvoice?.invoiceNumber || '');
              return (
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Invoice Number</Text>
                      <div style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f5f5f5', 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {invoiceNumber}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Invoice Date</Text>
                      <div style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f5f5f5', 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}>
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </Col>
                </Row>
              );
            })()}

            {/* Charges Section */}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: '14px', marginBottom: '12px', display: 'block' }}>Charges Breakdown</Text>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                    name="customDuty"
                    label="Custom Duty (GHS)"
                    rules={[{ required: true, message: 'Please enter custom duty' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      formatter={value => `GHS ${Number(value || 0).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => parseFloat(value.replace(/GHS\s?|(,*)/g, '') || 0).toFixed(2)}
                    />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                    name="shippingCharges"
                    label="Shipping Charges (GHS)"
                    rules={[{ required: true, message: 'Please enter shipping charges' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      formatter={value => `GHS ${Number(value || 0).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => parseFloat(value.replace(/GHS\s?|(,*)/g, '') || 0).toFixed(2)}
                    />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                    name="terminalCharges"
                    label="Terminal Charges (GHS)"
                    rules={[{ required: true, message: 'Please enter terminal charges' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      formatter={value => `GHS ${Number(value || 0).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => parseFloat(value.replace(/GHS\s?|(,*)/g, '') || 0).toFixed(2)}
                    />
              </Form.Item>
            </Col>
                <Col span={12}>
                  <Form.Item
                    name="miscellaneous"
                    label="Miscellaneous (GHS)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      formatter={value => `GHS ${Number(value || 0).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => parseFloat(value.replace(/GHS\s?|(,*)/g, '') || 0).toFixed(2)}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="clearanceCharges"
                    label="Clearance Charges (GHS)"
                    rules={[{ required: true, message: 'Please enter clearance charges' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      formatter={value => `GHS ${Number(value || 0).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => parseFloat(value.replace(/GHS\s?|(,*)/g, '') || 0).toFixed(2)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="serviceCharge"
                    label="Service Charge (GHS)"
                    rules={[{ required: true, message: 'Please enter service charge' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      formatter={value => `GHS ${Number(value || 0).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => parseFloat(value.replace(/GHS\s?|(,*)/g, '') || 0).toFixed(2)}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="vat"
                    label="VAT (GHS) - Auto-calculated"
                    rules={[{ required: true, message: 'Please enter VAT' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      formatter={value => `GHS ${Number(value || 0).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => parseFloat(value.replace(/GHS\s?|(,*)/g, '') || 0).toFixed(2)}
                      readOnly
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="blAmendment"
                    label="BL Amendment"
                    rules={[{ required: true, message: 'Please select BL Amendment status' }]}
                  >
                    <Select placeholder="Select BL Amendment">
                      <Option value="yes">Yes</Option>
                      <Option value="no">No</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Total Amount */}
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="totalAmount"
                  label="Total Amount (GHS)"
                  rules={[{ required: true, message: 'Total amount is required' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.01}
                    formatter={value => `GHS ${Number(value || 0).toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => parseFloat(value.replace(/GHS\s?|(,*)/g, '') || 0).toFixed(2)}
                    readOnly
                    size="large"
                  />
                </Form.Item>
                <div style={{ marginTop: -16, marginBottom: 16, fontSize: '12px', color: '#666' }}>
                  <Text type="secondary">
                    Total = Custom Duty + Shipping + Terminal + Miscellaneous + Clearance + Service + VAT (Auto-calculated)
                  </Text>
                </div>
              </Col>
            </Row>

            {/* Invoice Status and Due Date */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                  name="status"
                  label="Invoice Status"
                  initialValue="PENDING"
                >
                  <Select>
                    <Option value="PENDING">Pending</Option>
                    <Option value="PAID">Paid</Option>
                  </Select>
                </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
              name="comments"
              label="Comments/Remarks"
          >
              <TextArea placeholder="Enter any additional comments or remarks" rows={3} />
          </Form.Item>
            </Card>
          )}

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                setEditingInvoice(null);
                setSelectedJobId(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Print Invoice Modal */}
      <Modal
        title="Invoice Preview"
        open={isPrintModalVisible}
        onCancel={() => setIsPrintModalVisible(false)}
        width={800}
        footer={[
          <div key="toggle" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
            <Switch 
              checked={showBreakdown}
              onChange={setShowBreakdown}
              size="small"
            />
            <span style={{ fontSize: '14px' }}>Show breakdown</span>
          </div>,
          <Button key="share" icon={<ShareAltOutlined />} onClick={handleShareInvoice}>
            Share via Email
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print Invoice
          </Button>
        ]}
        style={{ top: 20 }}
        styles={{
          body: {
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '0'
          }
        }}
      >
        {selectedInvoice && (
          <div id="invoice-print" style={{ 
            backgroundColor: 'white', 
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.4',
            color: '#000',
            fontSize: '12px'
          }}>
            {/* Company Header */}
            <div style={{ 
              backgroundColor: '#00072D',
              color: 'white',
              padding: '20px',
              marginBottom: '20px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* Logo */}
              <img 
                src="/cn_logo.png" 
                alt="CN Terminal" 
                style={{ 
                  width: '60px', 
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }} 
              />
              
              {/* Company Info */}
              <div style={{ flex: 1 }}>
                <h1 style={{ 
                  color: 'white', 
                  fontSize: '28px', 
                  margin: '0 0 5px 0',
                  fontWeight: 'bold'
                }}>
                  CN TERMINAL
                </h1>
                <p style={{ 
                  color: '#d9d9d9', 
                  fontSize: '14px', 
                  margin: '0 0 3px 0' 
                }}>
                  Professional Terminal Services
                </p>
                <p style={{ 
                  color: '#bfbfbf', 
                  fontSize: '12px', 
                  margin: '0' 
                }}>
                  Accra, Ghana | +233 123 456 789 | info@cnterminal.com
                </p>
              </div>
            </div>

            {/* Invoice Header */}
            <div style={{ 
              marginBottom: '15px'
            }}>
              <h2 style={{ 
                color: '#333', 
                fontSize: '20px', 
                margin: '0 0 5px 0',
                fontWeight: 'bold'
              }}>
                INVOICE
              </h2>
              <p style={{ margin: '0 0 2px 0', color: '#666', fontSize: '12px' }}>
                Invoice #: {selectedInvoice.invoiceNumber}
              </p>
              <p style={{ margin: '0 0 2px 0', color: '#666', fontSize: '12px' }}>
                Date: {selectedInvoice.issueDate ? new Date(selectedInvoice.issueDate).toLocaleDateString('en-GB') : 'N/A'}
              </p>
              <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                Due Date: {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-GB') : 'N/A'}
              </p>
            </div>

            {/* Bill To Section */}
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ 
                color: '#333', 
                fontSize: '14px', 
                margin: '0 0 8px 0',
                borderBottom: '1px solid #333',
                paddingBottom: '3px'
              }}>
                BILL TO
              </h3>
              <div style={{ 
                backgroundColor: '#f9f9f9', 
                padding: '10px', 
                borderRadius: '4px',
                border: '1px solid #e0e0e0'
              }}>
                <p style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 'bold' }}>
                  {selectedInvoice.customer?.name || 'N/A'}
                </p>
                <p style={{ margin: '0 0 2px 0', color: '#666', fontSize: '12px' }}>
                  {selectedInvoice.customer?.email || 'N/A'}
                </p>
                <p style={{ margin: '0 0 2px 0', color: '#666', fontSize: '12px' }}>
                  {selectedInvoice.customer?.phone || 'N/A'}
                </p>
                <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                  {selectedInvoice.customer?.address || 'N/A'}
                </p>
                {selectedInvoice.customer?.city && (
                  <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '12px' }}>
                    {selectedInvoice.customer.city}, {selectedInvoice.customer.country || 'Ghana'}
                  </p>
                )}
              </div>
            </div>

            {/* Job Information Section */}
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ 
                color: '#333', 
                fontSize: '14px', 
                margin: '0 0 8px 0',
                borderBottom: '1px solid #333',
                paddingBottom: '3px'
              }}>
                JOB INFORMATION
              </h3>
              <div style={{ 
                backgroundColor: '#f9f9f9', 
                padding: '10px', 
                borderRadius: '4px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '12px' }}>Job ID</p>
                    <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                      {selectedInvoice.job?.trackingId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '12px' }}>Goods Types</p>
                    <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                      {selectedInvoice.job?.goodsTypes?.join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '12px' }}>Status</p>
                    <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                      {selectedInvoice.job?.status || 'N/A'}
                    </p>
                  </div>
                </div>
                {selectedInvoice.job?.consignment && (
                  <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '12px' }}>Consignee Details</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '12px' }}>Name</p>
                        <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                          {selectedInvoice.job.consignment.consigneeName || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '12px' }}>Phone</p>
                        <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                          {selectedInvoice.job.consignment.consigneePhone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '12px' }}>Address</p>
                        <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                          {selectedInvoice.job.consignment.consigneeAddress || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Charges Breakdown */}
            <div style={{ marginBottom: '15px' }}>
              {showBreakdown && (
                <>
                  <h3 style={{ 
                    color: '#333', 
                    fontSize: '14px', 
                    margin: '0 0 8px 0',
                    borderBottom: '1px solid #333',
                    paddingBottom: '3px'
                  }}>
                    CHARGES BREAKDOWN
                  </h3>
                  <div style={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontSize: '12px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ 
                            padding: '8px', 
                            textAlign: 'left', 
                            borderBottom: '1px solid #e0e0e0',
                            fontWeight: 'bold'
                          }}>
                            Description
                          </th>
                          <th style={{ 
                            padding: '8px', 
                            textAlign: 'right', 
                            borderBottom: '1px solid #e0e0e0',
                            fontWeight: 'bold'
                          }}>
                            Amount (GHS)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
                            Custom Duty
                          </td>
                          <td style={{ 
                            padding: '6px 8px', 
                            textAlign: 'right', 
                            borderBottom: '1px solid #f0f0f0',
                            fontWeight: 'bold'
                          }}>
                            {(selectedInvoice.charges?.customDuty || 0).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
                            Shipping Charges
                          </td>
                          <td style={{ 
                            padding: '6px 8px', 
                            textAlign: 'right', 
                            borderBottom: '1px solid #f0f0f0',
                            fontWeight: 'bold'
                          }}>
                            {(selectedInvoice.charges?.shippingCharges || 0).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
                            Terminal Charges
                          </td>
                          <td style={{ 
                            padding: '6px 8px', 
                            textAlign: 'right', 
                            borderBottom: '1px solid #f0f0f0',
                            fontWeight: 'bold'
                          }}>
                            {(selectedInvoice.charges?.terminalCharges || 0).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
                            Miscellaneous
                          </td>
                          <td style={{ 
                            padding: '6px 8px', 
                            textAlign: 'right', 
                            borderBottom: '1px solid #f0f0f0',
                            fontWeight: 'bold'
                          }}>
                            {(selectedInvoice.charges?.miscellaneous || 0).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
                            Clearance Charges
                          </td>
                          <td style={{ 
                            padding: '6px 8px', 
                            textAlign: 'right', 
                            borderBottom: '1px solid #f0f0f0',
                            fontWeight: 'bold'
                          }}>
                            {(selectedInvoice.charges?.clearanceCharges || 0).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
                            Service Charge
                          </td>
                          <td style={{ 
                            padding: '6px 8px', 
                            textAlign: 'right', 
                            borderBottom: '1px solid #f0f0f0',
                            fontWeight: 'bold'
                          }}>
                            {(selectedInvoice.charges?.serviceCharge || 0).toFixed(2)}
                          </td>
                        </tr>
                        <tr style={{ backgroundColor: '#f9f9f9' }}>
                          <td style={{ 
                            padding: '6px 8px', 
                            borderBottom: '1px solid #e0e0e0',
                            fontWeight: 'bold'
                          }}>
                            VAT (15%)
                          </td>
                          <td style={{ 
                            padding: '6px 8px', 
                            textAlign: 'right', 
                            borderBottom: '1px solid #e0e0e0',
                            fontWeight: 'bold',
                            color: '#333'
                          }}>
                            {(selectedInvoice.charges?.vat || 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              
              {/* Always show total amount */}
              <div style={{ 
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: showBreakdown ? '0' : '8px'
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '12px'
                }}>
                  <tbody>
                    <tr style={{ backgroundColor: '#00072D', color: 'white' }}>
                      <td style={{ 
                        padding: '10px 8px', 
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        TOTAL AMOUNT
                      </td>
                      <td style={{ 
                        padding: '10px 8px', 
                        textAlign: 'right', 
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}>
                        {(selectedInvoice.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '20px',
              paddingTop: '10px',
              borderTop: '1px solid #333',
              color: '#666'
            }}>
              <p style={{ margin: '0 0 3px 0', fontSize: '12px' }}>
                Thank you for choosing CN Terminal for your terminal services
              </p>
              <p style={{ margin: '0', fontSize: '10px' }}>
                For any inquiries, please contact us at info@cnterminal.com or +233 123 456 789
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoicesPage;
