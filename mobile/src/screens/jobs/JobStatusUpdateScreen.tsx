import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';

const STATUS_OPTIONS = [
  'PREINVOICED',
  'VETTED',
  'ENTRY_COMPLETED',
  'DUTY_PAID',
  'READY_FOR_RELEASE',
  'RELEASED',
  'CLEARED',
  'DELIVERED',
] as const;

type StatusOption = (typeof STATUS_OPTIONS)[number];

export const JobStatusUpdateScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const jobId = route.params?.jobId;
  const queryClient = useQueryClient();
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
  const [terminalName, setTerminalName] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!status) {
      setError('Select a status');
      return;
    }

    if (status === 'VETTED') {
      if (!shipperName.trim() || !invoiceNumber.trim()) {
        setError('Shipper name and invoice number are required for VETTED.');
        return;
      }
    }
    if (status === 'ENTRY_COMPLETED') {
      const boe = boeNumber.trim();
      if (!/^\d{11}$/.test(boe)) {
        setError('BoE number must be exactly 11 digits for ENTRY_COMPLETED.');
        return;
      }
    }
    if (status === 'RELEASED') {
      const days = parseInt(demurrageFreeDays, 10);
      if (
        Number.isNaN(days) ||
        days < 0 ||
        releaseMoneyReceived == null ||
        !terminalName.trim() ||
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
      if (status === 'VETTED') {
        payload.shipperName = shipperName.trim();
        payload.invoiceNumber = invoiceNumber.trim();
      }
      if (status === 'ENTRY_COMPLETED') {
        payload.boeNumber = boeNumber.trim();
      }
      if (status === 'RELEASED') {
        payload.demurrageFreeDays = parseInt(demurrageFreeDays, 10);
        payload.releaseMoneyReceived = releaseMoneyReceived;
        payload.terminalName = terminalName.trim();
        payload.scheduleTime = scheduleTime.trim();
        payload.driverName = driverName.trim();
        payload.driverContact = driverContact.trim();
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
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text className="text-base font-semibold mb-2">New status</Text>
        {STATUS_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)}
            className={`rounded-lg px-4 py-3 mb-2 border ${
              status === s ? 'border-black bg-black' : 'border-gray-200'
            }`}
          >
            <Text className={status === s ? 'text-white font-semibold' : 'text-gray-800'}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}

        {status === 'VETTED' && (
          <View className="mt-4 mb-2">
            <Text className="text-sm font-semibold mb-2">Required for VETTED</Text>
            <Text className="text-xs text-gray-600 mb-1">Shipper name *</Text>
            <TextInput
              value={shipperName}
              onChangeText={setShipperName}
              placeholder="Shipper name"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Invoice number *</Text>
            <TextInput
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholder="Invoice number"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
            />
          </View>
        )}

        {status === 'ENTRY_COMPLETED' && (
          <View className="mt-4 mb-2">
            <Text className="text-sm font-semibold mb-2">Required for ENTRY_COMPLETED</Text>
            <Text className="text-xs text-gray-600 mb-1">BoE number (11 digits) *</Text>
            <TextInput
              value={boeNumber}
              onChangeText={setBoeNumber}
              placeholder="12345678901"
              keyboardType="number-pad"
              maxLength={11}
              className="border border-gray-300 rounded-lg px-3 py-3 text-base"
            />
          </View>
        )}

        {status === 'RELEASED' && (
          <View className="mt-4 mb-2">
            <Text className="text-sm font-semibold mb-2">Required for RELEASED</Text>
            <Text className="text-xs text-gray-600 mb-1">Terminal name *</Text>
            <TextInput
              value={terminalName}
              onChangeText={setTerminalName}
              placeholder="Terminal"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Schedule time *</Text>
            <TextInput
              value={scheduleTime}
              onChangeText={setScheduleTime}
              placeholder="YYYY-MM-DDTHH:mm"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Driver name *</Text>
            <TextInput
              value={driverName}
              onChangeText={setDriverName}
              placeholder="Driver name"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Driver contact *</Text>
            <TextInput
              value={driverContact}
              onChangeText={setDriverContact}
              placeholder="+233..."
              keyboardType="phone-pad"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base mb-3"
            />
            <Text className="text-xs text-gray-600 mb-1">Demurrage / free days *</Text>
            <TextInput
              value={demurrageFreeDays}
              onChangeText={setDemurrageFreeDays}
              placeholder="0"
              keyboardType="number-pad"
              className="border border-gray-300 rounded-lg px-3 py-3 text-base mb-3"
            />
            <Text className="text-xs text-gray-600 mb-2">Release money received *</Text>
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity
                onPress={() => setReleaseMoneyReceived(true)}
                className={`flex-1 rounded-lg py-3 items-center border ${
                  releaseMoneyReceived === true ? 'bg-black border-black' : 'border-gray-300'
                }`}
              >
                <Text
                  className={
                    releaseMoneyReceived === true ? 'text-white font-semibold' : 'text-gray-800'
                  }
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setReleaseMoneyReceived(false)}
                className={`flex-1 rounded-lg py-3 items-center border ${
                  releaseMoneyReceived === false ? 'bg-black border-black' : 'border-gray-300'
                }`}
              >
                <Text
                  className={
                    releaseMoneyReceived === false ? 'text-white font-semibold' : 'text-gray-800'
                  }
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="mt-4 mb-4">
          <Text className="text-base font-semibold mb-2">Comment (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a note for this status change"
            className="border border-gray-300 rounded-lg px-3 py-3 text-base"
            multiline
          />
        </View>

        {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}

        <TouchableOpacity
          disabled={submitting}
          onPress={submit}
          className="bg-black rounded-lg py-3 items-center"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Update status</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
