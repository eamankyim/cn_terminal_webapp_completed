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
import dayjs from 'dayjs';
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
  InfoCircleOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomerSelector from '../components/common/CustomerSelector';
import ConsigneeSelector from '../components/common/ConsigneeSelector';
import FileUpload from '../components/common/FileUpload';
import ResponsiveTable from '../components/common/ResponsiveTable';
import DocumentPreviewModal from '../components/common/DocumentPreviewModal';
import { useCustomers } from '../contexts/CustomerContext';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../utils/permissions';
import userService from '../services/userService';
import jobService from '../services/jobService';
import { fileService } from '../services/fileService';
import apiService from '../services/api';
import configurationService from '../services/configurationService';
import { getJobStatusColor, getJobStatusIcon as getStatusIconUtil, getEtaUrgency, getEtaAntColor, formatEtaDate, ETA_FILTER, ETA_FILTER_OPTIONS, jobMatchesEtaFilter } from '../utils/statusUtils';
import { getDefaultEtaFilter, setDefaultEtaFilter } from '../utils/userPreferences';
import { useJobSocket } from '../hooks/useJobSocket.js';

const DEFAULT_GOODS_TYPES = [
  'Electronics', 'Textiles', 'Machinery', 'Pharmaceuticals', 'Food & Beverages',
  'Automotive', 'Furniture', 'Clothing & Accessories', 'Books & Media',
  'Sports & Recreation', 'Health & Beauty', 'Tools & Hardware'
];

const DEFAULT_VESSEL_NAMES = [
  'RHL Concordia', 'MAERSK TEMA', 'Seaspan Dalian', 'MAERSK KARUN',
  'MAESK Cunene', 'Hammonia Toscan'
];

const DEFAULT_SHIPPING_LINES = ['PIL', 'SAF', 'COSCO', 'CMA', 'OOCL', 'MSK', 'ONE'];

const DEFAULT_TERMINAL_NAMES = ['Golden Jubilee', 'MPS', 'TBT', 'Terminal 2'];

const GOODS_TYPES_CONFIG_KEY = 'GOODS_TYPES';
const VESSEL_NAMES_CONFIG_KEY = 'VESSEL_NAMES';
const SHIPPING_LINES_CONFIG_KEY = 'SHIPPING_LINES';
const TERMINAL_NAMES_CONFIG_KEY = 'TERMINAL_NAMES';

const JOB_LIST_META = {
  [GOODS_TYPES_CONFIG_KEY]: {
    category: 'JOBS',
    description: 'Available goods types for job forms'
  },
  [VESSEL_NAMES_CONFIG_KEY]: {
    category: 'JOBS',
    description: 'Available vessel names for job forms'
  },
  [SHIPPING_LINES_CONFIG_KEY]: {
    category: 'JOBS',
    description: 'Available shipping lines for job forms'
  },
  [TERMINAL_NAMES_CONFIG_KEY]: {
    category: 'JOBS',
    description: 'Available terminal names for RELEASED status'
  }
};

// Status hierarchy system - jobs can only progress forward
const STATUS_HIERARCHY = {
  'NEW': 1,
  'PREINVOICED': 2,
  'INVOICED': 3,            // Invoice officer stage after pre-invoice
  'VETTED': 4,              // Job has been vetted/reviewed
  'ENTRY_COMPLETED': 5,
  'DUTY_PAID': 6,           // Duty has been paid
  'READY_FOR_RELEASE': 7,  // Transport coordinator assigns and uploads docs
  'RELEASED': 8,
  'CLEARED': 9,
  'DELIVERED': 10          // Final status - no further changes
};

// Status display names
const STATUS_LABELS = {
  'NEW': 'New',
  'IN_PROGRESS': 'In Progress',
  'PREINVOICED': 'Pre-invoiced',
  'INVOICED': 'Invoiced',
  'VETTED': 'Vetted',
  'ENTRY_COMPLETED': 'Entry Completed',
  'DUTY_PAID': 'Duty Paid',
  'READY_FOR_RELEASE': 'Ready for Release',
  'RELEASED': 'Released',
  'CLEARED': 'Cleared',
  'DELIVERED': 'Delivered'
};

// Get available next statuses for a given current status
const getAvailableStatuses = (currentStatus, { allowRevert = false } = {}) => {
  const currentLevel = STATUS_HIERARCHY[currentStatus];
  if (!currentLevel) return [];

  const entries = Object.entries(STATUS_HIERARCHY);
  const forward = entries
    .filter(([status, level]) => {
      if (status === currentStatus) return false;
      if (status === 'DELIVERED') return currentStatus === 'CLEARED';
      return level > currentLevel;
    })
    .sort((a, b) => a[1] - b[1])
    .map(([status]) => status);

  if (!allowRevert) return forward;

  const backward = entries
    .filter(([, level]) => level < currentLevel)
    .sort((a, b) => b[1] - a[1])
    .map(([status]) => status);

  return [...forward, ...backward];
};

const isRevertTransition = (currentStatus, newStatus) => {
  const currentLevel = STATUS_HIERARCHY[currentStatus];
  const newLevel = STATUS_HIERARCHY[newStatus];
  return Boolean(currentLevel && newLevel && newLevel < currentLevel);
};

