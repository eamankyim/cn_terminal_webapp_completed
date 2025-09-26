import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  DatePicker
} from 'antd';
import {
  DollarOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  FilterOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import PermissionGate from '../common/PermissionGate';
import payoutService from '../../services/payoutService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PayoutRecordsList = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payoutRecords, setPayoutRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    dateRange: null
  });

  const payoutCategories = payoutService.getPayoutCategories();
  const payoutStatuses = payoutService.getPayoutStatuses();

  useEffect(() => {
    loadPayoutRecords();
    loadStats();
  }, [filters]);

  const loadPayoutRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 100,
        ...filters,
        startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD')
      };

      const response = await payoutService.getPayoutRecords(params);
      setPayoutRecords(response.payouts || []);
    } catch (error) {
      console.error('Error loading payout records:', error);
      message.error('Failed to load payout records');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await payoutService.getPayoutStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading payout stats:', error);
    }
  };

  const handleViewDetails = async (record) => {
    try {
      const response = await payoutService.getPayoutRecord(record.id);
      setSelectedRecord(response);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Failed to load payout details');
    }
  };

  const getStatusConfig = (status) => {
    const statusConfig = payoutStatuses.find(s => s.value === status);
    return statusConfig || { color: 'default', label: status };
  };

  const getCategoryConfig = (category) => {
    const categoryConfig = payoutCategories.find(c => c.value === category);
    return categoryConfig || { color: 'default', label: category };
  };

  const columns = [
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => (
        <Text strong>{payoutService.formatPayoutAmount(amount)}</Text>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Recipient',
      dataIndex: 'payee',
      key: 'payee',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.purpose}
          </Text>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const config = getCategoryConfig(category);
        return (
          <Tag color={config.color}>
            {config.label}
          </Tag>
        );
      },
      filters: payoutCategories.map(cat => ({
        text: cat.label,
        value: cat.value
      })),
      onFilter: (value, record) => record.category === value
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 130,
      render: (method) => (
        <Tag color="blue">{method.replace('_', ' ')}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = getStatusConfig(status);
        return (
          <Tag color={config.color}>
            {config.label}
          </Tag>
        );
      },
      filters: payoutStatuses.map(status => ({
        text: status.label,
        value: status.value
      })),
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date) => (
        <Text>{moment(date).format('DD/MM/YYYY')}</Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={stats.totalAmount || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => payoutService.formatPayoutAmount(value)}
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
              title="Approved"
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
          <Col span={6}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%' }}
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              {payoutStatuses.map(status => (
                <Select.Option key={status.value} value={status.value}>
                  {status.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="Filter by Category"
              style={{ width: '100%' }}
              allowClear
              value={filters.category}
              onChange={(value) => setFilters({ ...filters, category: value })}
            >
              {payoutCategories.map(category => (
                <Select.Option key={category.value} value={category.value}>
                  {category.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Col>
          <Col span={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadPayoutRecords}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Payout Records Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={payoutRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            total: payoutRecords.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} payout records`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Payout Details Modal */}
      <Modal
        title="Payout Record Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedRecord && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Amount:</Text>
              </Col>
              <Col span={12}>
                <Text>{payoutService.formatPayoutAmount(selectedRecord.amount)}</Text>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Text strong>Recipient:</Text>
              </Col>
              <Col span={12}>
                <Text>{selectedRecord.payee}</Text>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Text strong>Category:</Text>
              </Col>
              <Col span={12}>
                <Tag color={getCategoryConfig(selectedRecord.category).color}>
                  {getCategoryConfig(selectedRecord.category).label}
                </Tag>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Text strong>Payment Method:</Text>
              </Col>
              <Col span={12}>
                <Text>{selectedRecord.paymentMethod}</Text>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Text strong>Status:</Text>
              </Col>
              <Col span={12}>
                <Tag color={getStatusConfig(selectedRecord.status).color}>
                  {getStatusConfig(selectedRecord.status).label}
                </Tag>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Text strong>Payment Date:</Text>
              </Col>
              <Col span={12}>
                <Text>{moment(selectedRecord.paymentDate).format('DD/MM/YYYY')}</Text>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Text strong>Purpose:</Text>
              </Col>
              <Col span={12}>
                <Text>{selectedRecord.purpose}</Text>
              </Col>
            </Row>
            {selectedRecord.jobId && (
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Text strong>Related Job:</Text>
                </Col>
                <Col span={12}>
                  <Text>{selectedRecord.jobId}</Text>
                </Col>
              </Row>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default PayoutRecordsList;
