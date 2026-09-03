import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography
} from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import configurationService from '../../services/configurationService';
import SmsTestStatsPanel from './SmsTestStatsPanel';

const { Title, Text, Paragraph } = Typography;

const STAFF_TOGGLES = [
  { key: 'SMS_JOB_ASSIGNED', label: 'Job assigned', default: true },
  { key: 'SMS_JOB_REASSIGNED', label: 'Job reassigned', default: true },
  { key: 'SMS_STAFF_STAGE_HANDOFF', label: 'Staff stage handoff', default: true },
  { key: 'SMS_STATUS_REVERTED', label: 'Status reverted', default: true },
  { key: 'SMS_ETA_APPROACHING', label: 'ETA approaching', default: true },
  { key: 'SMS_ETA_OVERDUE', label: 'ETA overdue', default: true },
  { key: 'SMS_DEMURRAGE', label: 'Demurrage / free days at risk', default: true },
  { key: 'SMS_RELEASE_SCHEDULE_SLIPPED', label: 'Release schedule slipped', default: true },
  { key: 'SMS_STUCK_ASSIGNEE', label: 'Stuck with assignee', default: true },
  { key: 'SMS_STUCK_STATUS', label: 'Stuck in status (SLA)', default: true },
  { key: 'SMS_ESCALATION', label: 'Escalation (supervisor → admin)', default: true },
  { key: 'SMS_REASSIGN_CHURN', label: 'Reassignment churn', default: true },
  { key: 'SMS_RELEASE_MONEY', label: 'Release money not received', default: true },
  { key: 'SMS_COMMENT_ASSIGNEE', label: 'Comment to assignee (opt-in)', default: false },
  { key: 'SMS_INCLUDE_ADMIN_ON_REVERT', label: 'Include ADMIN on status revert', default: true }
];

const CUSTOMER_TOGGLES = [
  { key: 'SMS_CUSTOMER_ENTRY_COMPLETED', label: 'ENTRY_COMPLETED', default: true },
  { key: 'SMS_CUSTOMER_DUTY_PAID', label: 'DUTY_PAID', default: true },
  { key: 'SMS_CUSTOMER_READY_FOR_RELEASE', label: 'READY_FOR_RELEASE', default: true },
  { key: 'SMS_CUSTOMER_RELEASED', label: 'RELEASED', default: true },
  { key: 'SMS_CUSTOMER_CLEARED', label: 'CLEARED', default: true },
  { key: 'SMS_CUSTOMER_DELIVERED', label: 'DELIVERED', default: true },
  { key: 'SMS_CUSTOMER_CONSIGNEE_COPY', label: 'Consignee copy (RELEASED/CLEARED/DELIVERED)', default: false },
  { key: 'SMS_CUSTOMER_ETA_APPROACHING', label: 'ETA approaching → customer', default: false },
  { key: 'SMS_CUSTOMER_ETA_OVERDUE', label: 'ETA overdue → customer', default: false },
  { key: 'SMS_PAYMENT_REMINDER', label: 'Payment reminder', default: false }
];

const THRESHOLD_FIELDS = [
  { key: 'SMS_ETA_WARN_DAYS', label: 'ETA warn days (comma-separated)', type: 'string', default: '7,3' },
  { key: 'SMS_ETA_OVERDUE_REPEAT_HOURS', label: 'ETA overdue repeat (hours)', type: 'number', default: 24 },
  { key: 'SMS_STUCK_ASSIGNEE_HOURS', label: 'Stuck assignee (hours)', type: 'number', default: 24 },
  { key: 'SMS_ESCALATION_HOURS', label: 'Escalation delay (hours)', type: 'number', default: 24 },
  { key: 'SMS_REASSIGN_CHURN_COUNT', label: 'Reassign churn count / 24h', type: 'number', default: 3 },
  { key: 'SMS_RELEASE_MONEY_DELAY_HOURS', label: 'Release money delay (hours)', type: 'number', default: 2 },
  { key: 'SMS_QUIET_HOURS', label: 'Quiet hours (Africa/Accra, e.g. 21-7)', type: 'string', default: '21-7' },
  {
    key: 'SMS_STATUS_SLA_HOURS',
    label: 'Status SLA hours (JSON)',
    type: 'json',
    default: JSON.stringify(
      {
        NEW: 48,
        PREINVOICED: 48,
        INVOICED: 72,
        ENTRY_COMPLETED: 72,
        DUTY_PAID: 48,
        READY_FOR_RELEASE: 48,
        RELEASED: 48,
        CLEARED: 72
      },
      null,
      2
    )
  }
];