// Check if status transition is valid
const isValidStatusTransition = (currentStatus, newStatus, { allowRevert = false } = {}) => {
  const currentLevel = STATUS_HIERARCHY[currentStatus];
  const newLevel = STATUS_HIERARCHY[newStatus];
  
  if (!currentLevel || !newLevel) return false;
  if (newStatus === currentStatus) return false;

  if (allowRevert && newLevel < currentLevel) return true;
  
  // DELIVERED can only be set from CLEARED status (final stage)
  if (newStatus === 'DELIVERED') {
    return currentStatus === 'CLEARED';
  }

  if (currentStatus === 'DELIVERED') return false;
  
  // Must be forward progression
  if (newLevel <= currentLevel) return false;
  
  return true;
};

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const JobsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, hasPermission } = useAuth();
  const canRevertStatus = currentUser?.role === 'ADMIN' || currentUser?.role === 'IT_CONSULTANT';
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobDocuments, setSelectedJobDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isStatusUpdateModalVisible, setIsStatusUpdateModalVisible] = useState(false);
  const [statusUpdateForm] = Form.useForm();
  const [currentJobForStatusUpdate, setCurrentJobForStatusUpdate] = useState(null);
  const [isReassignModalVisible, setIsReassignModalVisible] = useState(false);
  const [reassignForm] = Form.useForm();
  const [reassignLoading, setReassignLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [draftJobs, setDraftJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [staffMembers, setStaffMembers] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [etaFilter, setEtaFilter] = useState(ETA_FILTER.ALL);
  const [defaultEtaFilter, setDefaultEtaFilterState] = useState(ETA_FILTER.ALL);
  const [jobComments, setJobComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentForm] = Form.useForm();
  const selectedCustomerId = Form.useWatch('customerId', form);
  
  // Dynamic dropdown states (persisted via configurations)
  const [goodsTypes, setGoodsTypes] = useState(DEFAULT_GOODS_TYPES);
  const [vesselNames, setVesselNames] = useState(DEFAULT_VESSEL_NAMES);
  const [lineOptions, setLineOptions] = useState(DEFAULT_SHIPPING_LINES);
  const [terminalOptions, setTerminalOptions] = useState([
    ...DEFAULT_TERMINAL_NAMES.map((t) => ({ value: t, label: t })),
    { value: 'Custom', label: 'Custom (Other)' }
  ]);
  const [showCustomTerminalInput, setShowCustomTerminalInput] = useState(false);
  const [customTerminalValue, setCustomTerminalValue] = useState('');
  const [error, setError] = useState(null);
  
  // Custom option modal state
  const [isCustomOptionModalVisible, setIsCustomOptionModalVisible] = useState(false);
  const [customOptionType, setCustomOptionType] = useState('');
  const [customOptionValue, setCustomOptionValue] = useState('');
  const [customOptionField, setCustomOptionField] = useState('');
  const [customOptionSaving, setCustomOptionSaving] = useState(false);

  useEffect(() => {
    loadJobs();
    loadStaffMembers();
    loadPersistedDropdownOptions();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    const saved = getDefaultEtaFilter(currentUser.id);
    setDefaultEtaFilterState(saved);
    setEtaFilter(saved);
  }, [currentUser?.id]);

  const handleSaveEtaFilterDefault = () => {
    if (!currentUser?.id) return;
    const saved = setDefaultEtaFilter(currentUser.id, etaFilter || ETA_FILTER.ALL);
    setDefaultEtaFilterState(saved);
    message.success('ETA filter saved as your default');
  };
  // Handle jobId parameter from URL (e.g. dashboard → Jobs)
  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (!jobId) return;

    let cancelled = false;

    const openJobFromUrl = async () => {
      try {
        let job = jobs.find((j) => j.id === jobId);
        if (!job) {
          job = await jobService.getJob(jobId);
        }
        if (cancelled || !job) return;

        await handleViewJob(job);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('jobId');
        const qs = newSearchParams.toString();
        navigate(qs ? `/enquiries?${qs}` : '/enquiries', { replace: true });
      } catch (error) {
        console.error('Failed to open job from URL:', error);
        message.error('Could not open that job');
      }
    };

    openJobFromUrl();

    return () => {
      cancelled = true;
    };
  }, [searchParams, jobs, navigate]);

  // Sync selectedJob with jobs list when jobs update
  useEffect(() => {
    if (selectedJob && jobs.length > 0) {
      const updatedJob = jobs.find(job => job.id === selectedJob.id);
      if (updatedJob && updatedJob.updatedAt !== selectedJob.updatedAt) {

        setSelectedJob(updatedJob);
      }
    }
  }, [jobs, selectedJob]);

  // Set up Socket.io listeners for real-time job updates
  useJobSocket({
    onJobCreated: (job) => {
      console.log('📡 [JobsPage] Job created via socket:', job);
      message.info(`New job ${job.trackingId} created`, 3);
      loadJobs(); // Reload jobs list
    },
    onJobUpdated: (job) => {
      console.log('📡 [JobsPage] Job updated via socket:', job);
      // Update job in the list if it exists
      setJobs(prevJobs => {
        const index = prevJobs.findIndex(j => j.id === job.id);
        if (index !== -1) {
          const updated = [...prevJobs];
          updated[index] = job;
          return updated;
        }
        return prevJobs;
      });
      // If this is the currently selected job, update it
      if (selectedJob && selectedJob.id === job.id) {
        setSelectedJob(job);
      }
    },
    onJobDeleted: (jobId) => {
      console.log('📡 [JobsPage] Job deleted via socket:', jobId);
      message.info('Job deleted', 3);
      // Remove from jobs list
      setJobs(prevJobs => prevJobs.filter(j => j.id !== jobId));
      setDraftJobs(prevDrafts => prevDrafts.filter(j => j.id !== jobId));
      // If this is the currently selected job, close the drawer
      if (selectedJob && selectedJob.id === jobId) {
        setIsDetailsDrawerVisible(false);
        setSelectedJob(null);
      }
    },
    onJobStatusUpdated: (job) => {
      console.log('📡 [JobsPage] Job status updated via socket:', job);
      message.success(`Job ${job.trackingId} status updated to ${job.status}`, 3);
      // Update job in the list
      setJobs(prevJobs => {
        const index = prevJobs.findIndex(j => j.id === job.id);
        if (index !== -1) {
          const updated = [...prevJobs];
          updated[index] = job;
          return updated;
        }
        return prevJobs;
      });
      // If this is the currently selected job, reload it to get updated status history
      if (selectedJob && selectedJob.id === job.id) {
        handleViewJob(job);
      }
    },
    onJobCommentAdded: (jobId, comment) => {
      console.log('📡 [JobsPage] Job comment added via socket:', jobId, comment);
      // If this is the currently selected job, reload comments
      if (selectedJob && selectedJob.id === jobId) {
        jobService.getJobComments(jobId).then(comments => {
          setJobComments(comments);
        }).catch(err => console.error('Error reloading comments:', err));
      }
    }
  });

  const applyJobsLists = (allJobs) => {
    const regularJobs = allJobs.filter((job) => !job.isDraft);
    const drafts = allJobs.filter((job) => job.isDraft);
    setJobs(regularJobs);
    setDraftJobs(drafts);
  };

  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      setError(null);

      const pageSize = 100;
      const first = await jobService.getJobs({ limit: pageSize, page: 1 });
      const firstJobs = first.jobs || [];
      applyJobsLists(firstJobs);
      setJobsLoading(false);

      const totalPages = first.pagination?.totalPages || 1;
      if (totalPages <= 1) {
        return;
      }

      // Load remaining pages in the background so the UI stays responsive
      const rest = [];
      for (let page = 2; page <= totalPages; page += 1) {
        const response = await jobService.getJobs({ limit: pageSize, page });
        rest.push(...(response.jobs || []));
      }
      applyJobsLists([...firstJobs, ...rest]);
    } catch (error) {
      if (error?.status !== 401) {
        setError('Failed to load jobs');
      }
      setJobsLoading(false);
    }
  };

  const buildTerminalSelectOptions = (names) => [
    ...configurationService.normalizeStringList(names).map((t) => ({
      value: t,
      label: t
    })),
    { value: 'Custom', label: 'Custom (Other)' }
  ];

  const loadPersistedDropdownOptions = async () => {
    try {
      const [goods, vessels, lines, terminals] = await Promise.all([
        configurationService.loadStringList(
          GOODS_TYPES_CONFIG_KEY,
          DEFAULT_GOODS_TYPES,
          JOB_LIST_META[GOODS_TYPES_CONFIG_KEY]
        ),
        configurationService.loadStringList(
          VESSEL_NAMES_CONFIG_KEY,
          DEFAULT_VESSEL_NAMES,
          JOB_LIST_META[VESSEL_NAMES_CONFIG_KEY]
        ),
        configurationService.loadStringList(
          SHIPPING_LINES_CONFIG_KEY,
          DEFAULT_SHIPPING_LINES,
          JOB_LIST_META[SHIPPING_LINES_CONFIG_KEY]
        ),
        configurationService.loadStringList(
          TERMINAL_NAMES_CONFIG_KEY,
          DEFAULT_TERMINAL_NAMES,
          JOB_LIST_META[TERMINAL_NAMES_CONFIG_KEY]
        )
      ]);

      setGoodsTypes(goods);
      setVesselNames(vessels);
      setLineOptions(lines);

      // Migrate any legacy localStorage terminals into the shared config once
      let mergedTerminals = terminals;
      try {
        const saved = JSON.parse(localStorage.getItem('terminalOptions') || '[]');
        const fromLs = saved
          .map((t) => (typeof t === 'string' ? t : t?.value))
          .filter(Boolean);
        if (fromLs.length > 0) {
          mergedTerminals = await configurationService.mergeStringList(
            TERMINAL_NAMES_CONFIG_KEY,
            fromLs,
            DEFAULT_TERMINAL_NAMES,
            JOB_LIST_META[TERMINAL_NAMES_CONFIG_KEY]
          );
          localStorage.removeItem('terminalOptions');
        }
      } catch (_) {
        // ignore migration errors
      }

      setTerminalOptions(buildTerminalSelectOptions(mergedTerminals));

      // Legacy harvest: merge RELEASED job terminals in the background (non-blocking)
      void (async () => {
        try {
          const response = await jobService.getJobs({
            limit: 100,
            status: 'RELEASED',
          });
          const fromJobs = (response.jobs || [])
            .map((job) => job.terminalName)
            .filter(Boolean);
          if (fromJobs.length === 0) return;
          const withJobs = await configurationService.mergeStringList(
            TERMINAL_NAMES_CONFIG_KEY,
            fromJobs,
            DEFAULT_TERMINAL_NAMES,
            JOB_LIST_META[TERMINAL_NAMES_CONFIG_KEY]
          );
          setTerminalOptions(buildTerminalSelectOptions(withJobs));
        } catch (_) {
          // non-critical
        }
      })();
    } catch (error) {
      console.error('Error loading dropdown options:', error);
      setGoodsTypes((prev) => (prev?.length ? prev : DEFAULT_GOODS_TYPES));
      setVesselNames((prev) => (prev?.length ? prev : DEFAULT_VESSEL_NAMES));
      setLineOptions((prev) => (prev?.length ? prev : DEFAULT_SHIPPING_LINES));
      setTerminalOptions((prev) =>
        prev?.length
          ? prev
          : buildTerminalSelectOptions(DEFAULT_TERMINAL_NAMES)
      );
    }
  };

  /** Keep terminal options in sync after jobs reload (no localStorage). */
  const loadTerminalOptions = async () => {
    try {
      const terminals = await configurationService.loadStringList(
        TERMINAL_NAMES_CONFIG_KEY,
        DEFAULT_TERMINAL_NAMES,
        JOB_LIST_META[TERMINAL_NAMES_CONFIG_KEY]
      );
      setTerminalOptions(buildTerminalSelectOptions(terminals));
    } catch (error) {
      console.error('Error loading terminal options:', error);
    }
  };

  const loadGoodsTypes = async () => {
    try {
      const latest = await configurationService.loadStringList(
        GOODS_TYPES_CONFIG_KEY,
        DEFAULT_GOODS_TYPES,
        JOB_LIST_META[GOODS_TYPES_CONFIG_KEY]
      );
      setGoodsTypes(latest);
    } catch (error) {
      console.error('Error loading goods types:', error);
      setGoodsTypes((prev) => (prev && prev.length > 0 ? prev : DEFAULT_GOODS_TYPES));
    }
  };

  const loadStaffMembers = async () => {
    try {

      const response = await userService.getAssignableUsers();

      if (!response.users || !Array.isArray(response.users)) {

        setStaffMembers([]);
        return;
      }
      
      // Log all assignable users with their details

      response.users.forEach((user, index) => {

      });

      setStaffMembers(response.users || []);

    } catch (error) {

      setStaffMembers([]);
      // Don't set error state for staff members as it's not critical
    }
  };

  const getStatusIcon = (status, isDraft) => {
    if (isDraft) {
      return <FileTextOutlined />;
    }
    const statusIcons = {
      'NEW': <PlusOutlined />,
      'PREINVOICED': <FileTextOutlined />,
      'INVOICED': <DollarOutlined />,
      'VETTED': <DollarOutlined />,
      'ENTRY': <ContainerOutlined />,
      'RELEASED': <CheckCircleOutlined />,
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
      title: 'Client Name',
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
      title: 'Container Number',
      dataIndex: 'containerNumber',
      key: 'containerNumber',
      render: (text) => <Text style={{ fontSize: '12px' }}>{text || '-'}</Text>
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
      render: (eta) => {
        if (!eta) return <Text type="secondary">-</Text>;
        const label = formatEtaDate(eta);
        const urgency = getEtaUrgency(eta);
        if (urgency === 'normal' || urgency === 'none') {
          return label;
        }
        return <Tag color={getEtaAntColor(eta)}>{label}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const displayStatus = record.isDraft ? 'DRAFT' : status;
        return (
          <Tag color={getJobStatusColor(status, record.isDraft)} icon={getStatusIcon(status, record.isDraft)}>
            {displayStatus}
          </Tag>
        );
      }
    },
    {
      title: 'Goods',
      dataIndex: 'goodsTypes',
      key: 'goodsTypes',
      width: 180,
      ellipsis: true,
      render: (goodsTypes) => {
        if (!goodsTypes || goodsTypes.length === 0) {
          return <Tag color="default">No goods types</Tag>;
        }
        const extraCount = goodsTypes.length - 1;
        const summary = extraCount > 0
          ? `${goodsTypes[0]} + ${extraCount}`
          : goodsTypes[0];
        return (
          <Tooltip title={goodsTypes.join(', ')}>
            <Tag color="blue" style={{ marginInlineEnd: 0, maxWidth: '100%' }}>
              {summary}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Created At',
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
      title: 'Vessel Name',
      dataIndex: 'vesselName',
      key: 'vesselName',
      render: (text) => <Text style={{ fontSize: '12px' }}>{text || '-'}</Text>
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

    setEditingJob(job);
    
    // Load existing documents for this job
    let existingDocuments = [];
    try {

      const documentsResponse = await fileService.getFilesByEntity('job', job.id);
      
      if (documentsResponse && documentsResponse.files) {

        existingDocuments = documentsResponse.files.map(file => ({
          uid: file.id.toString(),
          name: file.originalName,
          status: 'done',
          url: file.url,
          size: file.size,
          type: file.mimeType
        }));

      } else {

      }
    } catch (error) {

    }
    
    const staticDocumentLabels = [
      'Parking list',
      'Parking list & Copy',
      'Copy BL',
      'Original BL',
      'Draft BL',
    ];

    const existingDocs = Array.isArray(job.documentsBrought)
      ? job.documentsBrought
      : [];

    // Map stored values back into multi-select placeholder choices.
    // New jobs store actual values (container number/image) inside documentsBrought.
    // The form expects placeholders ('Container No', 'Container Image') in documentsBrought.
    let derivedContainerImage = '';
    let mappedDocumentsBrought = [];

    existingDocs.forEach((d) => {
      if (d === 'Container No') {
        mappedDocumentsBrought.push('Container No');
        return;
      }

      if (d === 'Container Image') {
        mappedDocumentsBrought.push('Container Image');
        return;
      }

      if (staticDocumentLabels.includes(d)) {
        mappedDocumentsBrought.push(d);
        return;
      }

      // If it matches the stored container number, treat it as "Container No".
      if (job.containerNumber && d === job.containerNumber) {
        mappedDocumentsBrought.push('Container No');
        return;
      }

      // Otherwise assume it's the container image value.
      if (!derivedContainerImage) {
        derivedContainerImage = d;
      }
      mappedDocumentsBrought.push('Container Image');
    });

    mappedDocumentsBrought = Array.from(new Set(mappedDocumentsBrought));

    const formValues = {
      customerId: job.customerId,
      consignmentId: job.consignmentId,
      goodsTypes: job.goodsTypes || [],
      assignedToId: job.assignedToId,
      eta: job.eta ? dayjs(job.eta) : null,
      mediumOfEnquiry: job.mediumOfEnquiry,
      documentsBrought: mappedDocumentsBrought,
      containerNumber: job.containerNumber,
      blNumber: job.blNumber,
      vesselName: job.vesselName,
      line: job.line,
      jobDescription: job.jobDescription,
      status: job.status,
      containerImage: derivedContainerImage,
      documents: existingDocuments
    };

    form.setFieldsValue(formValues);

    setIsModalVisible(true);
  };

  const handleViewJob = async (job) => {
    console.log('🔷 [JobsPage] handleViewJob called for job:', job.id, job.trackingId);
    
    // Show drawer immediately with complete job data (already loaded)
    setSelectedJob(job);
    setIsDetailsDrawerVisible(true);
    
    // Set loading state and clear previous documents
    setDocumentsLoading(true);
    setSelectedJobDocuments([]);
    
    // Load job comments
    setCommentsLoading(true);
    setJobComments([]);
    try {
      const comments = await jobService.getJobComments(job.id);
      setJobComments(comments);
    } catch (error) {
      console.error('Error loading job comments:', error);
      setJobComments([]);
    } finally {
      setCommentsLoading(false);
    }
    
    // Fetch documents for this job
    try {
      console.log('  - Fetching documents for job:', job.id);
      const documentsResponse = await fileService.getFilesByEntity('job', job.id);
      console.log('  - Documents response:', documentsResponse);
      
      if (documentsResponse && documentsResponse.files) {
        console.log('✅ Found', documentsResponse.files.length, 'documents');
        console.log('  - Documents:', documentsResponse.files);
        setSelectedJobDocuments(documentsResponse.files);
      } else {
        console.log('⚠️ No documents found in response');
        setSelectedJobDocuments([]);
      }
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      console.error('  - Error response:', error.response?.data);
      setSelectedJobDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleAddComment = async (values) => {
    if (!selectedJob) return;
    
    try {
      await jobService.addJobComment(selectedJob.id, values.comment);
      message.success('Comment added successfully');
      commentForm.resetFields();
      
      // Reload comments
      const comments = await jobService.getJobComments(selectedJob.id);
      setJobComments(comments);
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error(error.response?.data?.error || 'Failed to add comment');
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
      const { documents: documentsValue, ...jobData } = values;

      // Transform "placeholder" document selections into their actual typed values.
      // We store the actual values inside `documentsBrought` (no DB column for container image).
      const containerNumberValue = (jobData.containerNumber || '').trim();
      const containerImageValue = (jobData.containerImage || '').trim();

      let transformedDocumentsBrought = Array.isArray(jobData.documentsBrought)
        ? [...jobData.documentsBrought]
        : [];

      if (transformedDocumentsBrought.includes('Container No')) {
        if (!containerNumberValue) {
          message.error('Please enter container number for "Container No".');
          setSubmitLoading(false);
          return;
        }
        transformedDocumentsBrought = transformedDocumentsBrought.filter(
          (d) => d !== 'Container No',
        );
        transformedDocumentsBrought.push(containerNumberValue);
      }

      if (transformedDocumentsBrought.includes('Container Image')) {
        if (!containerImageValue) {
          message.error('Please enter container image value for "Container Image".');
          setSubmitLoading(false);
          return;
        }
        transformedDocumentsBrought = transformedDocumentsBrought.filter(
          (d) => d !== 'Container Image',
        );
        transformedDocumentsBrought.push(containerImageValue);
      }
      
      // Handle documents - could be array or object with fileList property
      const documents = Array.isArray(documentsValue) 
        ? documentsValue 
        : documentsValue?.fileList || [];
      
      console.log('🔷 [JobsPage] handleSubmit called');
      console.log('  - Documents from form:', documentsValue);
      console.log('  - Extracted documents array:', documents);
      
      // Validate Ghana Card OR TIN requirement
      // Get customer data to check for Ghana Card or TIN
      const customerId = jobData.customerId;
      if (customerId) {
        // Fetch customer details to check for Ghana Card or TIN
        try {
          const customerResponse = await apiService.get(`/customers/${customerId}`);
          const customer = customerResponse.customer;
          const consignmentId = jobData.consignmentId;
          let consignment = null;
          
          if (consignmentId) {
            try {
              const consignmentResponse = await apiService.get(`/consignments/${consignmentId}`);
              consignment = consignmentResponse.consignment;
            } catch (err) {
              // Consignment not found, continue with customer only
            }
          }
          
          // Check if at least one of Ghana Card or TIN is provided
          const hasGhanaCard = customer?.ghanaCard || consignment?.ghanaCard;
          const hasTin = customer?.tin || consignment?.tin;
          
          if (!hasGhanaCard && !hasTin) {
            message.error('At least one of Ghana Card or TIN must be provided for the customer/consignee');
            setSubmitLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error validating customer data:', error);
          // Continue with submission if we can't validate (backend will handle it)
        }
      }

      if (documents && documents.length > 0) {

      }

      // Use status from form (defaults to NEW if not specified)
      const jobStatus = jobData.status || 'NEW';
      
      // Set isDraft to false when submitting
      const submittedJobData = { ...jobData, isDraft: false, documentsBrought: transformedDocumentsBrought };
      // Prevent sending client-only field to backend (backend does not store it separately).
      delete submittedJobData.containerImage;
      
      let response;
      if (editingJob) {
        // Update existing job

        response = await jobService.updateJob(editingJob.id, submittedJobData);
        message.success('Job updated successfully');
      } else {
        // Create new job - trackingId will be auto-generated by backend

        response = await jobService.createJob(submittedJobData);

        message.success('Job created successfully');
      }
      
      // Handle document uploads if we have documents and a job ID
      console.log('🔷 [JobsPage] Checking for documents to upload');
      console.log('  - Documents variable:', documents);
      console.log('  - Documents is array:', Array.isArray(documents));
      console.log('  - Documents length:', documents?.length);
      
      if (documents && documents.length > 0) {
        console.log('🔷 [JobsPage] Processing documents after job creation');
        console.log('  - Documents array:', documents);
        console.log('  - Each document:');
        documents.forEach((doc, i) => {
          console.log(`    [${i}]:`, {
            name: doc.name,
            url: doc.url,
            hasOriginFileObj: !!doc.originFileObj,
            status: doc.status
          });
        });
        console.log('  - Response:', response);
        
        const jobId = response.job?.id || response.id;
        console.log('  - Extracted Job ID:', jobId);
        
        if (jobId) {
          // Filter out files that are already uploaded (have URLs)
          const filesToUpload = documents.filter(file => !file.url && file.originFileObj);
          console.log('  - Files to upload after filter:', filesToUpload.length);
          console.log('  - Filter logic: !file.url && file.originFileObj');
          console.log('  - Files details:', filesToUpload);

          if (filesToUpload.length > 0) {
            console.log('  - Calling handleJobDocuments with jobId:', jobId);
            await handleJobDocuments(jobId, filesToUpload, 'create');
          } else {
            console.log('  - No new files to upload (filtered out)');
            console.log('  - Reason: Either all have URLs or missing originFileObj');
          }
        } else {
          console.error('❌ No job ID in response!', response);
        }
      } else {
        console.log('  - No documents array or empty array');
      }
      
      loadJobs(); // Reload jobs
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {

      message.error(error.message || 'Failed to save job');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setDraftLoading(true);
    try {
      // Drafts should not require a fully filled form
      const formValues = form.getFieldsValue(true);
      const { documents: documentsValue, ...jobData } = formValues;

      // Transform placeholder document selections into actual typed values.
      const containerNumberValue = (jobData.containerNumber || '').trim();
      const containerImageValue = (jobData.containerImage || '').trim();

      let transformedDocumentsBrought = Array.isArray(jobData.documentsBrought)
        ? [...jobData.documentsBrought]
        : [];

      if (transformedDocumentsBrought.includes('Container No')) {
        if (!containerNumberValue) {
          message.error('Please enter container number for "Container No".');
          setDraftLoading(false);
          return;
        }
        transformedDocumentsBrought = transformedDocumentsBrought.filter(
          (d) => d !== 'Container No',
        );
        transformedDocumentsBrought.push(containerNumberValue);
      }

      if (transformedDocumentsBrought.includes('Container Image')) {
        if (!containerImageValue) {
          message.error('Please enter container image value for "Container Image".');
          setDraftLoading(false);
          return;
        }
        transformedDocumentsBrought = transformedDocumentsBrought.filter(
          (d) => d !== 'Container Image',
        );
        transformedDocumentsBrought.push(containerImageValue);
      }

      if (!jobData.customerId) {
        message.warning('Select a client to save a draft');
        return;
      }

      // Handle documents - could be array or object with fileList property
      const documents = Array.isArray(documentsValue)
        ? documentsValue
        : documentsValue?.fileList || [];

      const draftJobData = {
        ...jobData,
        isDraft: true,
        goodsTypes: Array.isArray(jobData.goodsTypes) ? jobData.goodsTypes : [],
        documentsBrought: transformedDocumentsBrought,
        consignmentId: jobData.consignmentId || null,
      };

      // Prevent sending client-only field to backend.
      delete draftJobData.containerImage;

      let response;
      if (editingJob) {
        response = await jobService.updateJob(editingJob.id, draftJobData);
        message.success('Job saved as draft');
      } else {
        response = await jobService.createJob(draftJobData);
        message.success('Job saved as draft');
      }

      // Handle document uploads if we have documents and a job ID
      if (documents && documents.length > 0) {
        const jobId = response.job?.id || response.id;
        if (jobId) {
          const filesToUpload = documents.filter(file => !file.url && file.originFileObj);
          if (filesToUpload.length > 0) {
            await handleJobDocuments(jobId, filesToUpload, 'create');
          }
        }
      }

      loadJobs();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to save job as draft');
    } finally {
      setDraftLoading(false);
    }
  };

  const handleCustomerSelect = async (customerId) => {
    form.setFieldsValue({
      customerId,
      consignmentId: undefined
    });
  };

  const handleConsignmentSelect = (consignmentId) => {
    form.setFieldsValue({
      consignmentId
    });
  };

  const openCustomGoodsTypeModal = () => {
    setCustomOptionType('Goods Type');
    setCustomOptionField('goodsTypes');
    setCustomOptionValue('');
    setIsCustomOptionModalVisible(true);
  };

  // Helper functions for dynamic dropdowns
  const handleCustomGoodsType = (value) => {
    // For multi-select, value is an array
    if (Array.isArray(value) && value.includes('Other')) {
      const filteredValues = value.filter((val) => val !== 'Other');
      form.setFieldsValue({ goodsTypes: filteredValues });
      openCustomGoodsTypeModal();
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

  const handleCustomOptionSubmit = async () => {
    if (!customOptionValue.trim()) {
      message.error('Please enter a value');
      return;
    }

    const trimmedValue = customOptionValue.trim();
    setCustomOptionSaving(true);

    try {
      if (customOptionField === 'goodsTypes') {
        const { list, value, created } = await configurationService.addToStringList(
          GOODS_TYPES_CONFIG_KEY,
          trimmedValue,
          DEFAULT_GOODS_TYPES,
          JOB_LIST_META[GOODS_TYPES_CONFIG_KEY]
        );
        setGoodsTypes(list);
        const currentValues = form.getFieldValue('goodsTypes') || [];
        const filteredValues = currentValues.filter((val) => val !== 'Other');
        form.setFieldsValue({
          goodsTypes: filteredValues.includes(value)
            ? filteredValues
            : [...filteredValues, value]
        });
        message[created ? 'success' : 'info'](
          created
            ? 'Goods type added successfully!'
            : `"${value}" is already in the list and has been selected.`
        );
      } else if (customOptionField === 'vesselName') {
        const { list, value, created } = await configurationService.addToStringList(
          VESSEL_NAMES_CONFIG_KEY,
          trimmedValue,
          DEFAULT_VESSEL_NAMES,
          JOB_LIST_META[VESSEL_NAMES_CONFIG_KEY]
        );
        setVesselNames(list);
        form.setFieldsValue({ vesselName: value });
        message[created ? 'success' : 'info'](
          created
            ? 'Vessel name added successfully!'
            : `"${value}" is already in the list and has been selected.`
        );
      } else if (customOptionField === 'line') {
        const { list, value, created } = await configurationService.addToStringList(
          SHIPPING_LINES_CONFIG_KEY,
          trimmedValue,
          DEFAULT_SHIPPING_LINES,
          JOB_LIST_META[SHIPPING_LINES_CONFIG_KEY]
        );
        setLineOptions(list);
        form.setFieldsValue({ line: value });
        message[created ? 'success' : 'info'](
          created
            ? 'Line added successfully!'
            : `"${value}" is already in the list and has been selected.`
        );
      } else {
        message.success(`${customOptionType} added successfully!`);
      }

      setIsCustomOptionModalVisible(false);
      setCustomOptionValue('');
    } catch (error) {
      message.error(error.message || `Failed to save ${customOptionType.toLowerCase()}`);
      if (customOptionField === 'goodsTypes') {
        await loadGoodsTypes();
      } else {
        await loadPersistedDropdownOptions();
      }
    } finally {
      setCustomOptionSaving(false);
    }
  };

  const handleCustomOptionCancel = () => {
    setIsCustomOptionModalVisible(false);
    setCustomOptionValue('');
  };

  const handleReassignJob = async (values) => {
    if (!selectedJob?.id) {
      message.error('Job ID not found');
      return;
    }
    setReassignLoading(true);
    try {
      const response = await jobService.reassignJob(selectedJob.id, {
        assignedToId: values.assignedToId,
        comment: values.comment,
      });

      if (response?.job) {
        setSelectedJob((prevJob) => ({
          ...prevJob,
          assignedToId: response.job.assignedToId,
          assignedTo: response.job.assignedTo,
          updatedAt: response.job.updatedAt,
        }));
      }

      if (response?.comment) {
        setJobComments((prev) => [response.comment, ...prev]);
      } else {
        try {
          const comments = await jobService.getJobComments(selectedJob.id);
          setJobComments(comments);
        } catch (_) {
          // non-blocking
        }
      }

      message.success('Job reassigned successfully');
      setIsReassignModalVisible(false);
      reassignForm.resetFields();
      loadJobs();
    } catch (error) {
      console.error('Reassign error:', error);
      message.error(
        error?.response?.data?.error || error?.message || 'Failed to reassign job'
      );
    } finally {
      setReassignLoading(false);
    }
  };

  const handleStatusUpdate = async (values) => {
    setLoading(true);
    try {
      // Validate status transition
      if (currentJobForStatusUpdate && !isValidStatusTransition(currentJobForStatusUpdate.status, values.status, { allowRevert: canRevertStatus })) {
        message.error(canRevertStatus
          ? 'Invalid status transition.'
          : 'Invalid status transition. Jobs can only progress forward in the workflow.');
        setLoading(false);
        return;
      }

      if (currentJobForStatusUpdate && isRevertTransition(currentJobForStatusUpdate.status, values.status)) {
        if (!values.comment || !String(values.comment).trim()) {
          message.error('A comment is required when reverting job status.');
          setLoading(false);
          return;
        }
      }
      
      // Extract documents from form values
      const { statusUpdateDocuments, demurrageInvoices, paymentReceipts, ...updateData } = values;
      
      // Handle demurrage/free days and release money for RELEASED status
      const demurrageFreeDays = updateData.demurrageFreeDays;
      const releaseMoneyReceived = updateData.releaseMoneyReceived;
      const demurrageType = updateData.demurrageType;

      // Handle RELEASED status fields
      const terminalName = updateData.terminalName;
      const scheduleTime = updateData.scheduleTime;
      const driverName = updateData.driverName;
      const driverContact = updateData.driverContact;

      // Handle shipper name and invoice number for VETTED status
      const shipperName = updateData.shipperName;
      const invoiceNumber = updateData.invoiceNumber;

      // Handle BOE number for ENTRY_COMPLETED status
      const boeNumber = updateData.boeNumber;

      // Use currentJobForStatusUpdate instead of selectedJob for status updates
      const jobId = currentJobForStatusUpdate?.id || selectedJob?.id;
      if (!jobId) {
        message.error('Job ID not found');
        setLoading(false);
        return;
      }

      const response = await jobService.updateJobStatus(jobId, updateData.status, updateData.comment, undefined, updateData.assignedToId, demurrageFreeDays, releaseMoneyReceived, shipperName, invoiceNumber, terminalName, scheduleTime, driverName, driverContact, demurrageType, boeNumber);

      // Persist custom terminal names so other users don't retype them
      if (updateData.status === 'RELEASED' && terminalName?.trim()) {
        try {
          const { list } = await configurationService.addToStringList(
            TERMINAL_NAMES_CONFIG_KEY,
            terminalName.trim(),
            DEFAULT_TERMINAL_NAMES,
            JOB_LIST_META[TERMINAL_NAMES_CONFIG_KEY]
          );
          setTerminalOptions(buildTerminalSelectOptions(list));
        } catch (_) {
          // non-blocking
        }
      }
      
      let documentsUploaded = false;
      
      // Handle document uploads if any
      if (statusUpdateDocuments && statusUpdateDocuments.length > 0) {
        console.log('🔷 [JobsPage] Uploading status update documents');
        const documentsArray = Array.isArray(statusUpdateDocuments) 
          ? statusUpdateDocuments 
          : statusUpdateDocuments?.fileList || [];
        
        const filesToUpload = documentsArray.filter(file => !file.url && file.originFileObj);
        
        if (filesToUpload.length > 0) {
          for (const file of filesToUpload) {
            try {
              await fileService.uploadFile(file.originFileObj, {
                folder: 'jobs',
                category: 'status_update_document',
                entityId: jobId,
                entityType: 'job'
              });
              console.log('  ✅ Uploaded:', file.name);
              documentsUploaded = true;
            } catch (uploadError) {
              console.error('  ❌ Failed to upload:', file.name, uploadError);
              message.warning(`Failed to upload ${file.name}`);
            }
          }
          
          // Reload documents for the job drawer
          try {
            const documentsResponse = await fileService.getFilesByEntity('job', jobId);
            if (documentsResponse && documentsResponse.files) {
              setSelectedJobDocuments(documentsResponse.files);
            }
          } catch (error) {
            console.error('Failed to reload documents:', error);
          }
        }
      }

      // Handle demurrage invoice uploads if any
      if (demurrageInvoices && demurrageInvoices.length > 0) {
        console.log('🔷 [JobsPage] Uploading demurrage invoices');
        const documentsArray = Array.isArray(demurrageInvoices) 
          ? demurrageInvoices 
          : demurrageInvoices?.fileList || [];
        
        const filesToUpload = documentsArray.filter(file => !file.url && file.originFileObj);
        
        if (filesToUpload.length > 0) {
          for (const file of filesToUpload) {
            try {
              await fileService.uploadFile(file.originFileObj, {
                folder: 'jobs',
                category: 'demurrage_invoice',
                entityId: jobId,
                entityType: 'job'
              });
              console.log('  ✅ Uploaded demurrage invoice:', file.name);
              documentsUploaded = true;
            } catch (uploadError) {
              console.error('  ❌ Failed to upload demurrage invoice:', file.name, uploadError);
              message.warning(`Failed to upload demurrage invoice ${file.name}`);
            }
          }
        }
      }

      // Handle payment receipt uploads (COMPULSORY for RELEASED status)
      if (paymentReceipts && paymentReceipts.length > 0) {
        console.log('🔷 [JobsPage] Uploading payment receipts');
        const documentsArray = Array.isArray(paymentReceipts) 
          ? paymentReceipts 
          : paymentReceipts?.fileList || [];
        
        const filesToUpload = documentsArray.filter(file => !file.url && file.originFileObj);
        
        if (filesToUpload.length > 0) {
          for (const file of filesToUpload) {
            try {
              await fileService.uploadFile(file.originFileObj, {
                folder: 'jobs',
                category: 'payment_receipt',
                entityId: jobId,
                entityType: 'job'
              });
              console.log('  ✅ Uploaded payment receipt:', file.name);
              documentsUploaded = true;
            } catch (uploadError) {
              console.error('  ❌ Failed to upload payment receipt:', file.name, uploadError);
              message.warning(`Failed to upload payment receipt ${file.name}`);
            }
          }
        }
      }

      // Reload documents if any were uploaded
      if (documentsUploaded) {
        try {
          const documentsResponse = await fileService.getFilesByEntity('job', jobId);
          if (documentsResponse && documentsResponse.files) {
            setSelectedJobDocuments(documentsResponse.files);
          }
        } catch (error) {
          console.error('Failed to reload documents:', error);
        }
      }

      // Update the selectedJob state with the updated job data
      if (response && response.job) {
        setSelectedJob(prevJob => ({
          ...prevJob,
          status: response.job.status,
          assignedToId: response.job.assignedToId,
          assignedTo: response.job.assignedTo,
          eta: response.job.eta,
          demurrageFreeDays: response.job.demurrageFreeDays,
          releaseMoneyReceived: response.job.releaseMoneyReceived,
          demurrageType: response.job.demurrageType,
          shipperName: response.job.shipperName,
          invoiceNumber: response.job.invoiceNumber,
          terminalName: response.job.terminalName,
          scheduleTime: response.job.scheduleTime,
          driverName: response.job.driverName,
          driverContact: response.job.driverContact,
          boeNumber: response.job.boeNumber,
          updatedAt: response.job.updatedAt,
          statusHistory: response.job.statusHistory || prevJob.statusHistory
        }));
        
        // Also update the currentJobForStatusUpdate to reflect the new status
        setCurrentJobForStatusUpdate(prevJob => ({
          ...prevJob,
          status: response.job.status,
          assignedToId: response.job.assignedToId,
          assignedTo: response.job.assignedTo
        }));
      } else {

        // Fallback: try to update from the jobs list if available
        const updatedJobFromList = jobs.find(job => job.id === selectedJob.id);
        if (updatedJobFromList) {

          setSelectedJob(updatedJobFromList);
        }
      }
      
      // Show appropriate success message
      if (documentsUploaded) {
        message.success('Status updated and documents uploaded successfully');
      } else {
        message.success('Job status updated successfully');
      }
      
      setIsStatusUpdateModalVisible(false);
      setCurrentJobForStatusUpdate(null);
      statusUpdateForm.resetFields();
      loadJobs(); // Reload jobs list
    } catch (error) {
      console.error('Status update error:', error);
      message.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    if (document?.url) {
      setPreviewFile(document);
      setPreviewVisible(true);
    }
  };

  const handleFileChange = (fileList) => {
    console.log('🔷 [JobsPage] handleFileChange called');
    console.log('  - New fileList length:', fileList?.length || 0);
    console.log('  - New fileList:', fileList?.map(f => ({ name: f.name, uid: f.uid, size: f.size, hasOriginFileObj: !!f.originFileObj })));
    
    // Prevent duplicate updates by checking if the value actually changed
    const currentDocuments = form.getFieldValue('documents');
    const currentFileList = Array.isArray(currentDocuments) 
      ? currentDocuments 
      : currentDocuments?.fileList || [];
    
    console.log('  - Current documents from form:', currentFileList?.length || 0);
    console.log('  - Current fileList:', currentFileList?.map(f => ({ name: f.name, uid: f.uid, size: f.size })));
    
    // Only update if the file list actually changed
    const currentKeys = JSON.stringify(currentFileList.map(f => ({ uid: f.uid, name: f.name, size: f.size })));
    const newKeys = JSON.stringify(fileList.map(f => ({ uid: f.uid, name: f.name, size: f.size })));
    
    if (currentKeys !== newKeys) {
      console.log('  - File list changed, updating form...');
      form.setFieldsValue({ documents: fileList });
      console.log('  - Form updated with new fileList');
    } else {
      console.log('  - File list unchanged, skipping form update');
    }
  };

  const handleFileUpload = async (file, options = {}) => {
    console.log('🔷 [JobsPage] handleFileUpload called');
    console.log('  - File name:', file?.name);
    console.log('  - File size:', file?.size, 'bytes');
    console.log('  - File type:', file?.type);
    console.log('  - File uid:', file?.uid);
    console.log('  - Editing Job:', editingJob);
    console.log('  - Editing Job ID:', editingJob?.id);
    console.log('  - Options:', options);
    
    try {
      // Only upload immediately if editing existing job
      // For NEW jobs, files will be uploaded AFTER job creation
      if (!editingJob?.id) {
        console.log('  - NEW job mode: Skipping upload, will upload after job is created');
        console.log('  - Returning temporary response to prevent Upload component retry');
        // Return a fake success response so the Upload component thinks it uploaded
        const tempResponse = {
          success: true,
          file: {
            id: 'temp-' + Date.now(),
            originalName: file.name,
            url: null, // No URL yet since not uploaded
            pending: true
          }
        };
        console.log('  - Temporary response:', tempResponse);
        return tempResponse;
      }
      
      // Upload file with job-specific options if we have a job ID
      const uploadOptions = {
        folder: 'jobs',
        category: 'job_document',
        entityId: editingJob.id,
        entityType: 'job',
        ...options
      };
      
      console.log('  - EDIT job mode: Uploading with options:', uploadOptions);
      console.log('  - Calling fileService.uploadFile...');
      const uploadStartTime = Date.now();
      const response = await fileService.uploadFile(file, uploadOptions);
      const uploadTime = Date.now() - uploadStartTime;
      console.log('  - Upload completed in', uploadTime, 'ms');
      console.log('  - Upload response:', response);
      console.log('  - Response file URL:', response?.file?.url || response?.url);
      return response;
    } catch (error) {
      console.error('❌ [JobsPage] handleFileUpload error:', error);
      console.error('  - Error name:', error.name);
      console.error('  - Error message:', error.message);
      console.error('  - Error status:', error.status);
      console.error('  - Error response:', error.response?.data);
      console.error('  - Error stack:', error.stack);
      throw error;
    }
  };

  const handleJobDocuments = async (jobId, documents, action) => {
    console.log('🔷 [JobsPage] handleJobDocuments called');
    console.log('  - Job ID:', jobId);
    console.log('  - Documents count:', documents?.length || 0);
    console.log('  - Documents:', documents?.map(d => ({ 
      name: d.name, 
      uid: d.uid, 
      hasUrl: !!d.url, 
      hasOriginFileObj: !!d.originFileObj,
      status: d.status 
    })));
    console.log('  - Action:', action);
    
    try {
      // Filter out files that are already uploaded (have URLs)
      const filesToUpload = documents.filter(file => !file.url && file.originFileObj);
      console.log('  - Files to upload after filtering:', filesToUpload.length);
      console.log('  - Filtered files:', filesToUpload.map(f => ({ 
        name: f.name, 
        hasUrl: !!f.url, 
        hasOriginFileObj: !!f.originFileObj 
      })));
      
      if (filesToUpload.length === 0) {
        console.log('  - No files to upload, returning');
        console.log('  - Reason: All files either have URLs or missing originFileObj');
        return;
      }

      // Upload each file and associate with job
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        try {
          console.log(`  - [${i + 1}/${filesToUpload.length}] Uploading file:`, file.name);
          console.log('    - File size:', file.originFileObj?.size, 'bytes');
          console.log('    - File type:', file.originFileObj?.type);
          console.log('    - Upload options: { folder: jobs, category: job_document, entityId:', jobId, ', entityType: job }');
          
          const uploadStartTime = Date.now();
          const uploadResponse = await fileService.uploadFile(file.originFileObj, {
            folder: 'jobs',
            category: 'job_document',
            entityId: jobId,
            entityType: 'job'
          });
          const uploadTime = Date.now() - uploadStartTime;
          
          console.log('    ✅ Upload successful in', uploadTime, 'ms');
          console.log('    - Response:', uploadResponse);
          console.log('    - File URL:', uploadResponse?.file?.url || uploadResponse?.url);

        } catch (uploadError) {
          console.error(`    ❌ [${i + 1}/${filesToUpload.length}] Upload failed for ${file.name}:`, uploadError);
          console.error('      - Error name:', uploadError.name);
          console.error('      - Error message:', uploadError.message);
          console.error('      - Error status:', uploadError.status);
          console.error('      - Error response:', uploadError.response?.data);
          message.error(`Failed to upload ${file.name}`);
        }
      }
      console.log('✅ [JobsPage] All documents processed');

    } catch (error) {
      console.error('❌ [JobsPage] handleJobDocuments error:', error);
      console.error('  - Error name:', error.name);
      console.error('  - Error message:', error.message);
      console.error('  - Error stack:', error.stack);
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
        {hasPermission(PERMISSIONS.JOB_CREATE) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            onClick={handleNewJob}
          >
            New Job
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={12} lg={6}>
            <Card>
              <Statistic
              title="Total Jobs"
              value={jobs.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
              />
            </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Invoiced"
              value={jobs.filter(j => j.status === 'INVOICED').length}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
          </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Vetted"
              value={jobs.filter(j => j.status === 'VETTED').length}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
          </Col>
        <Col xs={12} sm={12} lg={6}>
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
                  <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Input.Search
                      placeholder="Search by Job ID, Container No, or BL"
                      allowClear
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onSearch={(value) => setSearchQuery(value)}
                      style={{ maxWidth: '400px', flex: '1 1 300px' }}
                      enterButton
                    />
                    <Select
                      placeholder="Filter by Status"
                      allowClear
                      value={statusFilter}
                      onChange={(value) => setStatusFilter(value)}
                      style={{ width: '200px' }}
                    >
                      {Object.entries(STATUS_LABELS).map(([status, label]) => (
                        <Option key={status} value={status}>
                          {label}
                        </Option>
                      ))}
                    </Select>
                    <Select
                      placeholder="Filter by ETA"
                      value={etaFilter || ETA_FILTER.ALL}
                      onChange={(value) => setEtaFilter(value || ETA_FILTER.ALL)}
                      style={{ width: '200px' }}
                    >
                      {ETA_FILTER_OPTIONS.map((opt) => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                    <Button
                      onClick={handleSaveEtaFilterDefault}
                      disabled={(etaFilter || ETA_FILTER.ALL) === defaultEtaFilter}
                    >
                      Set as default
                    </Button>
                    <Button 
                      icon={<ClockCircleOutlined />}
                      onClick={loadJobs}
                      loading={jobsLoading}
                    >
                      Refresh
                    </Button>
                  </div>
                  <ResponsiveTable
                    columns={columns}
                    dataSource={jobs.filter(job => {
                      // Search filter
                      if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        const matchesSearch =
                          job.trackingId?.toLowerCase().includes(query) ||
                          job.id?.toLowerCase().includes(query) ||
                          job.containerNumber?.toLowerCase().includes(query) ||
                          job.blNumber?.toLowerCase().includes(query) ||
                          job.customer?.name?.toLowerCase().includes(query);
                        if (!matchesSearch) return false;
                      }
                      
                      // Status filter
                      if (statusFilter) {
                        if (statusFilter === 'IN_PROGRESS') {
                          if (['NEW', 'CLEARED', 'DELIVERED'].includes(job.status)) {
                            return false;
                          }
                        } else if (job.status !== statusFilter) {
                          return false;
                        }
                      }

                      // ETA urgency filter
                      if (!jobMatchesEtaFilter(job, etaFilter)) {
                        return false;
                      }
                      
                      return true;
                    })}
                    loading={jobsLoading}
                    rowKey="id"
                    scroll={{ x: 1500 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} jobs`
                    }}
                    mobileConfig={{
                      primaryFields: ['trackingId', 'clientName', 'status', 'eta'],
                      secondaryFields: ['goodsTypes', 'assignedTo', 'createdAt', 'documentsBrought', 'containerNumber']
                    }}
                    onRowClick={(record) => handleViewJob(record)}
                    locale={{
                      emptyText: (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <Text type="secondary" style={{ fontSize: '16px' }}>
                                {hasPermission(PERMISSIONS.JOB_CREATE) 
                                  ? 'No jobs found - Get started by creating your first job'
                                  : 'No jobs available to view'
                                }
                              </Text>
                            </div>
                          }
                        >
                          {hasPermission(PERMISSIONS.JOB_CREATE) && (
                            <Button 
                              type="primary" 
                              icon={<PlusOutlined />}
                              onClick={() => setIsModalVisible(true)}
                              size="large"
                            >
                              Create First Job
                            </Button>
                          )}
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
                  <ResponsiveTable
                    columns={columns}
                    dataSource={draftJobs}
                    loading={jobsLoading}
                    rowKey="id"
                    scroll={{ x: 1500 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} drafts`
                    }}
                    mobileConfig={{
                      primaryFields: ['trackingId', 'clientName', 'status', 'eta'],
                      secondaryFields: ['goodsTypes', 'assignedTo', 'createdAt', 'documentsBrought', 'containerNumber']
                    }}
                    onRowClick={(record) => handleViewJob(record)}
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
        maskClosable={false}
        styles={{ 
          body: {
            maxHeight: 'calc(100vh - 200px)', 
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '24px'
          }
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
                label="Select Consignee"
                rules={[{ required: false }]}
                help="Select 'N/A' if consignee is not available yet. You can add it later by editing the job."
              >
                <ConsigneeSelector
                  customerId={selectedCustomerId}
                  onChange={handleConsignmentSelect}
                  placeholder="Select a consignee or N/A"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
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
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ padding: '0 8px 8px' }}>
                        <Button
                          type="link"
                          icon={<PlusOutlined />}
                          onClick={openCustomGoodsTypeModal}
                          style={{ padding: 0, width: '100%', textAlign: 'left' }}
                        >
                          Add type of good…
                        </Button>
                      </div>
                    </>
                  )}
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
                  {(() => {

                    if (staffMembers.length > 0) {

                      return staffMembers.map(member => (
                        <Option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </Option>
                      ));
                    } else {

                      return (
                        <Option disabled value="no-users">
                          No team members available
                        </Option>
                      );
                    }
                  })()}
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
                help="Expected arrival time (past dates allowed for jobs that arrived before creation)"
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
                  <Option value="Parking list">Parking list</Option>
                  <Option value="Parking list & Copy">Parking list & Copy</Option>
                  <Option value="Container No">Container No</Option>
                  <Option value="Container Image">Container Image</Option>
                  <Option value="Copy BL">Copy BL</Option>
                  <Option value="Original BL">Original BL</Option>
                  <Option value="Draft BL">Draft BL</Option>
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
                name="containerImage"
                label="Container Image"
                rules={[{ required: false, message: 'Please enter container image value' }]}
              >
                <Input placeholder="Enter container image value" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
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
          statusUpdateForm.resetFields();
        }}
        footer={null}
        maskClosable={false}
        width={700}
        >
          
          <Form
            form={statusUpdateForm}
            layout="vertical"
          onFinish={handleStatusUpdate}
          >
            <Form.Item
              name="status"
              label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              {currentJobForStatusUpdate && (
                <>
                  {/* Show current status first (disabled) */}
                  <Option 
                    key={currentJobForStatusUpdate.status} 
                    value={currentJobForStatusUpdate.status}
                    disabled
                    style={{ color: '#999', fontStyle: 'italic' }}
                  >
                    {STATUS_LABELS[currentJobForStatusUpdate.status]} (Current)
                  </Option>
                  {getAvailableStatuses(currentJobForStatusUpdate.status, { allowRevert: canRevertStatus }).map(status => {
                    const reverting = isRevertTransition(currentJobForStatusUpdate.status, status);
                    return (
                      <Option key={status} value={status}>
                        {STATUS_LABELS[status]}{reverting ? ' (Revert)' : ''}
                      </Option>
                    );
                  })}
                </>
              )}
            </Select>
            </Form.Item>

            <Form.Item
              name="assignedToId"
              label="Assigned To"
              rules={[{ required: true, message: 'Please select who to assign this job to' }]}
            >
              <Select placeholder="Select team member">
                {(() => {

                  if (staffMembers.length > 0) {

                    return staffMembers.map(member => (
                      <Option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </Option>
                    ));
                  } else {

                    return (
                      <Option disabled value="no-users">
                        No team members available
                      </Option>
                    );
                  }
                })()}
              </Select>
            </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.status !== currentValues.status
            }
          >
            {({ getFieldValue }) => {
              const status = getFieldValue('status');
              const reverting = currentJobForStatusUpdate
                && isRevertTransition(currentJobForStatusUpdate.status, status);
              if (reverting) {
                return null;
              }
              if (status === 'ENTRY_COMPLETED') {
                return (
                  <Form.Item
                    name="boeNumber"
                    label="BoE Number"
                    validateTrigger="onSubmit"
                    rules={[
                      { required: true, message: 'BoE number is required for Entry Completed status' },
                      { 
                        pattern: /^\d{11}$/, 
                        message: 'BoE number must be exactly 11 numeric digits' 
                      }
                    ]}
                  >
                    <Input 
                      placeholder="Enter 11-digit BoE number"
                      style={{ width: '100%' }}
                      maxLength={11}
                      onKeyPress={(e) => {
                        // Only allow numeric input
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                );
              }
              if (status === 'RELEASED') {
                return (
                  <>
                    <Form.Item
                      name="terminalName"
                      label="Terminal Name"
                      rules={[{ required: true, message: 'Terminal name is required for Release status' }]}
                      help={showCustomTerminalInput ? "Enter custom terminal name" : "Select terminal or choose Custom to enter a new one"}
                    >
                      <Select
                        placeholder="Select terminal name"
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={(value) => {
                          if (value === 'Custom') {
                            setShowCustomTerminalInput(true);
                            setCustomTerminalValue('');
                            form.setFieldsValue({ terminalName: undefined });
                          } else {
                            setShowCustomTerminalInput(false);
                            setCustomTerminalValue('');
                          }
                        }}
                        options={terminalOptions}
                      />
                    </Form.Item>
                    {showCustomTerminalInput && (
                      <Form.Item
                        name="customTerminalName"
                        label="Custom Terminal Name"
                        rules={[{ required: showCustomTerminalInput, message: 'Please enter custom terminal name' }]}
                      >
                        <Input
                          placeholder="Enter custom terminal name"
                          value={customTerminalValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCustomTerminalValue(value);
                            form.setFieldsValue({ terminalName: value });
                          }}
                          onBlur={async () => {
                            const value = customTerminalValue.trim();
                            if (!value) return;
                            try {
                              const { list, value: saved } =
                                await configurationService.addToStringList(
                                  TERMINAL_NAMES_CONFIG_KEY,
                                  value,
                                  DEFAULT_TERMINAL_NAMES,
                                  JOB_LIST_META[TERMINAL_NAMES_CONFIG_KEY]
                                );
                              setTerminalOptions(buildTerminalSelectOptions(list));
                              form.setFieldsValue({ terminalName: saved });
                              setCustomTerminalValue(saved);
                              setShowCustomTerminalInput(false);
                            } catch (err) {
                              console.error('Failed to persist terminal name:', err);
                            }
                          }}
                        />
                      </Form.Item>
                    )}
                    <Form.Item
                      name="scheduleTime"
                      label="Schedule Time"
                      rules={[{ required: true, message: 'Schedule time is required for Release status' }]}
                      help="Select the scheduled release time"
                    >
                      <DatePicker
                        showTime
                        format="YYYY-MM-DD HH:mm"
                        placeholder="Select schedule time"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="driverName"
                      label="Driver Name"
                      rules={[{ required: true, message: 'Driver name is required for Release status' }]}
                      help="Enter the driver's full name"
                    >
                      <Input 
                        placeholder="Enter driver name"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="driverContact"
                      label="Driver Contact"
                      rules={[
                        { required: true, message: 'Driver contact is required for Release status' },
                        { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number' }
                      ]}
                      help="Enter the driver's contact number"
                    >
                      <Input 
                        placeholder="Enter driver contact (e.g., +233 24 123 4567)"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="demurrageFreeDays"
                      label="Demurrage/Free Days"
                      rules={[{ required: true, message: 'Demurrage/Free days is required for Release status' }]}
                      help="Enter the number of demurrage/free days"
                    >
                      <Input 
                        type="number"
                        placeholder="Enter number of days"
                        style={{ width: '100%' }}
                        min={0}
                      />
                    </Form.Item>
                    <Form.Item
                      name="releaseMoneyReceived"
                      label="Release Money Received"
                      rules={[{ required: true, message: 'Please specify if release money was received' }]}
                      help="Confirm if the release money has been received"
                    >
                      <Select placeholder="Select option">
                        <Option value={true}>Yes - Money Received</Option>
                        <Option value={false}>No - Money Not Received</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="demurrageType"
                      label="Demurrage Status"
                      rules={[{ required: true, message: 'Please select demurrage status' }]}
                      help="Indicate if there's demurrage or if free days were passed"
                    >
                      <Select placeholder="Select demurrage status">
                        <Option value="NO_DEMURRAGE">No Demurrage (Within Free Days)</Option>
                        <Option value="DEMURRAGE">Demurrage</Option>
                        <Option value="PASSED_FREE_DAYS">Passed Free Days</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) => 
                        prevValues.demurrageType !== currentValues.demurrageType
                      }
                    >
                      {({ getFieldValue }) => {
                        const demurrageType = getFieldValue('demurrageType');
                        if (demurrageType === 'DEMURRAGE' || demurrageType === 'PASSED_FREE_DAYS') {
                          return (
                            <Form.Item
                              name="demurrageInvoices"
                              label="Demurrage Invoice(s)"
                              rules={[{ required: true, message: 'Demurrage invoice is required' }]}
                              help="Upload demurrage invoice documents (multiple files allowed)"
                            >
                              <FileUpload
                                multiple={true}
                                maxCount={10}
                                accept=".pdf,.jpg,.jpeg,.png"
                                listType="text"
                                uploadText="Upload Demurrage Invoice(s)"
                              />
                            </Form.Item>
                          );
                        }
                        return null;
                      }}
                    </Form.Item>
                    <Form.Item
                      name="paymentReceipts"
                      label="Payment Receipt(s)"
                      rules={[{ required: true, message: 'Payment receipt is required for Release status' }]}
                      help="Upload payment receipt documents (multiple files allowed) - COMPULSORY"
                    >
                      <FileUpload
                        multiple={true}
                        maxCount={10}
                        accept=".pdf,.jpg,.jpeg,.png"
                        listType="text"
                        uploadText="Upload Payment Receipt(s)"
                      />
                    </Form.Item>
                  </>
                );
              } else if (status === 'VETTED') {
                return (
                  <>
                    <Form.Item
                      name="shipperName"
                      label="Shipper Name"
                      rules={[{ required: true, message: 'Shipper name is required for Vetted status' }]}
                      help="Enter the name of the shipper"
                    >
                      <Input 
                        placeholder="Enter shipper name"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="invoiceNumber"
                      label="Invoice Number"
                      rules={[{ required: true, message: 'Invoice number is required for Vetted status' }]}
                      help="Enter the invoice number (not auto-generated)"
                    >
                      <Input 
                        placeholder="Enter invoice number"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.status !== currentValues.status
            }
          >
            {({ getFieldValue }) => {
              const status = getFieldValue('status');
              const reverting = currentJobForStatusUpdate
                && isRevertTransition(currentJobForStatusUpdate.status, status);
              return (
          <Form.Item
            name="comment"
            label={reverting ? 'Reason for revert' : 'Comment'}
            rules={[{ required: true, message: reverting ? 'Please explain why this status is being reverted' : 'Please add a comment for this status update' }]}
          >
            <TextArea
              rows={4}
              placeholder={reverting ? 'Explain why this job is being moved back...' : 'Describe why the status is being updated...'}
            />
          </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item
            name="statusUpdateDocuments"
            label="Attach Documents (Optional)"
            help="Upload supporting documents for this status update"
          >
            <FileUpload
              multiple={true}
              maxCount={5}
              accept=".pdf,.jpg,.jpeg,.png"
              listType="text"
              uploadText="Upload Files"
            />
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

      {/* Reassign Job Modal */}
      <Modal
        title="Reassign Job"
        open={isReassignModalVisible}
        onCancel={() => {
          setIsReassignModalVisible(false);
          reassignForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={reassignForm}
          layout="vertical"
          onFinish={handleReassignJob}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Status will not change. A comment is required to record why the job is being reassigned."
          />
          {selectedJob?.assignedTo?.name && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              Currently assigned to: {selectedJob.assignedTo.name}
            </Text>
          )}
          <Form.Item
            name="assignedToId"
            label="Assign To"
            rules={[{ required: true, message: 'Please select a team member' }]}
          >
            <Select
              showSearch
              placeholder="Select team member"
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.children ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {staffMembers
                .filter((member) => member.id !== selectedJob?.assignedToId)
                .map((member) => (
                  <Select.Option key={member.id} value={member.id}>
                    {member.name}
                    {member.email ? ` (${member.email})` : ''}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="comment"
            label="Comment"
            rules={[{ required: true, message: 'Please add a comment for this reassignment' }]}
          >
            <TextArea rows={4} placeholder="Explain why this job is being reassigned..." />
          </Form.Item>
          <Form.Item style={{ marginTop: 24, textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button
                onClick={() => {
                  setIsReassignModalVisible(false);
                  reassignForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={reassignLoading}>
                Reassign
              </Button>
            </Space>
          </Form.Item>
        </Form>
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
            {hasPermission(PERMISSIONS.JOB_UPDATE_STATUS) && (
            <Button 
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentJobForStatusUpdate(selectedJob);
                // Get the first available next status as default, or leave empty
                const availableStatuses = getAvailableStatuses(selectedJob.status, { allowRevert: canRevertStatus });
                statusUpdateForm.setFieldsValue({ 
                  status: availableStatuses.length > 0 ? availableStatuses[0] : undefined,
                  assignedToId: selectedJob.assignedToId,
                  demurrageFreeDays: selectedJob.demurrageFreeDays,
                  releaseMoneyReceived: selectedJob.releaseMoneyReceived
                });
                setIsStatusUpdateModalVisible(true);
              }}
            >
              Update Status
            </Button>
            )}
           {(() => {
             const hasEditPermission = hasPermission(PERMISSIONS.JOB_EDIT);
             const hasDeletePermission = hasPermission(PERMISSIONS.JOB_DELETE);
             const hasAssignPermission = hasPermission(PERMISSIONS.JOB_ASSIGN);
             const showMenu = hasEditPermission || hasDeletePermission || hasAssignPermission;

             return showMenu && (
            <Dropdown
              menu={{
                items: [
                  ...(hasAssignPermission ? [{
                    key: 'reassign',
                    label: 'Reassign',
                    icon: <SwapOutlined />,
                    onClick: () => {
                      reassignForm.setFieldsValue({
                        assignedToId: undefined,
                        comment: undefined,
                      });
                      setIsReassignModalVisible(true);
                    },
                  }] : []),
                  ...(hasEditPermission ? [{
                    key: 'edit',
                     label: 'Edit Job',
                    icon: <EditOutlined />,
                    onClick: () => {

                      setIsDetailsDrawerVisible(false);
                      handleEditJob(selectedJob);
                    },
                  }] : []),
                  ...(hasDeletePermission ? [{
                     key: 'delete',
                     label: 'Delete Job',
                     icon: <DeleteOutlined />,
                     danger: true,
                     onClick: () => {

                       setIsDetailsDrawerVisible(false);
                       handleDeleteJob(selectedJob);
                     },
                  }] : []),
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
          );
          })()}
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
              <Card title="Status Timeline" size="small" style={{ marginBottom: '16px' }}>
                {selectedJob.statusHistory && selectedJob.statusHistory.length > 0 ? (
                       <Timeline>
                    {selectedJob.statusHistory.map((entry, index) => (
                           <Timeline.Item 
                             key={index} 
                        color={getJobStatusColor(entry.status)}
                        dot={<UserOutlined style={{ color: getJobStatusColor(entry.status) }} />}
                           >
                             <div>
                          <Text strong>{entry.status}</Text>
                               <br />
                          <Text type="secondary">{entry.comment}</Text>
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
                    <ClockCircleOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
                    <br />
                    <Text type="secondary">No status updates yet</Text>
                  </div>
                )}
                     </Card>

              {/* Comments Section */}
              <Card title="Comments" size="small" style={{ marginBottom: '16px' }}>
                <Spin spinning={commentsLoading}>
                  {jobComments.length > 0 ? (
                    <Timeline>
                      {jobComments.map((comment) => (
                        <Timeline.Item
                          key={comment.id}
                          dot={<InfoCircleOutlined style={{ color: '#1890ff' }} />}
                        >
                          <div>
                            <Text>{comment.comment}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {dayjs(comment.createdAt).format('DD/MM/YYYY HH:mm')} - {comment.createdBy?.name || 'Unknown'}
                            </Text>
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Text type="secondary">No comments yet</Text>
                    </div>
                  )}
                </Spin>
              </Card>

              {/* Add Comment Form */}
              <Card title="Add Comment" size="small">
                <Form
                  form={commentForm}
                  layout="vertical"
                  onFinish={handleAddComment}
                >
                  <Form.Item
                    name="comment"
                    rules={[
                      { required: true, message: 'Please enter a comment' },
                      { min: 3, message: 'Comment must be at least 3 characters' }
                    ]}
                  >
                    <TextArea
                      rows={3}
                      placeholder="Add a comment to this job..."
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                      Add Comment
                    </Button>
                  </Form.Item>
                </Form>
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
                               color={getJobStatusColor(entry.status)}
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
                  <Tag color={getJobStatusColor(selectedJob.status)} size="large">
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
                      <Tag color={getEtaAntColor(selectedJob.eta)}>
                        {formatEtaDate(selectedJob.eta)}
                      </Tag>
                    ) : (
                      <Text type="secondary">Not set</Text>
                    )}
                  </div>
                </div>
                {(selectedJob.status === 'RELEASED' || selectedJob.status === 'CLEARED' || selectedJob.status === 'DELIVERED') && (
                  <>
                    <div style={{ marginBottom: '16px', display: 'flex' }}>
                      <div style={{ width: '140px', fontWeight: 'bold' }}>Terminal Name:</div>
                      <div>
                        {selectedJob.terminalName ? (
                          <Tag color="blue">
                            {selectedJob.terminalName}
                          </Tag>
                        ) : (
                          <Text type="secondary">Not specified</Text>
                        )}
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex' }}>
                      <div style={{ width: '140px', fontWeight: 'bold' }}>Schedule Time:</div>
                      <div>
                        {selectedJob.scheduleTime ? (
                          <Tag color="purple">
                            {new Date(selectedJob.scheduleTime).toLocaleString()}
                          </Tag>
                        ) : (
                          <Text type="secondary">Not specified</Text>
                        )}
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex' }}>
                      <div style={{ width: '140px', fontWeight: 'bold' }}>Driver Name:</div>
                      <div>
                        {selectedJob.driverName ? (
                          <Tag color="green">
                            {selectedJob.driverName}
                          </Tag>
                        ) : (
                          <Text type="secondary">Not specified</Text>
                        )}
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex' }}>
                      <div style={{ width: '140px', fontWeight: 'bold' }}>Driver Contact:</div>
                      <div>
                        {selectedJob.driverContact ? (
                          <Tag color="cyan">
                            {selectedJob.driverContact}
                          </Tag>
                        ) : (
                          <Text type="secondary">Not specified</Text>
                        )}
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex' }}>
                      <div style={{ width: '140px', fontWeight: 'bold' }}>Demurrage/Free Days:</div>
                      <div>
                        {selectedJob.demurrageFreeDays !== undefined && selectedJob.demurrageFreeDays !== null ? (
                          <Tag color="orange">
                            {selectedJob.demurrageFreeDays} days
                          </Tag>
                        ) : (
                          <Text type="secondary">Not specified</Text>
                        )}
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex' }}>
                      <div style={{ width: '140px', fontWeight: 'bold' }}>Release Money:</div>
                      <div>
                        {selectedJob.releaseMoneyReceived !== undefined && selectedJob.releaseMoneyReceived !== null ? (
                          <Tag color={selectedJob.releaseMoneyReceived ? 'green' : 'red'}>
                            {selectedJob.releaseMoneyReceived ? 'Received' : 'Not Received'}
                          </Tag>
                        ) : (
                          <Text type="secondary">Not specified</Text>
                        )}
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex' }}>
                      <div style={{ width: '140px', fontWeight: 'bold' }}>Demurrage Status:</div>
                      <div>
                        {selectedJob.demurrageType ? (
                          <Tag color={selectedJob.demurrageType === 'NO_DEMURRAGE' ? 'green' : 'orange'}>
                            {selectedJob.demurrageType === 'NO_DEMURRAGE' && 'No Demurrage (Within Free Days)'}
                            {selectedJob.demurrageType === 'DEMURRAGE' && 'Demurrage'}
                            {selectedJob.demurrageType === 'PASSED_FREE_DAYS' && 'Passed Free Days'}
                          </Tag>
                        ) : (
                          <Text type="secondary">Not specified</Text>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {(selectedJob.status === 'VETTED' || selectedJob.status === 'ENTRY_COMPLETED' || selectedJob.status === 'DUTY_PAID' || selectedJob.status === 'READY_FOR_RELEASE' || selectedJob.status === 'RELEASED' || selectedJob.status === 'CLEARED' || selectedJob.status === 'DELIVERED') && (
                  <>
                    <div style={{ marginBottom: '16px', display: 'flex' }}>
                      <div style={{ width: '140px', fontWeight: 'bold' }}>Shipper Name:</div>
                      <div>
                        {selectedJob.shipperName ? (
                          <Tag color="purple">
                            {selectedJob.shipperName}
                          </Tag>
                        ) : (
                          <Text type="secondary">Not specified</Text>
                        )}
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px', display: 'flex' }}>
                      <div style={{ width: '140px', fontWeight: 'bold' }}>Invoice Number:</div>
                      <div>
                        {selectedJob.invoiceNumber ? (
                          <Tag color="blue">
                            {selectedJob.invoiceNumber}
                          </Tag>
                        ) : (
                          <Text type="secondary">Not specified</Text>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {(selectedJob.status === 'ENTRY_COMPLETED' || selectedJob.status === 'DUTY_PAID' || selectedJob.status === 'READY_FOR_RELEASE' || selectedJob.status === 'RELEASED' || selectedJob.status === 'CLEARED' || selectedJob.status === 'DELIVERED') && (
                  <div style={{ marginBottom: '16px', display: 'flex' }}>
                    <div style={{ width: '140px', fontWeight: 'bold' }}>BoE Number:</div>
                    <div>
                      {selectedJob.boeNumber ? (
                        <Tag color="orange">
                          {selectedJob.boeNumber}
                        </Tag>
                      ) : (
                        <Text type="secondary">Not specified</Text>
                      )}
                    </div>
                  </div>
                )}
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
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Ghana Card:</div>
                  <div>{selectedJob.customer?.ghanaCard || selectedJob.consignment?.ghanaCard || 'Not provided'}</div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>TIN:</div>
                  <div>{selectedJob.customer?.tin || selectedJob.consignment?.tin || 'Not provided'}</div>
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
                  <div>
                    {!selectedJob.consignment
                      ? 'No consignment linked'
                      : selectedJob.consignment.trackingId ||
                        'Pending (assigned when job is created)'}
                  </div>
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
                      selectedJob.documentsBrought.map((doc, index) => {
                        const resolved =
                          doc === 'Container No'
                            ? selectedJob.containerNumber
                              ? selectedJob.containerNumber
                              : 'Not specified'
                            : doc;

                        return (
                          <Tag
                            key={index}
                            color="green"
                            style={{ marginBottom: '2px', marginRight: '4px' }}
                          >
                            {resolved}
                          </Tag>
                        );
                      })
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
                {documentsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <br />
                    <Text type="secondary" style={{ marginTop: '16px', display: 'block' }}>
                      Loading documents...
                    </Text>
                  </div>
                ) : selectedJobDocuments && selectedJobDocuments.length > 0 ? (
                  <div>
                    {/* Payment Receipts Section */}
                    {(() => {
                      const paymentReceipts = selectedJobDocuments.filter(doc => doc.category === 'payment_receipt');
                      if (paymentReceipts.length > 0) {
                        return (
                          <div style={{ marginBottom: '24px' }}>
                            <Title level={5} style={{ color: '#52c41a', marginBottom: '12px' }}>
                              💳 Payment Receipts (Compulsory)
                            </Title>
                            {paymentReceipts.map((doc, index) => (
                              <div key={doc.id || index} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '8px 0',
                                borderBottom: index < paymentReceipts.length - 1 ? '1px solid #f0f0f0' : 'none'
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
                                  type="default" 
                                  size="small"
                                  icon={<EyeOutlined />}
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Demurrage Invoices Section */}
                    {(() => {
                      const demurrageInvoices = selectedJobDocuments.filter(doc => doc.category === 'demurrage_invoice');
                      if (demurrageInvoices.length > 0) {
                        return (
                          <div style={{ marginBottom: '24px' }}>
                            <Title level={5} style={{ color: '#fa8c16', marginBottom: '12px' }}>
                              📄 Demurrage Invoices
                            </Title>
                            {demurrageInvoices.map((doc, index) => (
                              <div key={doc.id || index} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '8px 0',
                                borderBottom: index < demurrageInvoices.length - 1 ? '1px solid #f0f0f0' : 'none'
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
                                  type="default" 
                                  size="small"
                                  icon={<EyeOutlined />}
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Other Documents Section */}
                    {(() => {
                      const otherDocs = selectedJobDocuments.filter(doc => 
                        doc.category !== 'payment_receipt' && doc.category !== 'demurrage_invoice'
                      );
                      if (otherDocs.length > 0) {
                        return (
                          <div>
                            <Title level={5} style={{ color: '#1890ff', marginBottom: '12px' }}>
                              📎 Other Documents
                            </Title>
                            {otherDocs.map((doc, index) => (
                              <div key={doc.id || index} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '8px 0',
                                borderBottom: index < otherDocs.length - 1 ? '1px solid #f0f0f0' : 'none'
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
                                  type="default" 
                                  size="small"
                                  icon={<EyeOutlined />}
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
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
         confirmLoading={customOptionSaving}
         maskClosable={false}
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
                 {`This ${customOptionType.toLowerCase()} will be saved for everyone and available in future forms.`}
               </Text>
             </div>
           </Form>
         </div>
       </Modal>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        file={previewFile}
      />
     </div>
   );
 };

export default JobsPage;
