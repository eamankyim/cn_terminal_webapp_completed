import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  message,
  Table,
  Tag,
  Tooltip,
  Empty
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DollarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import ExpenseRequestForm from '../components/accounting/ExpenseRequestForm';
import expenseService from '../services/expenseService';
import { useAuth } from '../contexts/AuthContext';
import PermissionGate from '../components/common/PermissionGate';
import { PERMISSIONS } from '../utils/permissions';

const { Title, Text } = Typography;

const RequestsPage = () => {
  const [expenseRequestModalVisible, setExpenseRequestModalVisible] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const { currentUser } = useAuth();

  const expenseStatuses = expenseService.getExpenseStatuses();

  useEffect(() => {
    loadMyRequests();
    loadMyStats();
  }, []);

  const loadMyRequests = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getExpenseRequests({
        requestedBy: currentUser?.id,
        limit: 50
      });
      setMyRequests(response.requests || []);
    } catch (error) {
      console.error('Error loading my requests:', error);
      message.error('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  const loadMyStats = async () => {
    try {
      const response = await expenseService.getExpenseStats({
        requestedBy: currentUser?.id
      });
      setStats(response);
    } catch (error) {
      console.error('Error loading my stats:', error);
    }
  };

  const handleExpenseRequestSuccess = () => {
    loadMyRequests();
    loadMyStats();
    message.success('Expense request submitted successfully');
  };

  const getStatusColor = (status) => {
    const statusConfig = expenseStatuses.find(s => s.value === status);
    return statusConfig?.color || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'APPROVED':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'REJECTED':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const columns = [
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <Text strong style={{ fontSize: '16px' }}>
          {expenseService.formatExpenseAmount(record.amount)}
        </Text>
      ),
    },
    {
      title: 'Description',
      key: 'description',
      render: (_, record) => (
        <div>
          <Text>{record.description}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category}
          </Text>
        </div>
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
          <Text strong>{record.job.trackingId}</Text>
        ) : (
          <Text type="secondary">No job linked</Text>
        )
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space>
          {getStatusIcon(record.status)}
          <Tag color={getStatusColor(record.status)}>
            {record.status}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
      ),
    },
  ];

  const handleViewDetails = async (record) => {
    try {
      const response = await expenseService.getExpenseRequest(record.id);
      // For now, just show a message with details
      message.info(`Request Details: ${response.description} - ${expenseService.formatExpenseAmount(response.amount)}`);
    } catch (error) {
      console.error('Error loading request details:', error);
      message.error('Failed to load request details');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <FileTextOutlined /> My Requests
        </Title>
        <p>Submit and track your expense requests</p>
      </div>

      {/* My Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <DollarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '18px' }}>
                  {expenseService.formatExpenseAmount(stats.totalAmount || 0)}
                </Text>
                <br />
                <Text type="secondary">Total Requested</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '18px' }}>
                  {stats.pendingRequests || 0}
                </Text>
                <br />
                <Text type="secondary">Pending</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '18px' }}>
                  {stats.approvedRequests || 0}
                </Text>
                <br />
                <Text type="secondary">Approved</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '18px' }}>
                  {stats.totalCount || 0}
                </Text>
                <br />
                <Text type="secondary">Total Requests</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <PermissionGate userRole={currentUser?.role} permissions={PERMISSIONS.EXPENSE_CREATE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setExpenseRequestModalVisible(true)}
            >
              New Expense Request
            </Button>
          </PermissionGate>
        </Space>
      </Card>

      {/* My Requests Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={myRequests}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} requests`
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No expense requests yet"
              />
            )
          }}
        />
      </Card>

      {/* Expense Request Modal */}
      <ExpenseRequestForm
        visible={expenseRequestModalVisible}
        onCancel={() => setExpenseRequestModalVisible(false)}
        onSuccess={handleExpenseRequestSuccess}
      />
    </div>
  );
};

export default RequestsPage;

