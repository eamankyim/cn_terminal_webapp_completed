import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Select,
  Input,
  DatePicker,
  Modal,
  Drawer,
  Form,
  message,
  Tooltip,
  Popconfirm,
  Badge
} from 'antd';
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  FilterOutlined,
  PlusOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import moment from 'moment';
import expenseService from '../../services/expenseService';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGate from '../common/PermissionGate';
import { PERMISSIONS } from '../../utils/permissions';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search, TextArea } = Input;
const { RangePicker } = DatePicker;

const ExpenseRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    dateRange: null
  });
  const [stats, setStats] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalForm] = Form.useForm();
  const { currentUser } = useAuth();

  const expenseCategories = expenseService.getExpenseCategories();
  const expenseStatuses = expenseService.getExpenseStatuses();

  useEffect(() => {
    loadRequests();
    loadStats();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      // Add date range filter
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await expenseService.getExpenseRequests(params);
      setRequests(response.requests || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0
      }));
    } catch (error) {

      message.error('Failed to load expense requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await expenseService.getExpenseStats();
      setStats(response);
    } catch (error) {

    }
  };

  const handleTableChange = (paginationInfo) => {
    setPagination(paginationInfo);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  const handleViewDetails = async (record) => {
    // Open drawer immediately with basic record data
    setSelectedRequest(record);
    setDetailDrawerVisible(true);
    
    // Load detailed data in the background
    try {
      const response = await expenseService.getExpenseRequest(record.id);
      setSelectedRequest(response);
    } catch (error) {

      message.error('Failed to load request details');
    }
  };

  const handleApproval = (record, action) => {
    setSelectedRequest(record);
    setApprovalAction(action);
    setApprovalComment('');
    approvalForm.resetFields();
    setApprovalModalVisible(true);
  };

  const confirmApproval = async () => {
    try {
      // Validate form before proceeding
      await approvalForm.validateFields();
      
      if (approvalAction === 'approve') {
        const updatedRequest = await expenseService.approveExpenseRequest(selectedRequest.id, approvalComment);
        message.success('Expense request approved successfully');
        
        // Update the selected request status immediately
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
          // Show a brief success indicator in the drawer
          message.success('Status updated to APPROVED', 2);
        }
      } else {
        const updatedRequest = await expenseService.rejectExpenseRequest(selectedRequest.id, approvalComment || 'Rejected by admin');
        message.success('Expense request rejected');
        
        // Update the selected request status immediately
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
          // Show a brief success indicator in the drawer
          message.success('Status updated to REJECTED', 2);
        }
      }
      
      setApprovalModalVisible(false);
      setApprovalAction(null);
      setApprovalComment('');
      approvalForm.resetFields();
      
      // Reload data to reflect changes
      await loadRequests();
      await loadStats();
      
      // Close detail drawer after a short delay to show the updated status
      setTimeout(() => {
        setDetailDrawerVisible(false);
        setSelectedRequest(null);
      }, 1000);
      
    } catch (error) {
      if (error.errorFields) {
        // Form validation error - don't show error message, validation will show
        return;
      }

      message.error('Failed to process approval');
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = expenseStatuses.find(s => s.value === status);
    return statusConfig?.color || 'default';
  };

  const getCategoryLabel = (category) => {
    const categoryConfig = expenseCategories.find(c => c.value === category);
    return categoryConfig?.label || category;
  };

  const columns = [
    {
      title: 'Request Details',
      key: 'details',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{expenseService.formatExpenseAmount(record.amount)}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {getCategoryLabel(record.category)}
          </Text>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Requested By',
      key: 'requester',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.requestedBy?.name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.requestedBy?.role}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Date',
      key: 'date',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{moment(record.expenseDate).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {moment(record.createdAt).fromNow()}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Job',
      key: 'job',
      render: (_, record) => (
        record.job ? (
          <Space direction="vertical" size={0}>
            <Text strong>{record.job.trackingId}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.job.status}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">No job linked</Text>
        )
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>
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
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={stats.totalAmount || 0}
              formatter={(value) => expenseService.formatExpenseAmount(value)}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Requests"
              value={stats.pendingRequests || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approved Requests"
              value={stats.approvedRequests || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={stats.totalCount || 0}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Select
              placeholder="Status"
              allowClear
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
            >
              {expenseStatuses.map(status => (
                <Option key={status.value} value={status.value}>
                  <Tag color={status.color}>{status.label}</Tag>
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Category"
              allowClear
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
              style={{ width: '100%' }}
            >
              {expenseCategories.map(category => (
                <Option key={category.value} value={category.value}>
                  {category.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <Search
              placeholder="Search description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onSearch={() => loadRequests()}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadRequests}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} requests`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title="Expense Request Details"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={600}
        placement="right"
      >
        {selectedRequest && (
          <div>
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
                Expense Request Details
              </Title>
              
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Amount:</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                  {expenseService.formatExpenseAmount(selectedRequest.amount)}
                </div>
              </div>
              
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Status:</div>
                <div>
                  <Tag color={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Tag>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Category:</div>
                <div>{getCategoryLabel(selectedRequest.category)}</div>
              </div>
              
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Expense Date:</div>
                <div>{moment(selectedRequest.expenseDate).format('DD/MM/YYYY')}</div>
              </div>
              
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Description:</div>
                <div>{selectedRequest.description}</div>
              </div>
              
              {selectedRequest.job && (
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Related Job:</div>
                  <div>{selectedRequest.job.trackingId} - {selectedRequest.job.status}</div>
                </div>
              )}
              
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Requested By:</div>
                <div>{selectedRequest.requestedBy?.name} ({selectedRequest.requestedBy?.role})</div>
              </div>
              
              <div style={{ marginBottom: '16px', display: 'flex' }}>
                <div style={{ width: '140px', fontWeight: 'bold' }}>Request Date:</div>
                <div>{moment(selectedRequest.createdAt).format('DD/MM/YYYY HH:mm')}</div>
              </div>
              
              {selectedRequest.approvedBy && (
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Approved By:</div>
                  <div>{selectedRequest.approvedBy?.name} ({selectedRequest.approvedBy?.role})</div>
                </div>
              )}
              
              {selectedRequest.approvedAt && (
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Approved Date:</div>
                  <div>{moment(selectedRequest.approvedAt).format('DD/MM/YYYY HH:mm')}</div>
                </div>
              )}
              
              {selectedRequest.approvalComment && (
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Approval Comment:</div>
                  <div style={{ fontStyle: 'italic', color: '#666' }}>
                    {selectedRequest.approvalComment}
                  </div>
                </div>
              )}
              
              {selectedRequest.rejectionReason && (
                <div style={{ marginBottom: '16px', display: 'flex' }}>
                  <div style={{ width: '140px', fontWeight: 'bold' }}>Rejection Reason:</div>
                  <div style={{ color: '#ff4d4f' }}>{selectedRequest.rejectionReason}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedRequest.status === 'PENDING' && (
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <Text strong style={{ marginBottom: 16, display: 'block' }}>Actions:</Text>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <PermissionGate 
                    userRole={currentUser?.role} 
                    userPermissions={currentUser?.permissions}
                    permissions={PERMISSIONS.EXPENSE_APPROVE}
                  >
                    <Space size={8}>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleApproval(selectedRequest, 'approve')}
                      >
                        Approve Request
                      </Button>
                      <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleApproval(selectedRequest, 'reject')}
                      >
                        Reject Request
                      </Button>
                    </Space>
                  </PermissionGate>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Approval Confirmation Modal */}
      <Modal
        title={`${approvalAction === 'approve' ? 'Approve' : 'Reject'} Expense Request`}
        open={approvalModalVisible}
        onOk={confirmApproval}
        onCancel={() => setApprovalModalVisible(false)}
        okText={approvalAction === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={{
          type: approvalAction === 'approve' ? 'primary' : 'danger'
        }}
        width={500}
      >
        {selectedRequest && (
          <div>
            <div style={{ marginBottom: 16 }}>
            <Text strong>Amount:</Text> {expenseService.formatExpenseAmount(selectedRequest.amount)}
            <br />
            <Text strong>Description:</Text> {selectedRequest.description}
            </div>
            
            <Form form={approvalForm} layout="vertical">
              <Form.Item
                label={`${approvalAction === 'approve' ? 'Approval' : 'Rejection'} Comment`}
                name="comment"
                rules={[
                  { 
                    required: true, 
                    message: `Please provide a ${approvalAction === 'approve' ? 'comment for approval' : 'reason for rejection'}` 
                  }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`Enter your ${approvalAction === 'approve' ? 'approval comment' : 'reason for rejection'}...`}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExpenseRequestsList;

