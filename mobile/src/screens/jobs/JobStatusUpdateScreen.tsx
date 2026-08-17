import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SelectField } from '../../components/SelectField';
import { useTheme } from '../../context/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { useAuth } from '../../context/AuthContext';
import {
  addToStringList,
  loadStringList,
  TERMINAL_NAMES_CONFIG_KEY,
} from '../../api/configLists';
import { controlHeight } from '../../theme/inputs';

const STATUS_HIERARCHY: Record<string, number> = {
  NEW: 1,
  PREINVOICED: 2,
  INVOICED: 3,
  VETTED: 4,
  ENTRY_COMPLETED: 5,
  DUTY_PAID: 6,
  READY_FOR_RELEASE: 7,
  RELEASED: 8,
  CLEARED: 9,
  DELIVERED: 10,
};

const ALL_STATUSES = Object.keys(STATUS_HIERARCHY);

type StatusOption = string;

function isRevertTransition(currentStatus: string | undefined, next: string) {
  if (!currentStatus) return false;
  const currentLevel = STATUS_HIERARCHY[currentStatus];
  const nextLevel = STATUS_HIERARCHY[next];
  return Boolean(currentLevel && nextLevel && nextLevel < currentLevel);
}

function getAvailableStatuses(currentStatus: string | undefined, allowRevert: boolean) {
  if (!currentStatus || !STATUS_HIERARCHY[currentStatus]) {
    return ALL_STATUSES.filter((s) => s !== 'NEW');
  }
  const currentLevel = STATUS_HIERARCHY[currentStatus];
  const forward = ALL_STATUSES.filter((status) => {
    if (status === currentStatus) return false;
    if (status === 'DELIVERED') return currentStatus === 'CLEARED';
    return STATUS_HIERARCHY[status] > currentLevel;
  });
  if (!allowRevert) return forward;
  const backward = ALL_STATUSES
    .filter((status) => STATUS_HIERARCHY[status] < currentLevel)
    .sort((a, b) => STATUS_HIERARCHY[b] - STATUS_HIERARCHY[a]);
  return [...forward, ...backward];
}

const DEFAULT_TERMINALS = ['Golden Jubilee', 'MPS', 'TBT', 'Terminal 2'];
const TERMINAL_META = {
  category: 'JOBS',
  description: 'Available terminal names for RELEASED status',
};

