import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Job } from '../../types/api';
import type { Invoice } from '../../types/api';

interface CreateInvoiceResponse {
  invoice: Invoice;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const InvoiceCreateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState(toDateString(new Date()));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toDateString(d);
  });
  const [showJobPicker, setShowJobPicker] = useState(true);

  const { data: jobsData } = useQuery({
    queryKey: ['invoice-jobs'],
    queryFn: () =>
      api.get<{ jobs: Job[] }>('/invoices/jobs?limit=50'),
  });

  const jobs = jobsData?.jobs ?? [];
  const selectedJob = jobs.find((j) => j.id === jobId);

  const createMutation = useMutation({
    mutationFn: (payload: {
      jobId: string;
      amount: number;
      issueDate: string;
      dueDate: string;
    }) => api.post<CreateInvoiceResponse>('/invoices', payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      Alert.alert('Success', 'Invoice created successfully.', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('InvoiceDetail', {
              invoiceId: data.invoice.id,
            }),
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ?? err?.message ?? 'Failed to create invoice.',
      );
    },
  });

  const handleSubmit = () => {
    if (!jobId) {
      Alert.alert('Validation', 'Please select a job.');
      return;
    }
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num <= 0) {
      Alert.alert('Validation', 'Enter a valid amount.');
      return;
    }
    if (!issueDate || !dueDate) {
      Alert.alert('Validation', 'Issue date and due date are required.');
      return;
    }
    createMutation.mutate({
      jobId,
      amount: num,
      issueDate,
      dueDate,
    });
  };

  const loading = createMutation.isPending;

  if (showJobPicker) {
    return (
      <View className="flex-1 bg-white">
        <View className="px-4 pt-4 pb-2">
          <Text className="text-lg font-semibold mb-2">Select job</Text>
          <Text className="text-gray-500 text-sm mb-2">
            Invoices are linked to a job. Choose the job for this invoice.
          </Text>
        </View>
        <FlatList
          data={jobs}
          keyExtractor={(item: Job) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <Text className="text-gray-500 text-sm text-center py-8">
              No invoiceable jobs found. Jobs that already have an invoice are
              excluded.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setJobId(item.id);
                setShowJobPicker(false);
              }}
              className="mb-3 rounded-2xl border border-gray-200 px-4 py-3"
            >
              <Text className="font-semibold text-base">
                {item.customer?.name ?? 'Unknown'}
              </Text>
              <Text className="text-xs text-gray-500">
                {item.trackingId} · {item.status}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6"
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => setShowJobPicker(true)}
          className="mb-4"
        >
          <Text className="text-sm text-gray-500">Job</Text>
          <Text className="text-base font-medium text-gray-900">
            {selectedJob?.customer?.name ?? 'Unknown'} · {selectedJob?.trackingId}
          </Text>
        </TouchableOpacity>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Amount (GHS) *</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Issue date *</Text>
          <TextInput
            value={issueDate}
            onChangeText={setIssueDate}
            placeholder="YYYY-MM-DD"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">Due date *</Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-black rounded-lg py-3 items-center"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-sm">Create invoice</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
