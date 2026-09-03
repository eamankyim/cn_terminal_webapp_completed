import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { ReloadOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import smsService from '../../services/smsService';

const { Text } = Typography;

function sourceLabel(source) {
  if (source === 'config') return 'Admin SMS Settings';
  if (source === 'env') return 'Environment (local/dev fallback)';
  return 'Not set';
}

function statusTag(status) {
  if (status === 'sent') return <Tag color="success">sent</Tag>;
  if (status === 'failed') return <Tag color="error">failed</Tag>;
  if (status === 'skipped') return <Tag>skipped</Tag>;
  return <Tag>{status || '—'}</Tag>;
}

const SmsTestStatsPanel = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await smsService.getStats();
      if (response?.success) {
        setStats(response.data);
      } else {
        message.error(response?.message || 'Failed to load SMS statistics');
      }
    } catch (err) {
      message.error(err.message || 'Failed to load SMS statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSendTest = async (values) => {
    setSending(true);
    setTestResult(null);
    try {
      const response = await smsService.sendTestSms({
        phone: values.phone,
        message: values.message
      });
      setTestResult(response);
      if (response?.success) {
        message.success(response.message || 'Test SMS sent');
      } else {
        message.error(response?.message || 'Test SMS failed');
      }
      await load();
    } catch (err) {
      const payload = err.response?.data;
      setTestResult(payload || { success: false, message: err.message });
      message.error(err.message || 'Test SMS failed');
    } finally {
      setSending(false);
    }
  };

  const connection = stats?.connection || {};
  const totals = stats?.totals || {};
  const last24h = stats?.last24h || {};
  const last7d = stats?.last7d || {};

  const logColumns = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      width: 170,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—')
    },
    {
      title: 'Event',
      dataIndex: 'eventKey',
      ellipsis: true,
      render: (v) => <Text code>{v}</Text>
    },
    {
      title: 'Phone',
      dataIndex: 'phoneMasked',
      width: 140,
      render: (v) => v || '—'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: statusTag
    },
    {
      title: 'Error',
      dataIndex: 'errorMessage',
      ellipsis: true,
      render: (v) => v || '—'
    }
  ];

  const eventColumns = [
    {
      title: 'Event',
      dataIndex: 'eventKey',
      render: (v) => <Text code>{v}</Text>
    },
    { title: 'Sent', dataIndex: 'sent', width: 90 },
    { title: 'Failed', dataIndex: 'failed', width: 90 },
    { title: 'Skipped', dataIndex: 'skipped', width: 90 },
    { title: 'Total', dataIndex: 'total', width: 90 }
  ];

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Test send ignores event toggles and the master SMS switch"
        description="A test still needs a valid MNotify API key. Results are written to the dispatch log as SMS_TEST. Phone numbers are stored normalized (233…) and shown masked here."
      />

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={load} disabled={loading}>
          Refresh statistics
        </Button>
      </Space>

      <Card title="MNotify status" loading={loading} style={{ marginBottom: 16 }}>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="API key">
            {connection.apiKeyConfigured ? (
              <Tag color="success">Configured ({sourceLabel(connection.apiKeySource)})</Tag>
            ) : (
              <Tag color="error">Not configured</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Sender ID">
            {connection.senderId || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="API URL" span={2}>
            {connection.apiUrl || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Master SMS">
            {connection.masterEnabled ? <Tag color="success">ON</Tag> : <Tag>OFF</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Dev mode">
            {connection.devMode ? <Tag>SMS_DEV_MODE</Tag> : <Tag>Live send</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Last successful send">
            {connection.lastSuccessAt
              ? `${dayjs(connection.lastSuccessAt).format('YYYY-MM-DD HH:mm')} (${connection.lastSuccessEventKey || 'n/a'})`
              : 'None yet'}
          </Descriptions.Item>
          <Descriptions.Item label="Last error">
            {connection.lastErrorAt ? (
              <Text type="danger">
                {dayjs(connection.lastErrorAt).format('YYYY-MM-DD HH:mm')}
                {connection.lastErrorEventKey ? ` · ${connection.lastErrorEventKey}` : ''}
                {connection.lastErrorMessage ? ` — ${connection.lastErrorMessage}` : ''}
              </Text>
            ) : (
              'None'
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Send test SMS" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={onSendTest}>
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Enter a Ghana mobile number' }]}
                extra="Accepts 0XXXXXXXXX, 233XXXXXXXXX, or 9-digit local"
              >
                <Input placeholder="e.g. 0241234567" />
              </Form.Item>
            </Col>
            <Col xs={24} md={14}>
              <Form.Item
                name="message"
                label="Message (optional)"
                extra="Defaults to “CN Terminal SMS test”. Max 160 characters (same as production)."
              >
                <Input.TextArea rows={2} maxLength={160} showCount placeholder="CN Terminal SMS test" />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending}>
            Send test SMS
          </Button>
        </Form>
        {testResult && (
          <Alert
            style={{ marginTop: 16 }}
            type={testResult.success ? 'success' : 'error'}
            showIcon
            message={testResult.message || (testResult.success ? 'Sent' : 'Failed')}
            description={
              testResult.data ? (
                <div>
                  {testResult.data.phoneMasked && (
                    <div>
                      To: {testResult.data.phoneMasked}
                      {testResult.data.phoneNumber ? ` (${testResult.data.phoneNumber})` : ''}
                    </div>
                  )}
                  {testResult.data.messageId && <div>Message ID: {testResult.data.messageId}</div>}
                  {testResult.data.devMode && <div>SMS_DEV_MODE — not sent to MNotify</div>}
                  {testResult.data.reason && !testResult.success && (
                    <div>Reason: {testResult.data.reason}</div>
                  )}
                  {testResult.data.providerResponse && (
                    <div>Provider: {String(testResult.data.providerResponse)}</div>
                  )}
                </div>
              ) : null
            }
          />
        )}
      </Card>

      <Card title="Statistics" loading={loading} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small" title="All time">
              <Row>
                <Col span={8}>
                  <Statistic title="Sent" value={totals.sent || 0} />
                </Col>
                <Col span={8}>
                  <Statistic title="Failed" value={totals.failed || 0} />
                </Col>
                <Col span={8}>
                  <Statistic title="Skipped" value={totals.skipped || 0} />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" title="Last 24 hours">
              <Row>
                <Col span={8}>
                  <Statistic title="Sent" value={last24h.sent || 0} />
                </Col>
                <Col span={8}>
                  <Statistic title="Failed" value={last24h.failed || 0} />
                </Col>
                <Col span={8}>
                  <Statistic title="Skipped" value={last24h.skipped || 0} />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" title="Last 7 days">
              <Row>
                <Col span={8}>
                  <Statistic title="Sent" value={last7d.sent || 0} />
                </Col>
                <Col span={8}>
                  <Statistic title="Failed" value={last7d.failed || 0} />
                </Col>
                <Col span={8}>
                  <Statistic title="Skipped" value={last7d.skipped || 0} />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title="By event" loading={loading} style={{ marginBottom: 16 }}>
        <Table
          size="small"
          rowKey="eventKey"
          columns={eventColumns}
          dataSource={stats?.byEventKey || []}
          pagination={false}
        />
      </Card>

      <Card title="Recent failures" loading={loading} style={{ marginBottom: 16 }}>
        <Table
          size="small"
          rowKey="id"
          columns={logColumns}
          dataSource={stats?.recentFailures || []}
          pagination={false}
          locale={{ emptyText: 'No failed sends logged' }}
        />
      </Card>

      <Card title="Recent activity" loading={loading}>
        <Table
          size="small"
          rowKey="id"
          columns={[
            ...logColumns,
            {
              title: 'Preview',
              dataIndex: 'messagePreview',
              ellipsis: true,
              render: (v) => v || '—'
            }
          ]}
          dataSource={stats?.recent || []}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No SMS dispatch logs yet' }}
        />
      </Card>
    </div>
  );
};

export default SmsTestStatsPanel;