export const JobStatusUpdateScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const jobId = route.params?.jobId;
  const { hasRole } = useAuth();
  const canRevertStatus = hasRole(['ADMIN', 'IT_CONSULTANT']);
  const queryClient = useQueryClient();
  const { accent } = useTheme();
  const [currentStatus, setCurrentStatus] = useState<string | undefined>(
    route.params?.currentStatus,
  );
  const [status, setStatus] = useState<StatusOption | ''>('');
  const [comment, setComment] = useState('');
  // VETTED
  const [shipperName, setShipperName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  // ENTRY_COMPLETED
  const [boeNumber, setBoeNumber] = useState('');
  // RELEASED
  const [demurrageFreeDays, setDemurrageFreeDays] = useState('');
  const [releaseMoneyReceived, setReleaseMoneyReceived] = useState<boolean | null>(null);
  const [terminalName, setTerminalName] = useState<string | null>(null);
  const [terminalOptions, setTerminalOptions] =
    useState<string[]>(DEFAULT_TERMINALS);
  const [customTerminalOpen, setCustomTerminalOpen] = useState(false);
  const [customTerminalValue, setCustomTerminalValue] = useState('');
  const [customTerminalSaving, setCustomTerminalSaving] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await loadStringList(
          TERMINAL_NAMES_CONFIG_KEY,
          DEFAULT_TERMINALS,
          TERMINAL_META,
        );
        if (!cancelled) setTerminalOptions(list);
      } catch {
        if (!cancelled) setTerminalOptions(DEFAULT_TERMINALS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!jobId || currentStatus) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await api.get<{ job: { status?: string } }>(`/jobs/${jobId}`);
        if (!cancelled && data?.job?.status) {
          setCurrentStatus(data.job.status);
        }
      } catch {
        // keep route param / empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, currentStatus]);

  const availableStatuses = useMemo(
    () => getAvailableStatuses(currentStatus, canRevertStatus),
    [currentStatus, canRevertStatus],
  );
  const reverting = Boolean(status && isRevertTransition(currentStatus, status));

  const terminalSelectOptions = useMemo(
    () => [
      ...terminalOptions.map((t) => ({ value: t, label: t })),
      { value: '__other__', label: 'Other (Add Custom)' },
    ],
    [terminalOptions],
  );

  const onTerminalChange = (value: string) => {
    if (value === '__other__') {
      setCustomTerminalValue('');
      setCustomTerminalOpen(true);
      return;
    }
    setTerminalName(value);
  };

  const applyCustomTerminal = async () => {
    const trimmed = customTerminalValue.trim();
    if (!trimmed) {
      setCustomTerminalOpen(false);
      return;
    }
    setCustomTerminalSaving(true);
    try {
      const { list, value, created } = await addToStringList(
        TERMINAL_NAMES_CONFIG_KEY,
        trimmed,
        DEFAULT_TERMINALS,
        TERMINAL_META,
      );
      setTerminalOptions(list);
      setTerminalName(value);
      setCustomTerminalOpen(false);
      setCustomTerminalValue('');
      if (!created) {
        Alert.alert('Already exists', `"${value}" is already in the list.`);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save terminal name.');
    } finally {
      setCustomTerminalSaving(false);
    }
  };

  const submit = async () => {
    if (!status) {
      setError('Select a status');
      return;
    }

    if (reverting && !comment.trim()) {
      setError('A comment is required when reverting job status.');
      return;
    }

    if (!reverting && status === 'VETTED') {
      if (!shipperName.trim() || !invoiceNumber.trim()) {
        setError('Shipper name and invoice number are required for VETTED.');
        return;
      }
    }
    if (!reverting && status === 'ENTRY_COMPLETED') {
      const boe = boeNumber.trim();
      if (!/^\d{11}$/.test(boe)) {
        setError('BoE number must be exactly 11 digits for ENTRY_COMPLETED.');
        return;
      }
    }
    if (!reverting && status === 'RELEASED') {
      const days = parseInt(demurrageFreeDays, 10);
      if (
        Number.isNaN(days) ||
        days < 0 ||
        releaseMoneyReceived == null ||
        !terminalName?.trim() ||
        !scheduleTime.trim() ||
        !driverName.trim() ||
        !driverContact.trim()
      ) {
        setError(
          'Terminal, schedule time, driver name/contact, demurrage/free days, and release money status are required for RELEASED.',
        );
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        status,
        ...(comment.trim() && { comment: comment.trim() }),
      };
      if (!reverting && status === 'VETTED') {
        payload.shipperName = shipperName.trim();
        payload.invoiceNumber = invoiceNumber.trim();
      }
      if (!reverting && status === 'ENTRY_COMPLETED') {
        payload.boeNumber = boeNumber.trim();
      }
      if (!reverting && status === 'RELEASED') {
        payload.demurrageFreeDays = parseInt(demurrageFreeDays, 10);
        payload.releaseMoneyReceived = releaseMoneyReceived;
        payload.terminalName = terminalName!.trim();
        payload.scheduleTime = scheduleTime.trim();
        payload.driverName = driverName.trim();
        payload.driverContact = driverContact.trim();

        // Ensure terminal stays in the shared list
        try {
          const { list } = await addToStringList(
            TERMINAL_NAMES_CONFIG_KEY,
            terminalName!.trim(),
            DEFAULT_TERMINALS,
            TERMINAL_META,
          );
          setTerminalOptions(list);
        } catch {
          // non-blocking
        }
      }

      await api.put(`/jobs/${jobId}/status`, payload);
      await queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-recent-jobs'] });
      navigation.goBack();
    } catch (e: any) {
      setError(
        (e?.details?.error as string) ?? e?.message ?? 'Update failed',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Update status" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text className="text-base font-semibold mb-2">New status</Text>
        {currentStatus ? (
          <Text className="text-sm text-gray-500 mb-3">
            Current: {currentStatus.replace(/_/g, ' ')}
          </Text>
        ) : null}
        {availableStatuses.map((s) => {
          const isBack = isRevertTransition(currentStatus, s);
          return (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)}
            className={`rounded-full px-4 py-3 mb-2 border ${
              status === s ? '' : 'border-gray-200'
            }`}
            style={
              status === s
                ? { backgroundColor: accent, borderColor: accent }
                : undefined
            }
          >
            <Text className={status === s ? 'text-white font-semibold' : 'text-gray-800'}>
              {s.replace(/_/g, ' ')}{isBack ? ' (Revert)' : ''}
            </Text>
          </TouchableOpacity>
          );
        })}

        {!reverting && status === 'VETTED' && (
          <View className="mt-4 mb-2">
            <Text className="text-sm font-semibold mb-2">Required for VETTED</Text>
            <Text className="text-xs text-gray-600 mb-1">Shipper name *</Text>
            <Input
              value={shipperName}
              onChangeText={setShipperName}
              placeholder="Shipper name"
              className="mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Invoice number *</Text>
            <Input
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholder="Invoice number"
            />
          </View>
        )}

        {!reverting && status === 'ENTRY_COMPLETED' && (
          <View className="mt-4 mb-2">
            <Text className="text-sm font-semibold mb-2">Required for ENTRY_COMPLETED</Text>
            <Text className="text-xs text-gray-600 mb-1">BoE number (11 digits) *</Text>
            <Input
              value={boeNumber}
              onChangeText={setBoeNumber}
              placeholder="12345678901"
              keyboardType="number-pad"
              maxLength={11}
            />
          </View>
        )}

        {!reverting && status === 'RELEASED' && (
          <View className="mt-4 mb-2">
            <Text className="text-sm font-semibold mb-2">Required for RELEASED</Text>
            <SelectField
              label="Terminal name *"
              placeholder="Select terminal"
              value={terminalName}
              options={terminalSelectOptions}
              onChange={onTerminalChange}
            />
            <Text className="text-xs text-gray-600 mb-1 mt-3">Schedule time *</Text>
            <Input
              value={scheduleTime}
              onChangeText={setScheduleTime}
              placeholder="YYYY-MM-DDTHH:mm"
              className="mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Driver name *</Text>
            <Input
              value={driverName}
              onChangeText={setDriverName}
              placeholder="Driver name"
              className="mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Driver contact *</Text>
            <Input
              value={driverContact}
              onChangeText={setDriverContact}
              placeholder="+233..."
              keyboardType="phone-pad"
              className="mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Demurrage / free days *</Text>
            <Input
              value={demurrageFreeDays}
              onChangeText={setDemurrageFreeDays}
              placeholder="0"
              keyboardType="number-pad"
              className="mb-3"
            />
            <Text className="text-xs text-gray-600 mb-2">Release money received *</Text>
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity
                onPress={() => setReleaseMoneyReceived(true)}
                className={`flex-1 rounded-xl h-[52px] items-center justify-center border ${
                  releaseMoneyReceived === true ? '' : 'border-gray-300'
                }`}
                style={
                  releaseMoneyReceived === true
                    ? { backgroundColor: accent, borderColor: accent }
                    : undefined
                }
              >
                <Text
                  className={
                    releaseMoneyReceived === true
                      ? 'text-white font-semibold text-[17px]'
                      : 'text-gray-800 text-[17px]'
                  }
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setReleaseMoneyReceived(false)}
                className={`flex-1 rounded-xl h-[52px] items-center justify-center border ${
                  releaseMoneyReceived === false ? '' : 'border-gray-300'
                }`}
                style={
                  releaseMoneyReceived === false
                    ? { backgroundColor: accent, borderColor: accent }
                    : undefined
                }
              >
                <Text
                  className={
                    releaseMoneyReceived === false
                      ? 'text-white font-semibold text-[17px]'
                      : 'text-gray-800 text-[17px]'
                  }
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text className="text-xs text-gray-600 mb-1 mt-4">
          {reverting ? 'Reason for revert *' : 'Comment (optional)'}
        </Text>
        <Input
          value={comment}
          onChangeText={setComment}
          placeholder={
            reverting
              ? 'Explain why this job is being moved back'
              : 'Status comment'
          }
          multiline
          className="mb-4"
        />

        {error ? (
          <Text className="text-red-600 mb-3 text-sm">{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={submit}
          disabled={submitting}
          className="rounded-xl h-[52px] items-center justify-center"
          style={{ backgroundColor: accent, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-[17px]">Update status</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={customTerminalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomTerminalOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center px-6"
          onPress={() => !customTerminalSaving && setCustomTerminalOpen(false)}
        >
          <Pressable
            className="bg-white rounded-2xl p-5"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold text-black mb-3">
              Add custom terminal
            </Text>
            <TextInput
              value={customTerminalValue}
              onChangeText={setCustomTerminalValue}
              placeholder="Enter terminal name"
              autoFocus
              editable={!customTerminalSaving}
              className="border border-gray-300 rounded-xl px-4 text-base text-black"
              style={{ height: controlHeight }}
            />
            <Text className="text-xs text-gray-500 mt-2 mb-4">
              Saved for everyone and available in future status updates.
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 rounded-xl h-[48px] items-center justify-center border border-gray-300"
                disabled={customTerminalSaving}
                onPress={() => setCustomTerminalOpen(false)}
              >
                <Text className="text-gray-800 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl h-[48px] items-center justify-center"
                style={{ backgroundColor: accent }}
                disabled={customTerminalSaving}
                onPress={applyCustomTerminal}
              >
                {customTerminalSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};
