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
const { Search } = Input;
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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
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
      console.error('Error loading expense requests:', error);
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
      console.error('Error loading expense stats:', error);
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
    try {
      const response = await expenseService.getExpenseRequest(record.id);
      setSelectedRequest(response);
      setDetailModalVisible(true);
    } catch (error) {
      console.error('Error loading request details:', error);
      message.error('Failed to load request details');
    }
  };

  const handleApproval = (record, action) => {
    setSelectedRequest(record);
    setApprovalAction(action);
    setApprovalModalVisible(true);
  };

  const confirmApproval = async () => {
    try {
      if (approvalAction === 'approve') {
        await expenseService.approveExpenseRequest(selectedRequest.id);
        message.success('Expense request approved successfully');
      } else {
        // For rejection, we would need a reason input
        await expenseService.rejectExpenseRequest(selectedRequest.id, 'Rejected by admin');
        message.success('Expense request rejected');
      }
      
      setApprovalModalVisible(false);
      setSelectedRequest(null);
      setApprovalAction(null);
      loadRequests();
      loadStats();
    } catch (error) {
      console.error('Error processing approval:', error);
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
        <Space>
          <Tooltip title="View Details">
            <Button
              type="default"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          
          <PermissionGate userRole={currentUser?.role} permissions={PERMISSIONS.EXPENSE_APPROVE}>
            {record.status === 'PENDING' && (
              <>
                <Tooltip title="Approve">
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleApproval(record, 'approve')}
                  />
                </Tooltip>
                <Tooltip title="Reject">
                  <Button
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleApproval(record, 'reject')}
                  />
                </Tooltip>
              </>
            )}
          </PermissionGate>
        </Space>
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

      {/* Detail Modal */}
      <Modal
        title="Expense Request Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>Amount:</Text>
                <br />
                <Text>{expenseService.formatExpenseAmount(selectedRequest.amount)}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Status:</Text>
                <br />
                <Tag color={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Tag>
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>Category:</Text>
                <br />
                <Text>{getCategoryLabel(selectedRequest.category)}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Expense Date:</Text>
                <br />
                <Text>{moment(selectedRequest.expenseDate).format('DD/MM/YYYY')}</Text>
              </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Description:</Text>
              <br />
              <Text>{selectedRequest.description}</Text>
            </div>

            {selectedRequest.job && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Related Job:</Text>
                <br />
                <Text>{selectedRequest.job.trackingId} - {selectedRequest.job.status}</Text>
              </div>
            )}

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>Requested By:</Text>
                <br />
                <Text>{selectedRequest.requestedBy?.name} ({selectedRequest.requestedBy?.role})</Text>
              </Col>
              <Col span={12}>
                <Text strong>Request Date:</Text>
                <br />
                <Text>{moment(selectedRequest.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
              </Col>
            </Row>

            {selectedRequest.approvedBy && (
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Approved By:</Text>
                  <br />
                  <Text>{selectedRequest.approvedBy?.name} ({selectedRequest.approvedBy?.role})</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Approved Date:</Text>
                  <br />
                  <Text>{moment(selectedRequest.approvedAt).format('DD/MM/YYYY HH:mm')}</Text>
                </Col>
              </Row>
            )}

            {selectedRequest.rejectionReason && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Rejection Reason:</Text>
                <br />
                <Text type="danger">{selectedRequest.rejectionReason}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>

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
      >
        <p>
          Are you sure you want to <strong>{approvalAction}</strong> this expense request?
        </p>
        {selectedRequest && (
          <div>
            <Text strong>Amount:</Text> {expenseService.formatExpenseAmount(selectedRequest.amount)}
            <br />
            <Text strong>Description:</Text> {selectedRequest.description}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExpenseRequestsList;