const META = {
  SMS_NOTIFICATIONS: {
    type: 'BOOLEAN',
    category: 'NOTIFICATIONS',
    description: 'Master switch — enable outbound SMS via MNotify'
  },
  MNOTIFY_API_KEY: {
    type: 'STRING',
    category: 'SMS',
    description: 'MNotify API key (sensitive — set via Admin SMS Settings)'
  },
  MNOTIFY_SENDER_ID: {
    type: 'STRING',
    category: 'SMS',
    description: 'MNotify sender ID (max 11 characters)'
  },
  MNOTIFY_API_URL: {
    type: 'STRING',
    category: 'SMS',
    description: 'MNotify quick SMS API URL'
  },
  ...Object.fromEntries(
    [...STAFF_TOGGLES, ...CUSTOMER_TOGGLES].map((t) => [
      t.key,
      { type: 'BOOLEAN', category: 'SMS', description: t.label }
    ])
  ),
  ...Object.fromEntries(
    THRESHOLD_FIELDS.map((t) => [
      t.key,
      {
        type: t.type === 'number' ? 'NUMBER' : t.type === 'json' ? 'JSON' : 'STRING',
        category: 'SMS',
        description: t.label
      }
    ])
  )
};

function buildDefaults() {
  const values = {
    SMS_NOTIFICATIONS: false,
    MNOTIFY_API_KEY: '',
    MNOTIFY_SENDER_ID: '',
    MNOTIFY_API_URL: 'https://api.mnotify.com/api/sms/quick'
  };
  STAFF_TOGGLES.forEach((t) => {
    values[t.key] = t.default;
  });
  CUSTOMER_TOGGLES.forEach((t) => {
    values[t.key] = t.default;
  });
  THRESHOLD_FIELDS.forEach((t) => {
    values[t.key] = t.default;
  });
  return values;
}

