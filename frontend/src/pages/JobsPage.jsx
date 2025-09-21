import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Typography,
  Modal, 
  Form, 
  Input, 
  Upload, 
  Select,
  DatePicker,
  message,
  Tooltip,
  Statistic,
  Drawer,
  Spin,
  Tabs,
  Timeline,
  Descriptions,
  Avatar,
  Divider,
  Dropdown,
  Empty,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UserOutlined,
  ContainerOutlined,
  CalendarOutlined,
  DollarOutlined,
  MoreOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CarOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CustomerSelector from '../components/common/CustomerSelector';
import FileUpload from '../components/common/FileUpload';
import { useCustomers } from '../contexts/CustomerContext';
import userService from '../services/userService';
import jobService from '../services/jobService';
import { fileService } from '../services/fileService';

// Status hierarchy system - jobs can only progress forward
const STATUS_HIERARCHY = {
  'NEW': 1,
  'PREINVOICED': 2,
  'INVOICED': 3,      // Auto-set only when invoice is created
  'ENTRY': 4,
  'RELEASE': 5,
  'CLEARED': 6,
  'DELIVERED': 7      // Final status - no further changes
};

// Status display names
const STATUS_LABELS = {
  'NEW': 'New',
  'PREINVOICED': 'Pre-invoiced',
  'INVOICED': 'Invoiced',
  'ENTRY': 'Entry',
  'RELEASE': 'Release',
  'CLEARED': 'Cleared',
  'DELIVERED': 'Delivered'
};

// Get available next statuses for a given current status
const getAvailableStatuses = (currentStatus) => {
  const currentLevel = STATUS_HIERARCHY[currentStatus];
  if (!currentLevel) return [];
  
  return Object.entries(STATUS_HIERARCHY)
    .filter(([status, level]) => {
      // Only allow forward progression
      // Exclude INVOICED (auto-set only) and DELIVERED (final status)
      return level > currentLevel && status !== 'INVOICED' && status !== 'DELIVERED';
    })
    .map(([status]) => status);
};

