import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Space, 
  Tag, 
  Typography,
  Row,
  Col,
  Tabs,
  Avatar,
  Drawer,
  Descriptions,
  Divider,
  InputNumber,
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  EditOutlined,
  EyeOutlined,
  SettingOutlined,
  TeamOutlined,
  MailOutlined as MailIcon
} from '@ant-design/icons';
import InviteManagement from '../components/admin/InviteManagement';
import userService from '../services/userService';
import configurationService from '../services/configurationService';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AdminDashboardPage = () => {
  const { currentUser, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [generalSettingsForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  // const [whatsappForm] = Form.useForm();
  const [organisationForm] = Form.useForm();
  const [clearingForm] = Form.useForm();
  const [preferences, setPreferences] = useState({
    companyName: 'CN TERMINAL',
    defaultCurrency: 'GHS',
    timeZone: 'Africa/Accra',
    dateFormat: 'DD/MM/YYYY'
  });
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  // Organisation settings state
  const [organisationSettings, setOrganisationSettings] = useState({
    companyName: 'CN Terminal Ltd',
    businessReg: '',
    vatNumber: '',
    industry: 'clearing',
    address: ''
  });
  const [isEditingOrganisation, setIsEditingOrganisation] = useState(false);

  // Clearing settings state
  const [clearingSettings, setClearingSettings] = useState({
    serviceFee: 5.0,
    processingFee: 100,
    etaApiKey: '',
    paymentGateway: 'paystack',
    supportedPorts: ['tema']
  });
  const [isEditingClearing, setIsEditingClearing] = useState(false);
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    jobStatusUpdates: true,
    paymentReminders: true,
    systemAlerts: true
  });
  const [isEditingNotifications, setIsEditingNotifications] = useState(false);

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginNotifications: true
  });
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);

  // WhatsApp Web settings state - COMMENTED OUT
  /*
  const [whatsappSettings, setWhatsappSettings] = useState({
    enabled: false,
    phoneNumber: '',
    businessName: 'CN Terminal',
    autoReply: true,
    webhookUrl: ''
  });
  const [isEditingWhatsapp, setIsEditingWhatsapp] = useState(false);
  */

  // Function to generate initials from user name
  const getUserInitials = (name) => {
    if (!name) return 'U';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Real user data from API
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Load users from API
  useEffect(() => {
    loadUsers();
  }, []);

  // Populate profile form with current user data
  useEffect(() => {
    if (currentUser && profileForm) {
      const department = getDepartmentByRole(currentUser.role);
      profileForm.setFieldsValue({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: '', // Phone field not available in current user schema
        department: department || 'operations'
      });
    }
  }, [currentUser, profileForm]);

  // Load general settings preferences
  useEffect(() => {
    const loadSettings = async () => {
      await loadGeneralSettings();
      await loadNotificationSettings();
      await loadSecuritySettings();
      // await loadWhatsappSettings();
      await loadOrganisationSettings();
      await loadClearingSettings();
    };
    loadSettings();
  }, []);

  // Initialize general settings form when preferences are loaded
  useEffect(() => {
    if (generalSettingsForm) {
      generalSettingsForm.setFieldsValue(preferences);
      // Check if preferences are already set (all fields have values)
      const hasPreferences = preferences.companyName && preferences.defaultCurrency && preferences.timeZone && preferences.dateFormat;
      setIsEditingPreferences(hasPreferences);
    }
  }, [preferences, generalSettingsForm]);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await userService.getUsers();
      console.log('Loaded users from API:', response.users);
      
      // Transform users to match the expected format
      const transformedUsers = response.users.map((user, index) => ({
        key: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        status: user.isActive ? 'active' : 'inactive',
        avatar: null,
        phone: 'N/A', // Phone not stored in current schema
        department: getDepartmentByRole(user.role),
        joinedDate: new Date(user.createdAt).toISOString().split('T')[0],
        lastLogin: 'N/A' // Last login not tracked in current schema
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const getDepartmentByRole = (role) => {
    switch (role) {
      case 'ADMIN': return 'Management';
      case 'STAFF': return 'Operations';
      case 'DRIVER': return 'Logistics';
      case 'WAREHOUSE': return 'Warehouse';
      default: return 'Operations';
    }
  };

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.avatar} 
            size="large"
            style={{
              backgroundColor: record.avatar ? undefined : '#1890ff',
              color: record.avatar ? undefined : '#fff',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {record.avatar ? undefined : getUserInitials(record.name)}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary">{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleColors = {
          admin: 'red',
          driver: 'blue',
          warehouse: 'green',

          finance: 'purple',
          'customer-service': 'cyan'
        };
        return <Tag color={roleColors[role] || 'default'}>{role.replace('-', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Joined Date',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewUser(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsDetailsDrawerVisible(true);
  };

  const handleInviteTeamMember = () => {
    // This will be handled by the InviteManagement component
    message.info('Use the Invite Management tab to send invitations');
  };

  const handleProfileUpdate = async (values) => {
    try {
      // Only update fields that exist in the user schema
      const updateData = {
        name: values.name,
        email: values.email
        // Note: phone and department are not part of the user schema
      };
      
      await updateProfile(updateData);
      message.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    }
  };

  const loadGeneralSettings = async () => {
    try {
      // Load from backend configuration service
      const [companyName, defaultCurrency, timeZone, dateFormat] = await Promise.all([
        configurationService.getConfigValue('COMPANY_NAME', 'CN TERMINAL'),
        configurationService.getConfigValue('DEFAULT_CURRENCY', 'GHS'),
        configurationService.getConfigValue('TIME_ZONE', 'Africa/Accra'),
        configurationService.getConfigValue('DATE_FORMAT', 'DD/MM/YYYY')
      ]);

      const loadedSettings = {
        companyName,
        defaultCurrency,
        timeZone,
        dateFormat
      };

      setPreferences(prev => ({ ...prev, ...loadedSettings }));
      
      // Check if any settings are configured (not just defaults)
      const hasConfiguredSettings = Object.values(loadedSettings).some(value => 
        value && value !== 'CN TERMINAL' && value !== 'GHS' && value !== 'Africa/Accra' && value !== 'DD/MM/YYYY'
      );
      setIsEditingPreferences(hasConfiguredSettings);
    } catch (error) {
      console.error('Error loading general settings from backend:', error);
      // Fallback to localStorage if backend fails
      const savedSettings = localStorage.getItem('cn_terminal_general_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (parseError) {
          console.error('Error parsing saved settings:', parseError);
        }
      }
    }
  };

  const loadNotificationSettings = async () => {
    try {
      // Load from backend configuration service
      const [emailNotifications, smsNotifications, pushNotifications, jobStatusUpdates, paymentReminders, systemAlerts] = await Promise.all([
        configurationService.getConfigValue('EMAIL_NOTIFICATIONS', true),
        configurationService.getConfigValue('SMS_NOTIFICATIONS', false),
        configurationService.getConfigValue('PUSH_NOTIFICATIONS', true),
        configurationService.getConfigValue('JOB_STATUS_UPDATES', true),
        configurationService.getConfigValue('PAYMENT_REMINDERS', true),
        configurationService.getConfigValue('SYSTEM_ALERTS', true)
      ]);

      const loadedSettings = {
        emailNotifications,
        smsNotifications,
        pushNotifications,
        jobStatusUpdates,
        paymentReminders,
        systemAlerts
      };

      setNotificationSettings(prev => ({ ...prev, ...loadedSettings }));
      setIsEditingNotifications(true);
    } catch (error) {
      console.error('Error loading notification settings from backend:', error);
      // Fallback to localStorage if backend fails
      const savedSettings = localStorage.getItem('cn_terminal_notification_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setNotificationSettings(prev => ({ ...prev, ...parsed }));
          setIsEditingNotifications(true);
        } catch (parseError) {
          console.error('Error parsing saved settings:', parseError);
        }
      }
    }
  };

  const loadSecuritySettings = async () => {
    try {
      // Load from backend configuration service
      const [twoFactorAuth, sessionTimeout, passwordExpiry, loginNotifications] = await Promise.all([
        configurationService.getConfigValue('TWO_FACTOR_AUTH', false),
        configurationService.getConfigValue('SESSION_TIMEOUT', 30),
        configurationService.getConfigValue('PASSWORD_EXPIRY', 90),
        configurationService.getConfigValue('LOGIN_NOTIFICATIONS', true)
      ]);

      const loadedSettings = {
        twoFactorAuth,
        sessionTimeout,
        passwordExpiry,
        loginNotifications
      };

      setSecuritySettings(prev => ({ ...prev, ...loadedSettings }));
      setIsEditingSecurity(true);
    } catch (error) {
      console.error('Error loading security settings from backend:', error);
      // Fallback to localStorage if backend fails
      const savedSettings = localStorage.getItem('cn_terminal_security_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSecuritySettings(prev => ({ ...prev, ...parsed }));
          setIsEditingSecurity(true);
        } catch (parseError) {
          console.error('Error parsing saved settings:', parseError);
        }
      }
    }
  };

  /*
  const loadWhatsappSettings = async () => {
    try {
      // Load from backend configuration service
      const [enabled, phoneNumber, businessName, autoReply, webhookUrl] = await Promise.all([
        configurationService.getConfigValue('WHATSAPP_ENABLED', false),
        configurationService.getConfigValue('WHATSAPP_PHONE', ''),
        configurationService.getConfigValue('WHATSAPP_BUSINESS_NAME', 'CN Terminal'),
        configurationService.getConfigValue('WHATSAPP_AUTO_REPLY', true),
        configurationService.getConfigValue('WHATSAPP_WEBHOOK_URL', '')
      ]);

      const loadedSettings = {
        enabled,
        phoneNumber,
        businessName,
        autoReply,
        webhookUrl
      };

      setWhatsappSettings(prev => ({ ...prev, ...loadedSettings }));
      setIsEditingWhatsapp(true);
    } catch (error) {
      console.error('Error loading WhatsApp settings from backend:', error);
      // Fallback to localStorage if backend fails
      const savedSettings = localStorage.getItem('cn_terminal_whatsapp_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setWhatsappSettings(prev => ({ ...prev, ...parsed }));
          setIsEditingWhatsapp(true);
        } catch (parseError) {
          console.error('Error parsing saved settings:', parseError);
        }
      }
    }
  };
  */

  const loadOrganisationSettings = async () => {
    try {
      // Load from backend configuration service
      const [companyName, businessReg, vatNumber, industry, address] = await Promise.all([
        configurationService.getConfigValue('COMPANY_NAME', 'CN Terminal Ltd'),
        configurationService.getConfigValue('BUSINESS_REGISTRATION', ''),
        configurationService.getConfigValue('VAT_NUMBER', ''),
        configurationService.getConfigValue('INDUSTRY', 'clearing'),
        configurationService.getConfigValue('COMPANY_ADDRESS', '')
      ]);

      const loadedSettings = {
        companyName,
        businessReg,
        vatNumber,
        industry,
        address
      };

      setOrganisationSettings(prev => ({ ...prev, ...loadedSettings }));
      setIsEditingOrganisation(true);
    } catch (error) {
      console.error('Error loading organisation settings from backend:', error);
      // Fallback to localStorage if backend fails
      const savedSettings = localStorage.getItem('cn_terminal_organisation_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setOrganisationSettings(prev => ({ ...prev, ...parsed }));
          setIsEditingOrganisation(true);
        } catch (parseError) {
          console.error('Error parsing saved settings:', parseError);
        }
      }
    }
  };

  const loadClearingSettings = async () => {
    try {
      // Load from backend configuration service - using existing SERVICE configurations
      const [serviceFee, processingFee, etaApiKey, paymentGateway, supportedPorts] = await Promise.all([
        configurationService.getConfigValue('DEFAULT_SERVICE_CHARGE', 5.0),
        configurationService.getConfigValue('DEFAULT_CLEARANCE_CHARGE', 100),
        configurationService.getConfigValue('ETA_API_KEY', ''),
        configurationService.getConfigValue('PAYMENT_GATEWAY', 'paystack'),
        configurationService.getConfigValue('SUPPORTED_PORTS', 'tema')
      ]);

      const loadedSettings = {
        serviceFee,
        processingFee,
        etaApiKey,
        paymentGateway,
        supportedPorts: supportedPorts ? supportedPorts.split(',').map(p => p.trim()) : ['tema']
      };

      setClearingSettings(prev => ({ ...prev, ...loadedSettings }));
      setIsEditingClearing(true);
    } catch (error) {
      console.error('Error loading clearing settings from backend:', error);
      // Fallback to localStorage if backend fails
      const savedSettings = localStorage.getItem('cn_terminal_clearing_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setClearingSettings(prev => ({ ...prev, ...parsed }));
          setIsEditingClearing(true);
        } catch (parseError) {
          console.error('Error parsing saved settings:', parseError);
        }
      }
    }
  };

  const handleGeneralSettingsSave = async (values) => {
    try {
      // Save to backend configuration service
      const configurations = [
        {
          key: 'COMPANY_NAME',
          value: values.companyName,
          type: 'STRING',
          category: 'BUSINESS',
          description: 'Company name for invoices and reports'
        },
        {
          key: 'DEFAULT_CURRENCY',
          value: values.defaultCurrency,
          type: 'STRING',
          category: 'BUSINESS',
          description: 'Default currency for the system'
        },
        {
          key: 'TIME_ZONE',
          value: values.timeZone,
          type: 'STRING',
          category: 'SYSTEM',
          description: 'Default timezone for the system'
        },
        {
          key: 'DATE_FORMAT',
          value: values.dateFormat,
          type: 'STRING',
          category: 'SYSTEM',
          description: 'Default date format for the system'
        }
      ];

      await configurationService.saveConfigurations(configurations);
      
      // Update state
      setPreferences(values);
      setIsEditingPreferences(true);
      
      message.success('General settings saved successfully');
    } catch (error) {
      console.error('Error saving general settings:', error);
      message.error('Failed to save general settings');
      
      // Fallback to localStorage if backend fails
      try {
        localStorage.setItem('cn_terminal_general_settings', JSON.stringify(values));
        setPreferences(values);
        setIsEditingPreferences(true);
        message.warning('Settings saved locally (backend unavailable)');
      } catch (fallbackError) {
        console.error('Error saving to localStorage:', fallbackError);
      }
    }
  };

  const handleGeneralSettingsEdit = () => {
    setIsEditingPreferences(false);
    // Form will remain populated with current values for editing
  };

  // Notification settings handlers
  const handleNotificationSave = async (values) => {
    try {
      // Save to backend configuration service
      const configurations = [
        {
          key: 'EMAIL_NOTIFICATIONS',
          value: values.emailNotifications,
          type: 'BOOLEAN',
          category: 'NOTIFICATIONS',
          description: 'Enable email notifications'
        },
        {
          key: 'SMS_NOTIFICATIONS',
          value: values.smsNotifications,
          type: 'BOOLEAN',
          category: 'NOTIFICATIONS',
          description: 'Enable SMS notifications'
        },
        {
          key: 'PUSH_NOTIFICATIONS',
          value: values.pushNotifications,
          type: 'BOOLEAN',
          category: 'NOTIFICATIONS',
          description: 'Enable push notifications'
        },
        {
          key: 'JOB_STATUS_UPDATES',
          value: values.jobStatusUpdates,
          type: 'BOOLEAN',
          category: 'NOTIFICATIONS',
          description: 'Enable job status update notifications'
        },
        {
          key: 'PAYMENT_REMINDERS',
          value: values.paymentReminders,
          type: 'BOOLEAN',
          category: 'NOTIFICATIONS',
          description: 'Enable payment reminder notifications'
        },
        {
          key: 'SYSTEM_ALERTS',
          value: values.systemAlerts,
          type: 'BOOLEAN',
          category: 'NOTIFICATIONS',
          description: 'Enable system alert notifications'
        }
      ];

      await configurationService.saveConfigurations(configurations);
      
      setNotificationSettings(values);
      setIsEditingNotifications(true);
      message.success('Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      message.error('Failed to save notification settings');
      
      // Fallback to localStorage if backend fails
      try {
        localStorage.setItem('cn_terminal_notification_settings', JSON.stringify(values));
        setNotificationSettings(values);
        setIsEditingNotifications(true);
        message.warning('Settings saved locally (backend unavailable)');
      } catch (fallbackError) {
        console.error('Error saving to localStorage:', fallbackError);
      }
    }
  };

  const handleNotificationEdit = () => {
    setIsEditingNotifications(false);
  };

  // Security settings handlers
  const handleSecuritySave = async (values) => {
    try {
      // Save to backend configuration service
      const configurations = [
        {
          key: 'TWO_FACTOR_AUTH',
          value: values.twoFactorAuth,
          type: 'BOOLEAN',
          category: 'SECURITY',
          description: 'Enable two-factor authentication'
        },
        {
          key: 'SESSION_TIMEOUT',
          value: values.sessionTimeout,
          type: 'NUMBER',
          category: 'SECURITY',
          description: 'Session timeout in minutes'
        },
        {
          key: 'PASSWORD_EXPIRY',
          value: values.passwordExpiry,
          type: 'NUMBER',
          category: 'SECURITY',
          description: 'Password expiry in days'
        },
        {
          key: 'LOGIN_NOTIFICATIONS',
          value: values.loginNotifications,
          type: 'BOOLEAN',
          category: 'SECURITY',
          description: 'Enable login notifications'
        }
      ];

      await configurationService.saveConfigurations(configurations);
      
      setSecuritySettings(values);
      setIsEditingSecurity(true);
      message.success('Security settings saved successfully');
    } catch (error) {
      console.error('Error saving security settings:', error);
      message.error('Failed to save security settings');
      
      // Fallback to localStorage if backend fails
      try {
        localStorage.setItem('cn_terminal_security_settings', JSON.stringify(values));
        setSecuritySettings(values);
        setIsEditingSecurity(true);
        message.warning('Settings saved locally (backend unavailable)');
      } catch (fallbackError) {
        console.error('Error saving to localStorage:', fallbackError);
      }
    }
  };

  const handleSecurityEdit = () => {
    setIsEditingSecurity(false);
  };

  // WhatsApp Web settings handlers - COMMENTED OUT
  /*
  const handleWhatsappSave = async (values) => {
    try {
      // Save to backend configuration service
      const configurations = [
        {
          key: 'WHATSAPP_ENABLED',
          value: values.enabled,
          type: 'BOOLEAN',
          category: 'INTEGRATION',
          description: 'Enable WhatsApp Web integration'
        },
        {
          key: 'WHATSAPP_PHONE',
          value: values.phoneNumber,
          type: 'STRING',
          category: 'INTEGRATION',
          description: 'WhatsApp business phone number'
        },
        {
          key: 'WHATSAPP_BUSINESS_NAME',
          value: values.businessName,
          type: 'STRING',
          category: 'INTEGRATION',
          description: 'WhatsApp business name'
        },
        {
          key: 'WHATSAPP_AUTO_REPLY',
          value: values.autoReply,
          type: 'BOOLEAN',
          category: 'INTEGRATION',
          description: 'Enable WhatsApp auto-reply'
        },
        {
          key: 'WHATSAPP_WEBHOOK_URL',
          value: values.webhookUrl,
          type: 'STRING',
          category: 'INTEGRATION',
          description: 'WhatsApp webhook URL for notifications'
        }
      ];

      await configurationService.saveConfigurations(configurations);
      
      setWhatsappSettings(values);
      setIsEditingWhatsapp(true);
      message.success('WhatsApp Web settings saved successfully');
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      message.error('Failed to save WhatsApp settings');
      
      // Fallback to localStorage if backend fails
      try {
        localStorage.setItem('cn_terminal_whatsapp_settings', JSON.stringify(values));
        setWhatsappSettings(values);
        setIsEditingWhatsapp(true);
        message.warning('Settings saved locally (backend unavailable)');
      } catch (fallbackError) {
        console.error('Error saving to localStorage:', fallbackError);
      }
    }
  };
  */

  // Organisation settings handlers
  const handleOrganisationSave = async (values) => {
    try {
      // Save to backend configuration service
      const configurations = [
        {
          key: 'COMPANY_NAME',
          value: values.companyName,
          type: 'STRING',
          category: 'BUSINESS',
          description: 'Company name for invoices and reports'
        },
        {
          key: 'BUSINESS_REGISTRATION',
          value: values.businessReg,
          type: 'STRING',
          category: 'BUSINESS',
          description: 'Business registration number'
        },
        {
          key: 'VAT_NUMBER',
          value: values.vatNumber,
          type: 'STRING',
          category: 'BUSINESS',
          description: 'VAT registration number'
        },
        {
          key: 'INDUSTRY',
          value: values.industry,
          type: 'STRING',
          category: 'BUSINESS',
          description: 'Industry type'
        },
        {
          key: 'COMPANY_ADDRESS',
          value: values.address,
          type: 'STRING',
          category: 'BUSINESS',
          description: 'Company address'
        }
      ];

      await configurationService.saveConfigurations(configurations);
      
      setOrganisationSettings(values);
      setIsEditingOrganisation(true);
      message.success('Organisation settings saved successfully');
    } catch (error) {
      console.error('Error saving organisation settings:', error);
      message.error('Failed to save organisation settings');
      
      // Fallback to localStorage if backend fails
      try {
        localStorage.setItem('cn_terminal_organisation_settings', JSON.stringify(values));
        setOrganisationSettings(values);
        setIsEditingOrganisation(true);
        message.warning('Settings saved locally (backend unavailable)');
      } catch (fallbackError) {
        console.error('Error saving to localStorage:', fallbackError);
      }
    }
  };

  const handleOrganisationEdit = () => {
    setIsEditingOrganisation(false);
  };

  // Clearing settings handlers
  const handleClearingSave = async (values) => {
    try {
      // Save to backend configuration service - using existing SERVICE configurations
      const configurations = [
        {
          key: 'DEFAULT_SERVICE_CHARGE',
          value: values.serviceFee,
          type: 'NUMBER',
          category: 'SERVICE',
          description: 'Default service charge percentage'
        },
        {
          key: 'DEFAULT_CLEARANCE_CHARGE',
          value: values.processingFee,
          type: 'NUMBER',
          category: 'SERVICE',
          description: 'Default clearance charge amount'
        },
        {
          key: 'ETA_API_KEY',
          value: values.etaApiKey,
          type: 'STRING',
          category: 'SERVICE',
          description: 'ETA API key for tracking'
        },
        {
          key: 'PAYMENT_GATEWAY',
          value: values.paymentGateway,
          type: 'STRING',
          category: 'SERVICE',
          description: 'Default payment gateway'
        },
        {
          key: 'SUPPORTED_PORTS',
          value: Array.isArray(values.supportedPorts) ? values.supportedPorts.join(', ') : values.supportedPorts,
          type: 'STRING',
          category: 'SERVICE',
          description: 'Supported ports for operations'
        }
      ];

      await configurationService.saveConfigurations(configurations);
      
      setClearingSettings(values);
      setIsEditingClearing(true);
      message.success('Clearing settings saved successfully');
    } catch (error) {
      console.error('Error saving clearing settings:', error);
      message.error('Failed to save clearing settings');
      
      // Fallback to localStorage if backend fails
      try {
        localStorage.setItem('cn_terminal_clearing_settings', JSON.stringify(values));
        setClearingSettings(values);
        setIsEditingClearing(true);
        message.warning('Settings saved locally (backend unavailable)');
      } catch (fallbackError) {
        console.error('Error saving to localStorage:', fallbackError);
      }
    }
  };

  const handleClearingEdit = () => {
    setIsEditingClearing(false);
  };

  /*
  const handleWhatsappEdit = () => {
    setIsEditingWhatsapp(false);
  };
  */

  const tabItems = [
    {
      key: 'profile',
      label: 'Profile',
      children: (
        <div>
          <Title level={4}>Personal Profile</Title>
          <Card>
            <Form 
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileUpdate}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Full Name" name="name">
                    <Input prefix={<UserOutlined />} placeholder="Your full name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Email" name="email">
                    <Input prefix={<MailOutlined />} placeholder="Your email" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Phone" name="phone">
                    <Input prefix={<PhoneOutlined />} placeholder="Your phone number" disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Department" name="department">
                    <Select placeholder="Select department" disabled>
                      <Option value="management">Management</Option>
                      <Option value="operations">Operations</Option>
                      <Option value="finance">Finance</Option>
                      <Option value="customer-service">Customer Service</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Text type="secondary" style={{ fontSize: '12px', marginBottom: '16px', display: 'block' }}>
                Note: Phone and Department fields are display-only. Only Name and Email can be updated.
              </Text>
              <Form.Item>
                <Button type="primary" htmlType="submit">Update Profile</Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: 'general-settings',
      label: 'General Settings',
      children: (
        <div>
          <Title level={4}>General Settings</Title>
          <Card>
            <Form 
              form={generalSettingsForm}
              layout="vertical"
              onFinish={handleGeneralSettingsSave}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label="Company Name" 
                    name="companyName"
                    rules={[{ required: true, message: 'Please enter company name' }]}
                  >
                    <Input placeholder="CN TERMINAL" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label="Default Currency" 
                    name="defaultCurrency"
                    rules={[{ required: true, message: 'Please select default currency' }]}
                  >
                    <Select placeholder="Select currency">
                      <Option value="GHS">GHS - Ghanaian Cedi</Option>
                      <Option value="USD">USD - US Dollar</Option>
                      <Option value="EUR">EUR - Euro</Option>
                      <Option value="GBP">GBP - British Pound</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label="Time Zone" 
                    name="timeZone"
                    rules={[{ required: true, message: 'Please select time zone' }]}
                  >
                    <Select placeholder="Select time zone">
                      <Option value="Africa/Accra">Africa/Accra (GMT+0)</Option>
                      <Option value="Africa/Lagos">Africa/Lagos (GMT+1)</Option>
                      <Option value="Africa/Cairo">Africa/Cairo (GMT+2)</Option>
                      <Option value="Europe/London">Europe/London (GMT+0)</Option>
                      <Option value="America/New_York">America/New_York (GMT-5)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label="Date Format" 
                    name="dateFormat"
                    rules={[{ required: true, message: 'Please select date format' }]}
                  >
                    <Select placeholder="Select date format">
                      <Option value="DD/MM/YYYY">DD/MM/YYYY (25/12/2024)</Option>
                      <Option value="MM/DD/YYYY">MM/DD/YYYY (12/25/2024)</Option>
                      <Option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-25)</Option>
                      <Option value="DD-MM-YYYY">DD-MM-YYYY (25-12-2024)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                {isEditingPreferences ? (
                  <Button type="primary" onClick={handleGeneralSettingsEdit}>
                    Edit Preferences
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit">
                    Save Preferences
                  </Button>
                )}
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: 'organisation',
      label: 'Organisation',
      children: (
        <div>
          <Title level={4}>Organisation Settings</Title>
          <Card>
            <Form 
              form={organisationForm}
              layout="vertical"
              onFinish={handleOrganisationSave}
              initialValues={organisationSettings}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label="Company Name" 
                    name="companyName"
                    rules={[{ required: true, message: 'Please enter company name' }]}
                  >
                    <Input placeholder="CN Terminal Ltd" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Business Registration" name="businessReg">
                    <Input placeholder="Company registration number" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="VAT Number" name="vatNumber">
                    <Input placeholder="VAT registration number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Industry" name="industry">
                    <Select placeholder="Select industry">
                      <Option value="clearing">Clearing & Forwarding</Option>
                      <Option value="logistics">Logistics & Transportation</Option>
                      <Option value="customs">Customs Brokerage</Option>
                      <Option value="freight">Freight Forwarding</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Company Address" name="address">
                    <TextArea rows={3} placeholder="Enter company address" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                {isEditingOrganisation ? (
                  <Button type="primary" onClick={handleOrganisationEdit}>
                    Edit Organisation
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit">
                    Save Organisation
                  </Button>
                )}
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: 'invites',
      label: 'Invites',
      children: <InviteManagement />,
    },
    {
      key: 'clearing-settings',
      label: 'Clearing Settings',
      children: (
        <div>
          <Title level={4}>Clearing Agent Configuration</Title>
          <Card>
            <Form 
              form={clearingForm}
              layout="vertical"
              onFinish={handleClearingSave}
              initialValues={clearingSettings}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label="Default Service Fee (%)" 
                    name="serviceFee"
                    rules={[{ required: true, message: 'Please enter service fee percentage' }]}
                  >
                    <InputNumber 
                      min={0} 
                      max={100} 
                      placeholder="5.0" 
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label="Processing Fee (GHS)" 
                    name="processingFee"
                    rules={[{ required: true, message: 'Please enter processing fee' }]}
                  >
                    <InputNumber 
                      min={0} 
                      placeholder="100" 
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="ETA API Key" name="etaApiKey">
                    <Input.Password placeholder="Enter ETA API key" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label="Payment Gateway" 
                    name="paymentGateway"
                    rules={[{ required: true, message: 'Please select payment gateway' }]}
                  >
                    <Select placeholder="Select payment gateway">
                      <Option value="paystack">Paystack</Option>
                      <Option value="flutterwave">Flutterwave</Option>
                      <Option value="hubtel">Hubtel</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item 
                    label="Supported Ports" 
                    name="supportedPorts"
                    rules={[{ required: true, message: 'Please select supported ports' }]}
                  >
                    <Select mode="multiple" placeholder="Select supported ports">
                      <Option value="tema">Tema Port</Option>
                      <Option value="kotoka">Kotoka Airport</Option>
                      <Option value="takoradi">Takoradi Port</Option>
                      <Option value="kumasi">Kumasi Airport</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                {isEditingClearing ? (
                  <Button type="primary" onClick={handleClearingEdit}>
                    Edit Clearing Settings
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit">
                    Save Clearing Settings
                  </Button>
                )}
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: 'team-members',
      label: 'Team Members',
      children: (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleInviteTeamMember}
            >
              Invite Team Member
            </Button>
          </div>
          <Table
            columns={userColumns}
            dataSource={users}
            pagination={false}
            size="small"
            loading={usersLoading}
          />
        </div>
      ),
    },
    {
      key: 'notification-settings',
      label: 'Notification Settings',
      children: (
        <div>
          <Title level={4}>Notification Settings</Title>
          <Card>
            <Form 
              form={notificationForm}
              layout="vertical"
              onFinish={handleNotificationSave}
              initialValues={notificationSettings}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Email Notifications" name="emailNotifications" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="SMS Notifications" name="smsNotifications" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Push Notifications" name="pushNotifications" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Job Status Updates" name="jobStatusUpdates" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Payment Reminders" name="paymentReminders" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="System Alerts" name="systemAlerts" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                {isEditingNotifications ? (
                  <Button type="primary" onClick={handleNotificationEdit}>
                    Edit Notifications
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit">
                    Save Notifications
                  </Button>
                )}
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: 'security-settings',
      label: 'Security Settings',
      children: (
        <div>
          <Title level={4}>Security Settings</Title>
          <Card>
            <Form 
              form={securityForm}
              layout="vertical"
              onFinish={handleSecuritySave}
              initialValues={securitySettings}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Two-Factor Authentication" name="twoFactorAuth" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Login Notifications" name="loginNotifications" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Session Timeout (minutes)" name="sessionTimeout">
                    <InputNumber 
                      min={5} 
                      max={480} 
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Password Expiry (days)" name="passwordExpiry">
                    <InputNumber 
                      min={30} 
                      max={365} 
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                {isEditingSecurity ? (
                  <Button type="primary" onClick={handleSecurityEdit}>
                    Edit Security
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit">
                    Save Security
                  </Button>
                )}
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    /*
    {
      key: 'whatsapp-web',
      label: 'WhatsApp Web',
      children: (
        <div>
          <Title level={4}>WhatsApp Web Integration</Title>
          <Card>
            <Form 
              form={whatsappForm}
              layout="vertical"
              onFinish={handleWhatsappSave}
              initialValues={whatsappSettings}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Enable WhatsApp Web" name="enabled" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Auto Reply" name="autoReply" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Phone Number" name="phoneNumber">
                    <Input placeholder="+233XXXXXXXXX" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Business Name" name="businessName">
                    <Input placeholder="CN Terminal" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Webhook URL" name="webhookUrl">
                    <Input placeholder="https://api.example.com/webhook/whatsapp" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                {isEditingWhatsapp ? (
                  <Button type="primary" onClick={handleWhatsappEdit}>
                    Edit WhatsApp
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit">
                    Save WhatsApp
                  </Button>
                )}
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    */
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Admin & Settings
      </Title>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          defaultActiveKey="profile"
          items={tabItems}
          onChange={setActiveTab}
        />
      </Card>

      {/* User Details Side Drawer */}
      <Drawer
        title="User Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={600}
      >
        {selectedUser && (
          <div>
            {/* User Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar 
                    src={selectedUser.avatar} 
                    size={64}
                    style={{
                      backgroundColor: selectedUser.avatar ? undefined : '#1890ff',
                      color: selectedUser.avatar ? undefined : '#fff',
                      fontWeight: 'bold',
                      fontSize: '24px'
                    }}
                  >
                    {selectedUser.avatar ? undefined : getUserInitials(selectedUser.name)}
                  </Avatar>
                  <Title level={4} style={{ margin: '8px 0 0' }}>
                    {selectedUser.name}
                  </Title>
                  <Text type="secondary">{selectedUser.role}</Text>
                </div>
              </Col>
              <Col span={16}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Status</Text>
                  <br />
                  <Tag color="success" style={{ fontSize: '16px' }}>
                    {selectedUser.status.toUpperCase()}
                  </Tag>
                </div>
              </Col>
            </Row>
            <Divider />

            {/* User Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="User Information">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Email">
                      <Space>
                        <MailOutlined />
                        {selectedUser.email}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      <Space>
                        <PhoneOutlined />
                        {selectedUser.phone}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Department">
                      {selectedUser.department}
                    </Descriptions.Item>
                    <Descriptions.Item label="Role">
                      <Tag color="blue">{selectedUser.role.replace('-', ' ').toUpperCase()}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Joined Date">
                      {selectedUser.joinedDate}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Login">
                      {selectedUser.lastLogin}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminDashboardPage;