const SmsSettingsPanel = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const defaults = buildDefaults();
      const keys = Object.keys(defaults).filter((k) => k !== 'MNOTIFY_API_KEY');
      const loaded = { ...defaults, MNOTIFY_API_KEY: '' };
      await Promise.all(
        keys.map(async (key) => {
          try {
            const value = await configurationService.getConfigValue(key, defaults[key]);
            loaded[key] = value;
          } catch {
            // keep default
          }
        })
      );

      try {
        const apiMeta = await configurationService.getConfigMeta('MNOTIFY_API_KEY');
        setApiKeyConfigured(!!apiMeta?.isConfigured);
      } catch {
        setApiKeyConfigured(false);
      }

      // JSON field as pretty string for the form
      if (loaded.SMS_STATUS_SLA_HOURS && typeof loaded.SMS_STATUS_SLA_HOURS === 'object') {
        loaded.SMS_STATUS_SLA_HOURS = JSON.stringify(loaded.SMS_STATUS_SLA_HOURS, null, 2);
      }
      form.setFieldsValue(loaded);
    } catch (err) {
      message.error('Failed to load SMS settings');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    load();
  }, [load]);

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      await configurationService.initializeDefaults();
      message.success('Default configurations seeded (existing keys unchanged)');
      await load();
    } catch {
      message.error('Failed to seed defaults');
    } finally {
      setSeeding(false);
    }
  };

  const onSave = async (values) => {
    setSaving(true);
    try {
      let slaValue = values.SMS_STATUS_SLA_HOURS;
      if (typeof slaValue === 'string') {
        try {
          JSON.parse(slaValue);
        } catch {
          message.error('Status SLA hours must be valid JSON');
          setSaving(false);
          return;
        }
      } else if (slaValue && typeof slaValue === 'object') {
        slaValue = JSON.stringify(slaValue);
      }

      const senderId = (values.MNOTIFY_SENDER_ID || '').trim();
      if (senderId.length > 11) {
        message.error('Sender ID must be at most 11 characters');
        setSaving(false);
        return;
      }

      const configurations = Object.keys(values)
        .filter((key) => {
          // Blank API key = keep existing (do not clear)
          if (key === 'MNOTIFY_API_KEY') {
            return !!(values.MNOTIFY_API_KEY && String(values.MNOTIFY_API_KEY).trim());
          }
          return true;
        })
        .map((key) => {
          const meta = META[key] || { type: 'STRING', category: 'SMS', description: key };
          let value = values[key];
          if (key === 'SMS_STATUS_SLA_HOURS') value = slaValue;
          if (key === 'MNOTIFY_SENDER_ID') value = senderId;
          if (meta.type === 'BOOLEAN') value = !!value;
          return {
            key,
            value,
            type: meta.type,
            category: meta.category,
            description: meta.description
          };
        });

      await configurationService.saveConfigurations(configurations);
      message.success('SMS settings saved');
      await load();
    } catch {
      message.error('Failed to save SMS settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={4}>SMS Notifications (MNotify)</Title>
      <Paragraph type="secondary">
        Master switch, MNotify credentials, and per-event toggles for staff and customer SMS.
        Quiet hours apply to ETA/SLA nudges only — not assignment, reassignment, or customer
        milestones. Credentials are stored in the configurations table (Admin UI is the source of
        truth). Use Test &amp; Statistics to send a test message and review send/fail counts.
      </Paragraph>

      <Tabs
        defaultActiveKey="settings"
        items={[
          {
            key: 'settings',
            label: 'Settings',
            children: (
              <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Admin / IT Consultant only"
        description="Use SMS_DEV_MODE=true on the backend to log messages without sending. Seed defaults if toggles are missing. Enter your MNotify API key and sender ID below — GitHub secrets are optional fallback for local/dev only."
      />

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={load} disabled={loading}>
          Reload
        </Button>
        <Button onClick={seedDefaults} loading={seeding}>
          Seed missing defaults
        </Button>
      </Space>

      <Form form={form} layout="vertical" onFinish={onSave} disabled={loading}>
        <Card title="Master" style={{ marginBottom: 16 }}>
          <Form.Item
            name="SMS_NOTIFICATIONS"
            label="Enable SMS notifications"
            valuePropName="checked"
            extra="Must be ON for event SMS (jobs, ETA, customers). Admin test send still works with valid MNotify credentials."
          >
            <Switch />
          </Form.Item>
        </Card>

        <Card
          title="MNotify credentials"
          style={{ marginBottom: 16 }}
          extra={
            apiKeyConfigured ? (
              <Tag color="success">API key configured</Tag>
            ) : (
              <Tag>API key not set</Tag>
            )
          }
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="MNOTIFY_API_KEY"
                label="API key"
                extra={
                  apiKeyConfigured
                    ? 'Leave blank to keep the existing key. Enter a new value to replace it.'
                    : 'Paste your MNotify API key. It is stored in the database and never shown in cleartext after save.'
                }
              >
                <Input.Password
                  placeholder={apiKeyConfigured ? '•••••••• (configured)' : 'Enter MNotify API key'}
                  autoComplete="new-password"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="MNOTIFY_SENDER_ID"
                label="Sender ID"
                extra="Max 11 characters (MNotify rule). Must be an approved sender ID."
                rules={[{ max: 11, message: 'Max 11 characters' }]}
              >
                <Input maxLength={11} placeholder="e.g. CNTerminal" showCount />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="MNOTIFY_API_URL"
                label="API URL (optional)"
                extra="Defaults to MNotify quick SMS endpoint if left as the default URL."
              >
                <Input placeholder="https://api.mnotify.com/api/sms/quick" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Staff events" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            {STAFF_TOGGLES.map((t) => (
              <Col xs={24} sm={12} md={8} key={t.key}>
                <Form.Item name={t.key} label={t.label} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>

        <Card title="Customer events" style={{ marginBottom: 16 }}>
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Client ETA alerts default off. When enabled (and master SMS is on), messages go to{' '}
            <Text code>Customer.phone</Text>.
          </Paragraph>
          <Row gutter={[16, 8]}>
            {CUSTOMER_TOGGLES.map((t) => (
              <Col xs={24} sm={12} md={8} key={t.key}>
                <Form.Item name={t.key} label={t.label} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>

        <Card title="Thresholds" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            {THRESHOLD_FIELDS.filter((t) => t.type !== 'json').map((t) => (
              <Col xs={24} sm={12} md={8} key={t.key}>
                <Form.Item name={t.key} label={t.label}>
                  {t.type === 'number' ? (
                    <InputNumber min={0} style={{ width: '100%' }} />
                  ) : (
                    <Input />
                  )}
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Divider />
          <Form.Item
            name="SMS_STATUS_SLA_HOURS"
            label="Per-status SLA hours (JSON)"
            extra="Hours a job may stay in each status before stuck-status SMS"
          >
            <Input.TextArea rows={8} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </Card>

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
            Save SMS settings
          </Button>
        </Form.Item>
      </Form>
              </>
            )
          },
          {
            key: 'test-stats',
            label: 'Test & Statistics',
            children: <SmsTestStatsPanel />
          }
        ]}
      />
    </div>
  );
};

export default SmsSettingsPanel;