// Check if status transition is valid
const isValidStatusTransition = (currentStatus, newStatus) => {
  const currentLevel = STATUS_HIERARCHY[currentStatus];
  const newLevel = STATUS_HIERARCHY[newStatus];
  
  if (!currentLevel || !newLevel) return false;
  
  // Must be forward progression
  if (newLevel <= currentLevel) return false;
  
  // INVOICED can only be set automatically
  if (newStatus === 'INVOICED') return false;
  
  return true;
};

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const JobsPage = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobDocuments, setSelectedJobDocuments] = useState([]);
  const [isStatusUpdateModalVisible, setIsStatusUpdateModalVisible] = useState(false);
  const [statusUpdateForm] = Form.useForm();
  const [currentJobForStatusUpdate, setCurrentJobForStatusUpdate] = useState(null);
  const [isDocumentViewerVisible, setIsDocumentViewerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedCustomerConsignments, setSelectedCustomerConsignments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [draftJobs, setDraftJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [staffMembers, setStaffMembers] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  
  // Dynamic dropdown states
  const [goodsTypes, setGoodsTypes] = useState([
    'Electronics', 'Textiles', 'Machinery', 'Pharmaceuticals', 'Food & Beverages',
    'Automotive', 'Furniture', 'Clothing & Accessories', 'Books & Media',
    'Sports & Recreation', 'Health & Beauty', 'Tools & Hardware'
  ]);
  const [vesselNames, setVesselNames] = useState([
    'RHL Concordia', 'MAERSK TEMA', 'Seaspan Dalian', 'MAERSK KARUN', 
    'MAESK Cunene', 'Hammonia Toscan'
  ]);
  const [lineOptions, setLineOptions] = useState([
    'PIL', 'SAF', 'COSCO', 'CMA', 'OOCL', 'MSK', 'ONE'
  ]);
  const [error, setError] = useState(null);
  
  // Custom option modal state
  const [isCustomOptionModalVisible, setIsCustomOptionModalVisible] = useState(false);
  const [customOptionType, setCustomOptionType] = useState('');
  const [customOptionValue, setCustomOptionValue] = useState('');
  const [customOptionField, setCustomOptionField] = useState('');

  useEffect(() => {
    loadJobs();
    loadStaffMembers();
  }, []);

  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      setError(null);
      const response = await jobService.getJobs({ limit: 100 });
      console.log('🔍 Jobs API response:', response);
      console.log('🔍 First job details:', response.jobs?.[0]);
      if (response.jobs?.[0]) {
        console.log('🔍 First job fields check:');
        console.log('  - mediumOfEnquiry:', response.jobs[0].mediumOfEnquiry);
        console.log('  - documentsBrought:', response.jobs[0].documentsBrought);
        console.log('  - containerNumber:', response.jobs[0].containerNumber);
        console.log('  - blNumber:', response.jobs[0].blNumber);
        console.log('  - vesselName:', response.jobs[0].vesselName);
        console.log('  - line:', response.jobs[0].line);
        console.log('  - jobDescription:', response.jobs[0].jobDescription);
      }
      
      const allJobs = response.jobs || [];
      
      // Separate regular jobs from drafts
      const regularJobs = allJobs.filter(job => !job.isDraft);
      const drafts = allJobs.filter(job => job.isDraft);
      
      setJobs(regularJobs);
      setDraftJobs(drafts);
      
      console.log(`📊 Loaded ${regularJobs.length} regular jobs and ${drafts.length} drafts`);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  const loadStaffMembers = async () => {
    try {
      console.log('Loading users for assignment...');
      
      const response = await userService.getUsers();
      console.log('API Response:', response);
      console.log('All users loaded:', response.users);
      
      if (!response.users || !Array.isArray(response.users)) {
        console.error('Invalid response format:', response);
        return;
      }
      
      // Filter for active users (staff, admin, etc.) - not just STAFF role
      const assignableUsers = response.users.filter(user => 
        user.isActive && (user.role === 'STAFF' || user.role === 'ADMIN')
      );
      console.log('Assignable users:', assignableUsers);
      setStaffMembers(assignableUsers || []);
    } catch (error) {
      console.error('Error loading users for assignment:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Don't set error state for staff members as it's not critical
    }
  };





  const getStatusColor = (status, isDraft) => {
    if (isDraft) {
      return 'default';
    }
    const statusColors = {
      'NEW': 'green',
      'PREINVOICED': 'blue',
      'INVOICED': 'purple',
      'ENTRY': 'orange',
      'RELEASE': 'cyan',
      'CLEARED': 'green',
      'DELIVERED': 'green'
    };
    return statusColors[status] || 'default';
  };

  const getStatusIcon = (status, isDraft) => {
    if (isDraft) {
      return <FileTextOutlined />;
    }
    const statusIcons = {
      'NEW': <PlusOutlined />,
      'PREINVOICED': <FileTextOutlined />,
      'INVOICED': <DollarOutlined />,
      'ENTRY': <ContainerOutlined />,
      'RELEASE': <CheckCircleOutlined />,
      'CLEARED': <ContainerOutlined />,
      'DELIVERED': <CheckCircleOutlined />
    };
    return statusIcons[status] || <FileTextOutlined />;
  };

  const getDocumentIcon = (doc) => {
    // Handle both string filename and document object
    const filename = typeof doc === 'string' ? doc : doc.originalName;
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileTextOutlined style={{ color: '#ff4d4f' }} />;
      case 'doc':
      case 'docx':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'xls':
      case 'xlsx':
        return <FileTextOutlined style={{ color: '#52c41a' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileTextOutlined style={{ color: '#722ed1' }} />;
      default:
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (doc) => {
    // Handle both string filename and document object
    const filename = typeof doc === 'string' ? doc : doc.originalName;
    const name = filename.toLowerCase();
    if (name.includes('packing')) return 'Packing List';
    if (name.includes('invoice')) return 'Commercial Invoice';
    if (name.includes('lading')) return 'Bill of Lading';
    if (name.includes('certificate')) return 'Certificate';
    if (name.includes('specification')) return 'Technical Specification';
    if (name.includes('report')) return 'Report';
    if (name.includes('warranty')) return 'Warranty Document';
    if (name.includes('manifest')) return 'Shipping Manifest';
    if (name.includes('safety')) return 'Safety Certificate';
    if (name.includes('inspection')) return 'Inspection Report';
    if (name.includes('origin')) return 'Certificate of Origin';
    return 'Document';
  };

  const columns = [
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
            goodsTypes.map((type, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: '2px' }}>
                {type}
              </Tag>
            ))
          ) : (
            <Tag color="default">No goods types</Tag>
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
          <Tag color={getStatusColor(status, record.isDraft)} icon={getStatusIcon(status, record.isDraft)}>
            {displayStatus}
          </Tag>
        );
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo) => (
        <Tag
          color={!assignedTo || assignedTo === 'Unassigned' ? 'default' : 'blue'}
          icon={!assignedTo || assignedTo === 'Unassigned' ? null : <UserOutlined />}
        >
          {assignedTo?.name || assignedTo || 'Unassigned'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="default" 
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewJob(record)}
        >
          View
        </Button>
      )
    }
  ];

  const handleNewJob = () => {
    setEditingJob(null);
    form.resetFields();
    // Set default status to NEW for new jobs
    form.setFieldsValue({ status: 'NEW' });
    setIsModalVisible(true);
  };

  const handleEditJob = async (job) => {
    console.log('\n' + '='.repeat(60));
    console.log('✏️ EDIT JOB HANDLER');
    console.log('='.repeat(60));
    console.log('📋 Job details:', {
      id: job.id,
      trackingId: job.trackingId,
      customerId: job.customerId,
      status: job.status
    });
    
    setEditingJob(job);
    
    // Load existing documents for this job
    let existingDocuments = [];
    try {
      console.log('📁 Loading existing documents for job:', job.id);
      const documentsResponse = await fileService.getFilesByEntity('job', job.id);
      
      if (documentsResponse && documentsResponse.files) {
        console.log('📄 Found existing documents:', documentsResponse.files.length);
        existingDocuments = documentsResponse.files.map(file => ({
          uid: file.id.toString(),
          name: file.originalName,
          status: 'done',
          url: file.url,
          size: file.size,
          type: file.mimeType
        }));
        console.log('📋 Mapped documents:', existingDocuments);
      } else {
        console.log('⚠️ No existing documents found or invalid response');
      }
    } catch (error) {
      console.log('\n' + '='.repeat(60));
      console.log('💥 LOAD EXISTING DOCUMENTS ERROR');
      console.log('='.repeat(60));
      console.error('❌ Failed to load existing documents:', error);
      console.log('='.repeat(60) + '\n');
    }
    
    const formValues = {
      customerId: job.customerId,
      consignmentId: job.consignmentId,
      trackingId: job.trackingId,
      goodsTypes: job.goodsTypes || [],
      assignedToId: job.assignedToId,
      eta: job.eta,
      mediumOfEnquiry: job.mediumOfEnquiry,
      documentsBrought: job.documentsBrought || [],
      containerNumber: job.containerNumber,
      blNumber: job.blNumber,
      vesselName: job.vesselName,
      line: job.line,
      jobDescription: job.jobDescription,
      status: job.status,
      documents: existingDocuments
    };
    
    console.log('📝 Setting form values:', formValues);
    form.setFieldsValue(formValues);
    
    console.log('✅ Job edit form initialized successfully');
    console.log('='.repeat(60) + '\n');
    
    setIsModalVisible(true);
  };

  const handleViewJob = async (job) => {
    // Debug: Log the job data to see what we're getting
    console.log('🔍 Job data received in handleViewJob:', job);
    console.log('🔍 Job fields check:');
    console.log('  - mediumOfEnquiry:', job.mediumOfEnquiry);
    console.log('  - documentsBrought:', job.documentsBrought);
    console.log('  - containerNumber:', job.containerNumber);
    console.log('  - blNumber:', job.blNumber);
    console.log('  - vesselName:', job.vesselName);
    console.log('  - line:', job.line);
    console.log('  - jobDescription:', job.jobDescription);
    
    // Show drawer immediately with complete job data (already loaded)
    setSelectedJob(job);
    setIsDetailsDrawerVisible(true);
    
    // Fetch documents for this job
    try {
      console.log('📁 Loading documents for job:', job.id);
      const documentsResponse = await fileService.getFilesByEntity('job', job.id);
      
      if (documentsResponse && documentsResponse.files) {
        console.log('📄 Found documents:', documentsResponse.files.length);
        setSelectedJobDocuments(documentsResponse.files);
      } else {
        console.log('⚠️ No documents found');
        setSelectedJobDocuments([]);
      }
    } catch (error) {
      console.error('❌ Error loading documents:', error);
      setSelectedJobDocuments([]);
    }
  };

  const handleDeleteJob = (job) => {
    Modal.confirm({
      title: 'Delete Job',
      content: `Are you sure you want to delete job ${job.trackingId}?`,
      onOk: async () => {
        try {
          await jobService.deleteJob(job.id);
          message.success('Job deleted successfully');
          loadJobs(); // Reload jobs
        } catch (error) {
          message.error('Failed to delete job');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      // Extract documents from form values (but don't process them here)
      const { documents, trackingId, ...jobData } = values;
      
      // Debug: Log the form values
      console.log('🔍 Form values received:', values);
      console.log('📄 Documents extracted:', { file: documents, fileList: documents });
      console.log('📄 Documents count:', documents?.length);
      console.log('📄 Documents type:', typeof documents);
      console.log('📄 Documents is array:', Array.isArray(documents));
      if (documents && documents.length > 0) {
        console.log('📄 First document structure:', documents[0]);
        console.log('📄 First document has originFileObj:', !!documents[0].originFileObj);
        console.log('📄 First document has url:', !!documents[0].url);
      }
      console.log('🔍 Job data to send:', jobData);
      
      // Use status from form (defaults to NEW if not specified)
      const jobStatus = jobData.status || 'NEW';
      
      // Set isDraft to false when submitting
      const submittedJobData = { ...jobData, isDraft: false };
      
      let response;
      if (editingJob) {
        // Update existing job - remove trackingId as it's system-generated
        console.log('➕ Updating existing job...');
        response = await jobService.updateJob(editingJob.id, submittedJobData);
        message.success('Job updated successfully');
      } else {
        // Create new job - remove trackingId as it's system-generated
        console.log('➕ Creating new job...');
        response = await jobService.createJob(submittedJobData);
        console.log('📋 Full response:', response);
        console.log('📋 Response structure:', {
          hasJob: !!response.job,
          jobId: response.job?.id,
          message: response.message
        });
        message.success('Job created successfully');
      }
      
      // Handle document uploads if we have documents and a job ID
      if (documents && documents.length > 0) {
        const jobId = response.job?.id || response.id;
        if (jobId) {
          console.log('📁 Processing documents for job:', jobId);
          console.log('📄 Documents to process:', documents);
          
          // Filter out files that are already uploaded (have URLs)
          const filesToUpload = documents.filter(file => !file.url && file.originFileObj);
          console.log('📄 Files to upload:', filesToUpload);
          
          if (filesToUpload.length > 0) {
            await handleJobDocuments(jobId, filesToUpload, 'create');
          } else {
            console.log('📄 No new files to upload - all files already have URLs');
          }
        } else {
          console.warn('⚠️ No job ID available for document upload');
        }
      } else {
        console.log('📄 No documents to process');
      }
      
      loadJobs(); // Reload jobs
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.log('\n' + '='.repeat(80));
      console.log('💥 JOB SUBMIT ERROR');
      console.log('='.repeat(80));
      console.error('❌ Error details:', error);
      console.log('📄 Error message:', error.message);
      console.log('='.repeat(80) + '\n');
      message.error(error.message || 'Failed to save job');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setDraftLoading(true);
    try {
      // Validate form first
      const formValues = await form.validateFields();
      const { documents, trackingId, ...jobData } = formValues;
      
      // Debug: Log the form values
      console.log('🔍 Draft form values received:', formValues);
      console.log('🔍 Draft job data to send:', jobData);
      
      // Set isDraft to true
      const draftJobData = { ...jobData, isDraft: true };
      
      let response;
      if (editingJob) {
        // Update existing job
        console.log('💾 Updating existing job as draft...');
        response = await jobService.updateJob(editingJob.id, draftJobData);
        message.success('Job saved as draft');
      } else {
        // Create new job
        console.log('💾 Creating new job as draft...');
        response = await jobService.createJob(draftJobData);
        console.log('📋 Draft response:', response);
        message.success('Job saved as draft');
      }
      
      // Handle document uploads if we have documents and a job ID
      if (documents && documents.length > 0) {
        const jobId = response.job?.id || response.id;
        if (jobId) {
          console.log('📁 Processing documents for draft job:', jobId);
          console.log('📄 Documents to process:', documents);
          
          // Filter out files that are already uploaded (have URLs)
          const filesToUpload = documents.filter(file => !file.url && file.originFileObj);
          console.log('📄 Files to upload:', filesToUpload);
          
          if (filesToUpload.length > 0) {
            await handleJobDocuments(jobId, filesToUpload, 'create');
          } else {
            console.log('📄 No new files to upload - all files already have URLs');
          }
        } else {
          console.warn('⚠️ No job ID available for document upload');
        }
      } else {
        console.log('📄 No documents to process for draft');
      }
      
      loadJobs(); // Reload jobs
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        console.error('Draft save error:', error);
        message.error(error.message || 'Failed to save job as draft');
      }
    } finally {
      setDraftLoading(false);
    }
  };

  const handleCustomerSelect = async (customerId, customer) => {
    console.log('🔄 JobsPage: Customer selected:', customerId, customer);
    
    // Auto-fill client details when customer is selected
    form.setFieldsValue({
      customerId: customerId
    });
    
    // Get consignments for the selected customer
    try {
      console.log('🔄 JobsPage: Loading consignments for customer:', customerId);
      const consignments = await jobService.getCustomerConsignments(customerId);
      console.log('✅ JobsPage: Consignments loaded:', consignments);
      setSelectedCustomerConsignments(consignments || []);
    } catch (error) {
      console.error('💥 JobsPage: Error loading customer consignments:', error);
      setSelectedCustomerConsignments([]);
    }
    
    // Clear previously selected consignment
    form.setFieldsValue({ consignmentId: undefined });
  };

  const handleConsignmentSelect = (consignmentId) => {
    const selectedConsignment = selectedCustomerConsignments.find(c => c.id === consignmentId);
    if (selectedConsignment) {
      // Auto-fill consignment details (trackingId is system-generated)
      form.setFieldsValue({
        consignmentId: consignmentId
      });
    }
  };

  // Helper functions for dynamic dropdowns
  const handleCustomGoodsType = (value) => {
    // For multi-select, value is an array
    if (Array.isArray(value) && value.includes('Other')) {
      setCustomOptionType('Goods Type');
      setCustomOptionField('goodsTypes');
      setCustomOptionValue('');
      setIsCustomOptionModalVisible(true);
    }
  };

  const handleCustomVessel = (value) => {
    if (value === 'Other') {
      setCustomOptionType('Vessel Name');
      setCustomOptionField('vesselName');
      setCustomOptionValue('');
      setIsCustomOptionModalVisible(true);
    }
  };

  const handleCustomLine = (value) => {
    if (value === 'Other') {
      setCustomOptionType('Line');
      setCustomOptionField('line');
      setCustomOptionValue('');
      setIsCustomOptionModalVisible(true);
    }
  };

  const handleCustomOptionSubmit = () => {
    if (!customOptionValue.trim()) {
      message.error('Please enter a value');
      return;
    }

    const trimmedValue = customOptionValue.trim();
    
    if (customOptionField === 'goodsTypes') {
      setGoodsTypes(prev => [...prev, trimmedValue]);
      // For multi-select, remove 'Other' and add the new value
      const currentValues = form.getFieldValue('goodsTypes') || [];
      const filteredValues = currentValues.filter(val => val !== 'Other');
      form.setFieldsValue({
        goodsTypes: [...filteredValues, trimmedValue]
      });
    } else if (customOptionField === 'vesselName') {
      setVesselNames(prev => [...prev, trimmedValue]);
      form.setFieldsValue({
        vesselName: trimmedValue
      });
    } else if (customOptionField === 'line') {
      setLineOptions(prev => [...prev, trimmedValue]);
      form.setFieldsValue({
        line: trimmedValue
      });
    }

    message.success(`${customOptionType} added successfully!`);
    setIsCustomOptionModalVisible(false);
    setCustomOptionValue('');
  };

  const handleCustomOptionCancel = () => {
    setIsCustomOptionModalVisible(false);
    setCustomOptionValue('');
  };

  const handleStatusUpdate = async (values) => {
    setLoading(true);
    try {
      // Validate status transition
      if (currentJobForStatusUpdate && !isValidStatusTransition(currentJobForStatusUpdate.status, values.status)) {
        message.error('Invalid status transition. Jobs can only progress forward in the workflow.');
        setLoading(false);
        return;
      }
      
      // Format ETA if it's a moment object
      const eta = values.eta ? values.eta.toISOString() : undefined;
      console.log('🔍 Frontend ETA:', values.eta, 'Formatted:', eta);
      
      const response = await jobService.updateJobStatus(selectedJob.id, values.status, values.comment, eta);
      console.log('🔍 Backend response job data:', response);
      message.success('Job status updated successfully');
      setIsStatusUpdateModalVisible(false);
      setCurrentJobForStatusUpdate(null);
      statusUpdateForm.resetFields();
      loadJobs(); // Reload jobs
    } catch (error) {
      console.error('Status update error:', error);
      message.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setIsDocumentViewerVisible(true);
  };



  // Function to get consignments for a customer - will be replaced with API call
  const getMockConsignmentsForCustomer = (customerName) => {
    // TODO: Replace with actual API call
    return [];
  };

  const handleFileChange = (fileList) => {
    console.log('\n' + '='.repeat(60));
    console.log('📁 FILE CHANGE HANDLER');
    console.log('='.repeat(60));
    console.log('📋 New file list:', fileList);
    console.log('📊 File count:', fileList?.length || 0);
    console.log('🔧 Setting form field value...');
    
    form.setFieldsValue({ documents: fileList });
    
    console.log('✅ Form field updated successfully');
    console.log('='.repeat(60) + '\n');
  };

  const handleFileUpload = async (file, options = {}) => {
    console.log('\n' + '='.repeat(60));
    console.log('📤 JOB FILE UPLOAD HANDLER');
    console.log('='.repeat(60));
    console.log('📄 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    console.log('⚙️ Upload options:', options);
    console.log('🔧 Editing job ID:', editingJob?.id);
    
    try {
      // Upload file with job-specific options if we have a job ID
      const uploadOptions = {
        folder: 'jobs',
        category: 'job_document',
        ...options
      };
      
      if (editingJob?.id) {
        uploadOptions.entityId = editingJob.id;
        uploadOptions.entityType = 'job';
        console.log('🔗 Linking to existing job:', editingJob.id);
      } else {
        console.log('⚠️ No editing job ID - file will be uploaded without entity link');
      }
      
      console.log('📤 Final upload options:', uploadOptions);
      console.log('🚀 Starting file upload...');
      
      const response = await fileService.uploadFile(file, uploadOptions);
      
      console.log('✅ File upload successful!');
      console.log('📄 Response:', response);
      console.log('='.repeat(60) + '\n');
      
      return response;
    } catch (error) {
      console.log('\n' + '='.repeat(60));
      console.log('💥 JOB FILE UPLOAD ERROR');
      console.log('='.repeat(60));
      console.error('❌ File upload failed:', error);
      console.log('📄 Error details:', {
        message: error.message,
        stack: error.stack
      });
      console.log('='.repeat(60) + '\n');
      
      throw error;
    }
  };

  const handleJobDocuments = async (jobId, documents, action) => {
    try {
      console.log(`📁 Handling documents for job ${jobId} (${action}):`, documents);
      
      // Filter out files that are already uploaded (have URLs)
      const filesToUpload = documents.filter(file => !file.url && file.originFileObj);
      
      if (filesToUpload.length === 0) {
        console.log('📁 No new files to upload');
        return;
      }

      // Upload each file and associate with job
      for (const file of filesToUpload) {
        try {
          const uploadResponse = await fileService.uploadFile(file.originFileObj, {
            folder: 'jobs',
            category: 'job_document',
            entityId: jobId,
            entityType: 'job'
          });
          
          console.log(`✅ File uploaded successfully:`, uploadResponse);
        } catch (uploadError) {
          console.error(`❌ Failed to upload file ${file.name}:`, uploadError);
          message.error(`Failed to upload ${file.name}`);
        }
      }
      
      console.log(`✅ All documents processed for job ${jobId}`);
    } catch (error) {
      console.error('❌ Error handling job documents:', error);
      message.error('Failed to process some documents');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
        <Title level={2}>Jobs Management</Title>
          <Text type="secondary">Manage client jobs and document submissions</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={handleNewJob}
        >
          New Job
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
              title="Total Jobs"
              value={jobs.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
              />
            </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pre-invoiced"
              value={jobs.filter(j => j.status === 'PREINVOICED').length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
          </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Invoiced"
              value={jobs.filter(j => j.status === 'INVOICED').length}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
          </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Cleared"
              value={jobs.filter(j => j.status === 'CLEARED').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
      </Card>
        </Col>
      </Row>

      {/* Jobs Tabs */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: `All Jobs (${jobs.length})`,
              children: (
                <div>
                  {error && (
                    <Alert
                      message="Error Loading Jobs"
                      description={error}
                      type="error"
                      showIcon
                      style={{ marginBottom: '16px' }}
                      action={
                        <Button size="small" onClick={loadJobs}>
                          Retry
                        </Button>
                      }
                    />
                  )}
                  <Table
                    columns={columns}
                    dataSource={jobs}
                    loading={jobsLoading}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} jobs`
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <Text type="secondary" style={{ fontSize: '16px', marginBottom: '8px' }}>
                                No jobs found
                              </Text>
                              <Text type="secondary" style={{ fontSize: '14px' }}>
                                Get started by creating your first job
                              </Text>
                            </div>
                          }
                        >
                          <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={() => setIsModalVisible(true)}
                            size="large"
                          >
                            Create First Job
                          </Button>
                        </Empty>
                      )
                    }}
                  />
                </div>
              )
            },
            {
              key: 'drafts',
              label: `Drafts (${draftJobs.length})`,
              children: (
                <div>
                  <Table
                    columns={columns}
                    dataSource={draftJobs}
                    loading={jobsLoading}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} drafts`
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <Text type="secondary" style={{ fontSize: '16px', marginBottom: '8px' }}>
                                No drafts found
                              </Text>
                              <Text type="secondary" style={{ fontSize: '14px' }}>
                                Draft jobs will appear here when saved
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

      {/* Create/Edit Job Modal */}
      <Modal
        title={editingJob ? 'Edit Job' : 'New Job'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
        bodyStyle={{ 
          maxHeight: 'calc(100vh - 200px)', 
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px'
        }}
        className="job-form-modal"
      >
        <div style={{ 
          maxHeight: 'calc(100vh - 300px)', 
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%'
        }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              documents: []
            }}
            style={{ width: '100%', maxWidth: '100%' }}
          >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="customerId"
                label="Select Client"
                rules={[{ required: true, message: 'Please select a client' }]}
              >
                <CustomerSelector
                  onChange={handleCustomerSelect}
                  placeholder="Search and select client..."
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="consignmentId"
                label="Select Consignment"
                rules={[{ required: true, message: 'Please select a consignment' }]}
              >
                <Select 
                  placeholder={selectedCustomerConsignments.length === 0 ? "No consignments found for this client" : "Select a consignment for this client"}
                  onChange={handleConsignmentSelect}
                  disabled={selectedCustomerConsignments.length === 0}
                  notFoundContent={selectedCustomerConsignments.length === 0 ? "No consignments found for this client" : "No consignments"}
                >
                  {selectedCustomerConsignments.map(consignment => (
                    <Option key={consignment.id} value={consignment.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{consignment.trackingId} - {consignment.consigneeName}</span>
                        <span style={{ fontSize: '12px', color: '#999' }}>
                          {consignment.status}
                        </span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>



          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="trackingId"
                label="Job ID"
                extra="Job ID will be automatically generated by the system"
              >
                <Input 
                  placeholder="System will generate Job ID automatically" 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="goodsTypes"
                label="Types of Goods"
                rules={[{ required: true, message: 'Please select at least one goods type' }]}
              >
                <Select 
                  mode="multiple"
                  placeholder="Select goods types for this job"
                  style={{ width: '100%' }}
                  maxTagCount="responsive"
                  onChange={handleCustomGoodsType}
                >
                  {goodsTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                  <Option value="Other">Other (Add Custom)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assignedToId"
                label="Assign To"
                rules={[{ required: true, message: 'Please assign the job' }]}
              >
                <Select placeholder="Select team member">
                  {staffMembers.length > 0 ? (
                    staffMembers.map(member => (
                      <Option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </Option>
                    ))
                  ) : (
                    <Option disabled value="no-users">
                      No team members available
                    </Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
          <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
                initialValue="NEW"
              >
                <Select placeholder="Select status" disabled>
                  <Option value="NEW">New</Option>
                </Select>
          </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="eta"
                label="ETA"
                rules={[{ required: true, message: 'Please select ETA' }]}
                help="Expected delivery time"
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm"
                  placeholder="Select ETA"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mediumOfEnquiry"
                label="Medium of Enquiry Documents"
                rules={[{ required: false, message: 'Please select medium of enquiry' }]}
              >
                <Select placeholder="How were documents received?">
                  <Option value="Email">Email</Option>
                  <Option value="Dispatch">Dispatch</Option>
                  <Option value="VVIP">VVIP</Option>
                  <Option value="WhatsApp">WhatsApp</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="documentsBrought"
                label="Documents Brought"
                rules={[{ required: false, message: 'Please select documents brought' }]}
              >
                <Select 
                  mode="multiple"
                  placeholder="Select documents brought by client"
                  style={{ width: '100%' }}
                >
                  <Option value="Parking list copy">Parking list copy</Option>
                  <Option value="Parking list original">Parking list original</Option>
                  <Option value="Container No">Container No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="containerNumber"
                label="Container Number"
                rules={[{ required: false, message: 'Please enter container number' }]}
              >
                <Input placeholder="Enter container number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="blNumber"
                label="B/L Number"
                rules={[{ required: false, message: 'Please enter B/L number' }]}
              >
                <Input placeholder="Enter B/L number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vesselName"
                label="Vessel Name"
                rules={[{ required: false, message: 'Please select vessel name' }]}
              >
                <Select 
                  placeholder="Select vessel name"
                  onChange={handleCustomVessel}
                >
                  {vesselNames.map(vessel => (
                    <Option key={vessel} value={vessel}>{vessel}</Option>
                  ))}
                  <Option value="Other">Other (Add Custom)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="line"
                label="LINE"
                rules={[{ required: false, message: 'Please select line' }]}
              >
                <Select 
                  placeholder="Select line"
                  onChange={handleCustomLine}
                >
                  {lineOptions.map(line => (
                    <Option key={line} value={line}>{line}</Option>
                  ))}
                  <Option value="Other">Other (Add Custom)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="jobDescription"
                label="Job Description"
                rules={[{ required: false, message: 'Please enter job description' }]}
              >
                <Input.TextArea 
                  placeholder="Enter detailed job description"
                  rows={4}
                />
              </Form.Item>
            </Col>
          </Row>


          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Documents"
                name="documents"
              >
                <FileUpload
                  multiple={true}
                  maxCount={5}
                  accept="*"
                  onFileChange={handleFileChange}
                  onFileUpload={handleFileUpload}
                  uploadText="Upload Documents"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button 
                type="default" 
                htmlType="button" 
                loading={draftLoading}
                onClick={handleSaveAsDraft}
              >
                Save as Draft
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitLoading}
              >
                {editingJob ? 'Update Job' : 'Submit Job'}
              </Button>
            </Space>
          </Form.Item>
          </Form>
        </div>
        </Modal>

        {/* Status Update Modal */}
        <Modal
          title="Update Job Status"
        open={isStatusUpdateModalVisible}
        onCancel={() => {
          setIsStatusUpdateModalVisible(false);
          setCurrentJobForStatusUpdate(null);
        }}
        footer={null}
        >
          {currentJobForStatusUpdate && (
            <div style={{ marginBottom: '16px' }}>
              {/* Workflow Progress Indicator */}
              <div style={{ padding: '8px', backgroundColor: '#fafafa', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
                  <strong>Workflow Progress:</strong>
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(STATUS_HIERARCHY).map(([status, level]) => {
                    const isCurrent = status === currentJobForStatusUpdate.status;
                    const isAvailable = getAvailableStatuses(currentJobForStatusUpdate.status).includes(status);
                    const isPast = level < STATUS_HIERARCHY[currentJobForStatusUpdate.status];
                    
                    return (
                      <div key={status} style={{ display: 'flex', alignItems: 'center' }}>
                        <Tag 
                          color={isCurrent ? 'blue' : isPast ? 'green' : isAvailable ? 'orange' : 'default'}
                          style={{ fontSize: '11px' }}
                        >
                          {STATUS_LABELS[status]}
                        </Tag>
                        {level < 7 && (
                          <span style={{ color: '#d9d9d9', fontSize: '12px' }}>→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Text type="secondary" style={{ fontSize: '10px', marginTop: '4px', display: 'block' }}>
                  <span style={{ color: '#52c41a' }}>●</span> Completed &nbsp;
                  <span style={{ color: '#1890ff' }}>●</span> Current &nbsp;
                  <span style={{ color: '#fa8c16' }}>●</span> Available &nbsp;
                  <span style={{ color: '#d9d9d9' }}>●</span> Locked
                </Text>
              </div>
            </div>
          )}
          
          <Form
            form={statusUpdateForm}
            layout="vertical"
          onFinish={handleStatusUpdate}
          >
            <Form.Item
              name="status"
              label="New Status"
            rules={[{ required: true, message: 'Please select new status' }]}
          >
            <Select placeholder="Select new status">
              {currentJobForStatusUpdate && getAvailableStatuses(currentJobForStatusUpdate.status).map(status => (
                <Option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </Option>
              ))}
            </Select>
            </Form.Item>

            <Form.Item
              name="comment"
              label="Comment"
            rules={[{ required: true, message: 'Please add a comment for this status update' }]}
          >
            <TextArea rows={4} placeholder="Describe why the status is being updated..." />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.status !== currentValues.status
            }
          >
            {({ getFieldValue }) => {
              const status = getFieldValue('status');
              return status === 'RELEASE' ? (
                <Form.Item
                  name="eta"
                  label="ETA"
                  rules={[{ required: true, message: 'ETA is required for Release status' }]}
                  help="Select the expected delivery time"
                >
                  <DatePicker 
                    showTime 
                    format="YYYY-MM-DD HH:mm"
                    placeholder="Select ETA"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsStatusUpdateModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Status
              </Button>
            </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Document Viewer Modal */}
        <Modal
          title={
            <div>
              <Title level={4} style={{ margin: 0 }}>Document Viewer</Title>
              <Text type="secondary">{selectedDocument}</Text>
            </div>
          }
          open={isDocumentViewerVisible}
          onCancel={() => setIsDocumentViewerVisible(false)}
          footer={null}
          width={800}
        >
          {selectedDocument && (
            <div>
              {/* Document Header */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    {getDocumentIcon(selectedDocument)}
                    <br />
                    <Text strong style={{ fontSize: '16px' }}>
                      {selectedDocument}
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>File Type</Text>
                    <br />
                    <Tag color="blue" style={{ marginTop: '8px' }}>
                      {(typeof selectedDocument === 'string' ? selectedDocument : selectedDocument.originalName).split('.').pop()?.toUpperCase()}
                    </Tag>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>Job</Text>
                    <br />
                    <Text style={{ fontSize: '16px', color: '#1890ff' }}>
                      {selectedJob?.trackingId}
                    </Text>
                  </div>
                </Col>
              </Row>

              <Divider />

              {/* Document Actions */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Button 
                    type="primary" 
                    icon={<EyeOutlined />} 
                    block
                    size="large"
                  >
                    Preview Document
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    icon={<DownloadOutlined />} 
                    block
                    size="large"
                  >
                    Download
                  </Button>
                </Col>
                <Col span={8}>
                  <Button 
                    icon={<ShareAltOutlined />} 
                    block
                    size="large"
                  >
                    Share
                  </Button>
                </Col>
              </Row>

              {/* Document Information */}
              <Card size="small" title="Document Information">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="File Name">
                    {typeof selectedDocument === 'string' ? selectedDocument : selectedDocument.originalName}
                  </Descriptions.Item>
                  <Descriptions.Item label="File Extension">
                    <Tag color="blue">{(typeof selectedDocument === 'string' ? selectedDocument : selectedDocument.originalName).split('.').pop()?.toUpperCase()}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Job ID">
                    {selectedJob?.trackingId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Client">
                    {selectedJob?.clientName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Upload Date">
                    {selectedJob?.submittedDate}
                  </Descriptions.Item>
                  <Descriptions.Item label="Document Type">
                    {getDocumentTypeLabel(selectedDocument)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Document Preview Placeholder */}
              <Card size="small" title="Document Preview" style={{ marginTop: 16 }}>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  background: '#fafafa', 
                  border: '2px dashed #d9d9d9',
                  borderRadius: '8px'
                }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <br />
                  <Text type="secondary">Document preview will be displayed here</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    PDF, images, and other supported formats will show actual content
                  </Text>
                </div>
              </Card>
            </div>
          )}
        </Modal>

      {/* Job Details Drawer */}
       <Drawer
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Job Details
            </Title>
            <Text type="secondary">Job ID: {selectedJob?.trackingId}</Text>
          </div>
        }
         placement="right"
         onClose={() => setIsDetailsDrawerVisible(false)}
         open={isDetailsDrawerVisible}
         width={800}
                extra={
          <Space>
            <Button 
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentJobForStatusUpdate(selectedJob);
                statusUpdateForm.setFieldsValue({ status: selectedJob.status });
                setIsStatusUpdateModalVisible(true);
              }}
            >
              Update Status
            </Button>
           <Dropdown
             menu={{
               items: [
                 {
                   key: 'edit',
                    label: 'Edit Job',
                   icon: <EditOutlined />,
                   onClick: () => {
                     setIsDetailsDrawerVisible(false);
                     handleEditJob(selectedJob);
                   },
                 },
                 {
                    key: 'delete',
                    label: 'Delete Job',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => {
                      setIsDetailsDrawerVisible(false);
                      handleDeleteJob(selectedJob);
                    },
                 },
               ],
             }}
             placement="bottomRight"
             arrow
           >
              <Button 
                type="text" 
                icon={<MoreOutlined />}
                size="large"
              />
            </Dropdown>
          </Space>
        }
       >
         {selectedJob && (
          <Tabs defaultActiveKey="details" style={{ marginTop: '16px' }}>
            <TabPane 
              tab={
                <span>
                  <ClockCircleOutlined />
                  Timeline
                </span>
              } 
              key="timeline"
            >
              <Card title="Status Timeline" size="small">
                {selectedJob.statusHistory && selectedJob.statusHistory.length > 0 ? (
                       <Timeline>
                    {selectedJob.statusHistory.map((entry, index) => (
                           <Timeline.Item 
                             key={index} 
                        color={getStatusColor(entry.status)}
                        dot={<UserOutlined style={{ color: getStatusColor(entry.status) }} />}
                           >
                             <div>
                          <Text strong>{entry.status}</Text>
                               <br />
                          <Text type="secondary">{entry.comment}</Text>
                               <br />
                               <Text type="secondary" style={{ fontSize: '12px' }}>
                            {entry.date} - {entry.updatedBy}
                               </Text>
                             </div>
                           </Timeline.Item>
                         ))}
                       </Timeline>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <ClockCircleOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
                    <br />
                    <Text type="secondary">No status updates yet</Text>
                  </div>
                )}
                     </Card>
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <UserOutlined />
                  Activities
                </span>
              } 
              key="activities"
            >
                     <Card title="User Activities" size="small">
                       {selectedJob.statusHistory && selectedJob.statusHistory.length > 0 ? (
                         <Timeline>
                           {selectedJob.statusHistory.map((entry, index) => (
                             <Timeline.Item 
                               key={index}
                               color={getStatusColor(entry.status)}
                               dot={getStatusIcon(entry.status)}
                             >
                               <div>
                                 <Text strong>{entry.status}</Text>
                                 <br />
                                 <Text type="secondary">{entry.comment || 'No comment provided'}</Text>
                                 <br />
                                 <Text type="secondary" style={{ fontSize: '12px' }}>
                                   {entry.date} - {entry.updatedByUser?.name || entry.updatedBy || 'Unknown'}
                                 </Text>
                               </div>
                             </Timeline.Item>
                           ))}
                         </Timeline>
                       ) : (
                         <div style={{ textAlign: 'center', padding: '20px' }}>
                           <Text type="secondary">No activity history available</Text>
                         </div>
                       )}
                     </Card>
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <FileTextOutlined />
                  Details
                </span>
              } 
              key="details"
            >
              {/* Job Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <Title level={3}>{selectedJob.trackingId}</Title>
                  <Tag color={getStatusColor(selectedJob.status)} size="large">
                    {selectedJob.status}
                                  </Tag>
                </div>
              </div>

              {/* Job Overview */}
              <div style={{ 
                marginBottom: '24px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <Title level={4} style={{ 
                  marginBottom: '20px', 
                  borderBottom: '1px solid #d9d9d9',
                  paddingBottom: '8px'
                }}>
                  Job Overview
                </Title>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Created By:</div>
                  <div>{selectedJob.createdBy?.name || 'Unknown'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Assigned To:</div>
                  <div>{selectedJob.assignedTo?.name || selectedJob.assignedTo || 'Unassigned'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Submitted Date:</div>
                  <div>{selectedJob.submittedDate}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>ETA:</div>
                  <div>
                    {selectedJob.eta ? (
                      <Tag color="blue">
                        {new Date(selectedJob.eta).toLocaleString()}
                      </Tag>
                    ) : (
                      <Text type="secondary">Not set</Text>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div style={{ 
                marginBottom: '24px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <Title level={4} style={{ 
                  marginBottom: '20px', 
                  borderBottom: '1px solid #d9d9d9',
                  paddingBottom: '8px'
                }}>
                  Client Information
                </Title>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Name:</div>
                  <div>{selectedJob.customer?.name || 'Unknown'}</div>
                     </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Email:</div>
                  <div>{selectedJob.customer?.email || 'Unknown'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Phone:</div>
                  <div>{selectedJob.customer?.phone || 'Unknown'}</div>
                </div>
              </div>

              {/* Job Information */}
              <div style={{ 
                marginBottom: '24px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <Title level={4} style={{ 
                  marginBottom: '20px', 
                  borderBottom: '1px solid #d9d9d9',
                  paddingBottom: '8px'
                }}>
                  Job Information
                </Title>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Consignment:</div>
                  <div>{selectedJob.consignment?.trackingId || 'No consignment linked'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Consignee:</div>
                  <div>{selectedJob.consignment?.consigneeName || 'Not specified'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Consignee Phone:</div>
                  <div>{selectedJob.consignment?.consigneePhone || 'Not specified'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Goods Types:</div>
                  <div>
                    {selectedJob.goodsTypes && selectedJob.goodsTypes.length > 0 ? (
                      selectedJob.goodsTypes.map((type, index) => (
                        <Tag key={index} color="blue" style={{ marginBottom: '2px', marginRight: '4px' }}>
                          {type}
                        </Tag>
                      ))
                    ) : (
                      <Tag color="default">No goods types</Tag>
                    )}
                  </div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Medium of Enquiry:</div>
                  <div>{selectedJob.mediumOfEnquiry || 'Not specified'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Documents Brought:</div>
                  <div>
                    {selectedJob.documentsBrought && selectedJob.documentsBrought.length > 0 ? (
                      selectedJob.documentsBrought.map((doc, index) => (
                        <Tag key={index} color="green" style={{ marginBottom: '2px', marginRight: '4px' }}>
                          {doc}
                        </Tag>
                      ))
                    ) : (
                      <Tag color="default">No documents specified</Tag>
                    )}
                  </div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Container Number:</div>
                  <div>{selectedJob.containerNumber || 'Not specified'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>B/L Number:</div>
                  <div>{selectedJob.blNumber || 'Not specified'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Vessel Name:</div>
                  <div>{selectedJob.vesselName || 'Not specified'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>LINE:</div>
                  <div>{selectedJob.line || 'Not specified'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Job Description:</div>
                  <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                    {selectedJob.jobDescription || 'No description provided'}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div style={{ 
                marginBottom: '24px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#ffffff'
              }}>
                <Title level={4} style={{ 
                  marginBottom: '20px', 
                  borderBottom: '1px solid #d9d9d9',
                  paddingBottom: '8px'
                }}>
                  Attached Documents
                </Title>
                {selectedJobDocuments && selectedJobDocuments.length > 0 ? (
                  <div>
                    {selectedJobDocuments.map((doc, index) => (
                      <div key={doc.id || index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '8px 0',
                        borderBottom: index < selectedJobDocuments.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <div style={{ marginRight: '8px' }}>
                          {getDocumentIcon(doc)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text strong>{doc.originalName}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {formatFileSize(doc.size)} • {doc.mimeType}
                          </Text>
                        </div>
                        <Button 
                          type="text" 
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDocument(doc)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <FileTextOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
                    <br />
                    <Text type="secondary">No documents attached</Text>
           </div>
                )}
              </div>
            </TabPane>
          </Tabs>
         )}
       </Drawer>

       {/* Custom Option Modal */}
       <Modal
         title={
           <div style={{ display: 'flex', alignItems: 'center' }}>
             <PlusOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
             Add Custom {customOptionType}
           </div>
         }
         open={isCustomOptionModalVisible}
         onOk={handleCustomOptionSubmit}
         onCancel={handleCustomOptionCancel}
         okText="Add"
         cancelText="Cancel"
         okButtonProps={{ 
           type: 'primary',
           icon: <PlusOutlined />
         }}
         width={500}
       >
         <div style={{ padding: '20px 0' }}>
           <Form layout="vertical">
             <Form.Item
               label={`Enter custom ${customOptionType.toLowerCase()}:`}
               required
               style={{ marginBottom: '24px' }}
             >
               <Input
                 placeholder={`Enter ${customOptionType.toLowerCase()}...`}
                 value={customOptionValue}
                 onChange={(e) => setCustomOptionValue(e.target.value)}
                 onPressEnter={handleCustomOptionSubmit}
                 autoFocus
                 size="large"
               />
             </Form.Item>
             
             <div style={{ 
               background: '#f6f8fa', 
               padding: '16px', 
               borderRadius: '6px',
               border: '1px solid #e1e4e8'
             }}>
               <Text type="secondary" style={{ fontSize: '14px' }}>
                 <InfoCircleOutlined style={{ marginRight: '6px' }} />
                 This {customOptionType.toLowerCase()} will be saved and available for future selections.
               </Text>
             </div>
           </Form>
         </div>
       </Modal>
     </div>
   );
 };

export default JobsPage;
