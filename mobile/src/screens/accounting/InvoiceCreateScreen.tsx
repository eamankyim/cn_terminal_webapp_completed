import { CHARGE_FIELDS, emptyCharges, calculateInvoiceCharges } from '../../utils/invoiceCharges';
import { Field, Workflow } from '../../components/Workflow';
import { fetchAllPages } from '../../api/pagination';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { StatusBadge } from '../../components/StatusBadge';
import type { Job } from '../../types/api';
import type { Invoice } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';

interface CreateInvoiceResponse {
  invoice: Invoice;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const InvoiceCreateScreen: React.FC = () => {
  const { accent } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [charges, setCharges] = useState(emptyCharges);
  const [comments, setComments] = useState('');
  const [blAmendment, setBlAmendment] = useState('');
  const configuration = useQuery({ queryKey: ['invoice-tax-config'], queryFn: () => api.get<{ data: Record<string, { key: string; value: string }[]> }>('/configurations') });
  const taxRow = Object.values(configuration.data?.data ?? {}).flat().find(row => row.key === 'VAT_RATE');
  const vatRate = Number(taxRow?.value ?? 15);
  let calculation: ReturnType<typeof calculateInvoiceCharges> | null = null;
  try { calculation = calculateInvoiceCharges(charges, vatRate); } catch { /* Display validation at submit. */ }
  const [issueDate, setIssueDate] = useState(toDateString(new Date()));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toDateString(d);
  });
  const [showJobPicker, setShowJobPicker] = useState(true);
  const [jobSearch, setJobSearch] = useState('');

  const { data: jobsData } = useQuery({
    queryKey: ['invoice-jobs'],
    queryFn: async () => ({ jobs: await fetchAllPages<Job>('/invoices/jobs', 'jobs') }),
  });

  const jobs = jobsData?.jobs ?? [];
  const selectedJob = jobs.find((j) => j.id === jobId);

  const filteredJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => {
      const hay = `${j.customer?.name ?? ''} ${j.trackingId} ${j.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [jobs, jobSearch]);

  const createMutation = useMutation({
    mutationFn: (payload: {
      jobId: string;
      amount: number;
      issueDate: string;
      dueDate: string;
      charges: Record<string, number>;
      comments: string;
      blAmendment: string;
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
    const num = calculation?.amount ?? 0;
    if (!calculation || !Number.isFinite(num) || num <= 0) {
      Alert.alert('Validation', 'Enter a valid amount.');
      return;
    }
    if (![issueDate, dueDate].every(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d))) || dueDate < issueDate) {
      Alert.alert('Validation', 'Issue date and due date are required.');
      return;
    }
    createMutation.mutate({
      jobId,
      amount: num,
      charges: calculation.charges,
      comments: comments.trim(),
      blAmendment: blAmendment.trim(),
      issueDate,
      dueDate,
    });
  };

  const loading = createMutation.isPending || configuration.isLoading;
  if (configuration.error) return <Workflow title="Create invoice" error={configuration.error} retry={() => void configuration.refetch()} />;

  if (showJobPicker) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Create invoice" />
        <View className="px-4 mb-3">
          <Text className="text-gray-500 text-sm mb-2">
            Invoices are linked to a job. Choose the job for this invoice.
          </Text>
          <SearchBar
            value={jobSearch}
            onChangeText={setJobSearch}
            placeholder="Search jobs…"
          />
        </View>
        <FlatList
          data={filteredJobs}
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
              <View className="flex-row items-center mt-1" style={{ gap: 8 }}>
                <Text className="text-xs text-gray-500">{item.trackingId}</Text>
                <StatusBadge label={item.status} />
              </View>
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
      <ScreenHeader title="Create invoice" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
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

        <View style={{ gap: 12, marginBottom: 16 }}>
          {CHARGE_FIELDS.map(([key, label]) => <Field key={key} label={`${label} (GHS)`} value={charges[key]} onChangeText={value => setCharges(current => ({ ...current, [key]: value }))} keyboardType="decimal-pad" editable={!loading} />)}
          <Text>VAT ({vatRate}%): GHS {calculation?.charges.vat.toFixed(2) ?? '—'}</Text>
          <Text className="text-lg font-semibold">Total: GHS {calculation?.amount.toFixed(2) ?? '—'}</Text>
          <Field label="B/L amendment" value={blAmendment} onChangeText={setBlAmendment} />
          <Field label="Comments" value={comments} onChangeText={setComments} multiline />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Issue date *</Text>
          <Input
            value={issueDate}
            onChangeText={setIssueDate}
            placeholder="YYYY-MM-DD"
            editable={!loading}
          />
        </View>
        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">Due date *</Text>
          <Input
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="rounded-xl h-[52px] items-center justify-center"
          style={{ backgroundColor: accent }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-[17px]">Create invoice</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
