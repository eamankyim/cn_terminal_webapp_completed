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
  Empty,
  Drawer,
  Descriptions,
  Divider
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
import { useNavigate } from 'react-router-dom';
import ExpenseRequestForm from '../components/accounting/ExpenseRequestForm';
import expenseService from '../services/expenseService';
import { useAuth } from '../contexts/AuthContext';
import PermissionGate from '../components/common/PermissionGate';
import { PERMISSIONS } from '../utils/permissions';
import ResponsiveTable from '../components/common/ResponsiveTable';
import DocumentPreviewModal from '../components/common/DocumentPreviewModal';

const { Title, Text } = Typography;

const RequestsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Route guard: Redirect admin, accountant, and IT consultant users since they don't send requests
  useEffect(() => {
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'ACCOUNTANT' || currentUser?.role === 'IT_CONSULTANT') {
      message.info('Admins and accounting staff manage expenses in the Accounting section');
      navigate('/accounting');
      return;
    }
  }, [currentUser, navigate]);

  const [expenseRequestModalVisible, setExpenseRequestModalVisible] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const expenseStatuses = expenseService.getExpenseStatuses();

  useEffect(() => {
    loadMyRequests();
    loadMyStats();
  }, []);

  const loadMyRequests = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getMyExpenseRequests({
        limit: 50
      });
      setMyRequests(response.requests || []);
    } catch (error) {

      message.error('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  const loadMyStats = async () => {
    try {
      const response = await expenseService.getMyExpenseStats();
      setStats(response);
    } catch (error) {

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
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
      ),
    },
  ];

  const handleViewDetails = (record) => {
    setSelectedRequest(record);
    setDetailsDrawerVisible(true);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2}>
              <FileTextOutlined /> My Requests
            </Title>
            <p>Submit and track your expense requests</p>
          </div>
          
          <div style={{ marginTop: 8 }}>
            <PermissionGate 
              userRole={currentUser?.role} 
              userPermissions={currentUser?.permissions}
              permissions={PERMISSIONS.EXPENSE_REQUEST}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setExpenseRequestModalVisible(true)}
              >
                New Expense Request
              </Button>
            </PermissionGate>
          </div>
        </div>
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

      {/* My Requests Table */}
      <Card>
        <ResponsiveTable
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
          mobileConfig={{
            primaryFields: ['amount', 'description', 'status'],
            secondaryFields: ['date', 'job']
          }}
          onRowClick={(record) => handleViewDetails(record)}
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

      {/* Request Details Drawer */}
      <Drawer
        title="Request Details"
        placement="right"
        width={600}
        open={detailsDrawerVisible}
        onClose={() => setDetailsDrawerVisible(false)}
      >
        {selectedRequest && (
          <div>
            {/* Request Header */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space align="center">
                {getStatusIcon(selectedRequest.status)}
                <Tag color={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Tag>
                <Text strong style={{ fontSize: '18px' }}>
                  {expenseService.formatExpenseAmount(selectedRequest.amount)}
                </Text>
              </Space>
            </Card>

            {/* Request Details */}
            <Descriptions
              title="Request Information"
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Description">
                <Text>{selectedRequest.description}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  {expenseService.formatExpenseAmount(selectedRequest.amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag color="blue">{selectedRequest.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Expense Date">
                <Text>{moment(selectedRequest.expenseDate).format('DD/MM/YYYY')}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Requested By">
                <Space>
                  <Text strong>{selectedRequest.requestedBy?.name}</Text>
                  <Tag color="green">{selectedRequest.requestedBy?.role}</Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Requested On">
                <Space direction="vertical" size={0}>
                  <Text>{moment(selectedRequest.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {moment(selectedRequest.createdAt).fromNow()}
                  </Text>
                </Space>
              </Descriptions.Item>
              {selectedRequest.job && (
                <Descriptions.Item label="Related Job">
                  <Space>
                    <Text strong>{selectedRequest.job.jobNumber}</Text>
                    <Text type="secondary">{selectedRequest.job.description}</Text>
                  </Space>
                </Descriptions.Item>
              )}
              {selectedRequest.receiptUrl && (
                <Descriptions.Item label="Receipt">
                  <Button
                    type="default"
                    size="small"
                    onClick={() => {
                      setPreviewFile({ url: selectedRequest.receiptUrl, originalName: 'Receipt' });
                      setPreviewVisible(true);
                    }}
                  >
                    View Receipt
                  </Button>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Approval Information */}
            {(selectedRequest.status === 'APPROVED' || selectedRequest.status === 'REJECTED') && (
              <>
                <Divider />
                <Descriptions
                  title="Approval Information"
                  bordered
                  column={1}
                  size="small"
                >
                  {selectedRequest.approvedBy && (
                    <Descriptions.Item label="Approved By">
                      <Text strong>{selectedRequest.approvedBy.name}</Text>
                      <Tag color="blue">{selectedRequest.approvedBy.role}</Tag>
                    </Descriptions.Item>
                  )}
                  {selectedRequest.approvedAt && (
                    <Descriptions.Item label="Approved On">
                      <Space direction="vertical" size={0}>
                        <Text>{moment(selectedRequest.approvedAt).format('DD/MM/YYYY HH:mm')}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {moment(selectedRequest.approvedAt).fromNow()}
                        </Text>
                      </Space>
                    </Descriptions.Item>
                  )}
                  {selectedRequest.rejectionReason && (
                    <Descriptions.Item label="Rejection Reason">
                      <Text type="danger">{selectedRequest.rejectionReason}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}

            {/* Last Updated */}
            <Divider />
            <Card size="small">
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Last Updated: {moment(selectedRequest.updatedAt).format('DD/MM/YYYY HH:mm')}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {moment(selectedRequest.updatedAt).fromNow()}
                </Text>
              </Space>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        file={previewFile}
      />
    </div>
  );
};

export default RequestsPage;

