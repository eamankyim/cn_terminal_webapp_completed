import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import * as DocumentPicker from 'expo-document-picker';
import { Input } from '../../components/Input';
import { DateField } from '../../components/DateField';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { SelectField } from '../../components/SelectField';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Job } from '../../types/api';
import type { Customer, CustomersListResponse } from '../../types/api';
import type { Consignment } from '../../types/api';
import type { User } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';
import { controlHeight } from '../../theme/inputs';
import { Ionicons } from '@expo/vector-icons';

interface UsersResponse {
  users: User[];
}

interface ConsignmentsResponse {
  consignments?: Consignment[];
}

interface CreateJobResponse {
  job: Job;
  message?: string;
}

interface PickedDoc {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
}

const DEFAULT_GOODS_TYPES = [
  'Electronics',
  'Textiles',
  'Machinery',
  'Pharmaceuticals',
  'Food & Beverages',
  'Automotive',
  'Furniture',
  'Clothing & Accessories',
  'Books & Media',
  'Sports & Recreation',
  'Health & Beauty',
  'Tools & Hardware',
];

const DEFAULT_VESSELS = [
  'RHL Concordia',
  'MAERSK TEMA',
  'Seaspan Dalian',
  'MAERSK KARUN',
  'MAESK Cunene',
  'Hammonia Toscan',
];

const DEFAULT_LINES = ['PIL', 'SAF', 'COSCO', 'CMA', 'OOCL', 'MSK', 'ONE'];

const MEDIUM_OF_ENQUIRY = ['Email', 'Dispatch', 'VVIP', 'WhatsApp'];

const DOCUMENTS_BROUGHT = [
  'Parking list copy',
  'Parking list original',
  'Container No',
  'Copy BL',
];

type CustomField = 'goodsTypes' | 'vesselName' | 'line';

export const JobCreateScreen: React.FC = () => {
  const { accent } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'customer' | 'form'>('customer');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [consignmentId, setConsignmentId] = useState<string | null>(null);
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [goodsTypes, setGoodsTypes] = useState<string[]>([]);
  const [goodsTypeOptions, setGoodsTypeOptions] =
    useState<string[]>(DEFAULT_GOODS_TYPES);
  const [eta, setEta] = useState<string | null>(null);
  const [mediumOfEnquiry, setMediumOfEnquiry] = useState<string | null>(null);
  const [documentsBrought, setDocumentsBrought] = useState<string[]>([]);
  const [containerNumber, setContainerNumber] = useState('');
  const [blNumber, setBlNumber] = useState('');
  const [vesselName, setVesselName] = useState<string | null>(null);
  const [vesselOptions, setVesselOptions] = useState<string[]>(DEFAULT_VESSELS);
  const [line, setLine] = useState<string | null>(null);
  const [lineOptions, setLineOptions] = useState<string[]>(DEFAULT_LINES);
  const [jobDescription, setJobDescription] = useState('');
  const [documents, setDocuments] = useState<PickedDoc[]>([]);
  /** Which footer action is in flight — only that button shows a spinner. */
  const [submitting, setSubmitting] = useState<null | 'draft' | 'submit'>(
    null,
  );
  const [customerSearch, setCustomerSearch] = useState('');
  const isBusy = submitting !== null;

  const [customOpen, setCustomOpen] = useState(false);
  const [customField, setCustomField] = useState<CustomField | null>(null);
  const [customValue, setCustomValue] = useState('');

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () =>
      api.get<CustomersListResponse>('/customers?page=1&limit=100'),
  });
  const { data: usersData } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: () => api.get<UsersResponse>('/auth/assignable-users'),
  });
  const {
    data: consignmentsData,
    isLoading: consignmentsLoading,
  } = useQuery({
    queryKey: ['customer-consignments', customerId],
    queryFn: () =>
      api.get<ConsignmentsResponse | Consignment[]>(
        `/consignments/customer/${customerId}`,
      ),
    enabled: Boolean(customerId),
  });

  const customers = customersData?.customers ?? [];
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = `${c.name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [customers, customerSearch]);
  const users = usersData?.users ?? [];
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const consignments: Consignment[] = useMemo(() => {
    if (!consignmentsData) return [];
    if (Array.isArray(consignmentsData)) return consignmentsData;
    return consignmentsData.consignments ?? [];
  }, [consignmentsData]);

  const assigneeOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name,
        subtitle: u.email,
      })),
    [users],
  );

  const consigneeOptions = useMemo(
    () => [
      {
        value: null as string | null,
        label: 'N/A',
        subtitle: 'Not Available (Add Later)',
      },
      ...consignments.map((c) => ({
        value: c.id as string | null,
        label: `${c.trackingId} - ${c.consigneeName ?? 'Unnamed'}`,
        subtitle: c.status,
      })),
    ],
    [consignments],
  );

  const goodsTypeSelectOptions = useMemo(
    () => [
      ...goodsTypeOptions.map((t) => ({ value: t, label: t })),
      { value: '__other__', label: 'Other (Add Custom)' },
    ],
    [goodsTypeOptions],
  );

  const vesselSelectOptions = useMemo(
    () => [
      ...vesselOptions.map((v) => ({ value: v, label: v })),
      { value: '__other__', label: 'Other (Add Custom)' },
    ],
    [vesselOptions],
  );

  const lineSelectOptions = useMemo(
    () => [
      ...lineOptions.map((l) => ({ value: l, label: l })),
      { value: '__other__', label: 'Other (Add Custom)' },
    ],
    [lineOptions],
  );

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<CreateJobResponse>('/jobs', payload),
  });

  const selectCustomer = (id: string) => {
    setCustomerId(id);
    setConsignmentId(null);
    setStep('form');
  };

  const openCustomModal = (field: CustomField) => {
    setCustomField(field);
    setCustomValue('');
    setCustomOpen(true);
  };

  const applyCustomValue = () => {
    const trimmed = customValue.trim();
    if (!trimmed || !customField) {
      setCustomOpen(false);
      return;
    }
    if (customField === 'goodsTypes') {
      setGoodsTypeOptions((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed],
      );
      setGoodsTypes((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed],
      );
    } else if (customField === 'vesselName') {
      setVesselOptions((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed],
      );
      setVesselName(trimmed);
    } else if (customField === 'line') {
      setLineOptions((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed],
      );
      setLine(trimmed);
    }
    setCustomOpen(false);
    setCustomField(null);
    setCustomValue('');
  };

  const onGoodsTypesChange = (values: string[]) => {
    if (values.includes('__other__')) {
      setGoodsTypes(values.filter((v) => v !== '__other__'));
      openCustomModal('goodsTypes');
      return;
    }
    setGoodsTypes(values);
  };

  const onVesselChange = (value: string | null) => {
    if (value === '__other__') {
      openCustomModal('vesselName');
      return;
    }
    setVesselName(value);
  };

  const onLineChange = (value: string | null) => {
    if (value === '__other__') {
      openCustomModal('line');
      return;
    }
    setLine(value);
  };

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const picked = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
      }));
      setDocuments((prev) => {
        const next = [...prev];
        for (const doc of picked) {
          if (!next.some((d) => d.uri === doc.uri && d.name === doc.name)) {
            next.push(doc);
          }
        }
        return next.slice(0, 5);
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not pick documents.');
    }
  };

  const removeDocument = (uri: string) => {
    setDocuments((prev) => prev.filter((d) => d.uri !== uri));
  };

  const uploadDocuments = (jobId: string, docs: PickedDoc[]) =>
    Promise.all(
      docs.map((doc) => {
        const formData = new FormData();
        formData.append('folder', 'jobs');
        formData.append('category', 'job_document');
        formData.append('entityId', jobId);
        formData.append('entityType', 'job');
        formData.append('file', {
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType || 'application/octet-stream',
        } as any);
        return api.post('/files/upload', formData);
      }),
    );

  const resetForm = () => {
    setStep('customer');
    setCustomerId(null);
    setConsignmentId(null);
    setAssignedToId(null);
    setGoodsTypes([]);
    setEta(null);
    setMediumOfEnquiry(null);
    setDocumentsBrought([]);
    setContainerNumber('');
    setBlNumber('');
    setVesselName(null);
    setLine(null);
    setJobDescription('');
    setDocuments([]);
    setCustomerSearch('');
  };

  const buildPayload = (isDraft: boolean) => {
    if (!customerId || !assignedToId) {
      Alert.alert('Validation', 'Please select client and assignee.');
      return null;
    }
    if (goodsTypes.length === 0) {
      Alert.alert('Validation', 'Please select at least one goods type.');
      return null;
    }
    if (!isDraft && !eta) {
      Alert.alert('Validation', 'Please select an ETA date.');
      return null;
    }

    return {
      customerId,
      assignedToId,
      consignmentId: consignmentId || null,
      status: 'NEW',
      isDraft,
      goodsTypes,
      ...(eta ? { eta } : {}),
      ...(mediumOfEnquiry ? { mediumOfEnquiry } : {}),
      documentsBrought,
      ...(containerNumber.trim()
        ? { containerNumber: containerNumber.trim() }
        : {}),
      ...(blNumber.trim() ? { blNumber: blNumber.trim() } : {}),
      ...(vesselName ? { vesselName } : {}),
      ...(line ? { line } : {}),
      ...(jobDescription.trim()
        ? { jobDescription: jobDescription.trim() }
        : {}),
    };
  };

  const submitJob = async (isDraft: boolean) => {
    if (submitting) return;
    const payload = buildPayload(isDraft);
    if (!payload) return;

    const action = isDraft ? 'draft' : 'submit';
    const docsToUpload = [...documents];
    setSubmitting(action);
    try {
      const data = await createMutation.mutateAsync(payload);
      const jobId = data.job?.id;
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      resetForm();
      // Leave Create immediately so a second tap cannot double-submit.
      // replace removes Create from the stack (back won't return to a filled form).
      // Document uploads continue in the background — do not block navigation.
      if (jobId) {
        navigation.replace('JobDetail', { jobId });
      } else {
        navigation.navigate('JobsList');
      }
      if (jobId && docsToUpload.length > 0) {
        void uploadDocuments(jobId, docsToUpload)
          .then(() => {
            void queryClient.invalidateQueries({ queryKey: ['job', jobId] });
          })
          .catch(() => {
            Alert.alert(
              'Warning',
              'Job was saved but some documents failed to upload.',
            );
          });
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ??
          err?.message ??
          'Failed to create job.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  if (step === 'customer') {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Select Client" />
        <View className="px-4 mb-3">
          <SearchBar
            value={customerSearch}
            onChangeText={setCustomerSearch}
            placeholder="Search and select client…"
          />
        </View>
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item: Customer) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-base text-gray-500">No clients found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => selectCustomer(item.id)}
              className="mb-3 rounded-2xl border border-gray-200 px-4 py-3"
            >
              <Text className="font-semibold text-base">{item.name}</Text>
              {item.email ? (
                <Text className="text-xs text-gray-500">{item.email}</Text>
              ) : null}
              {item.phone ? (
                <Text className="text-xs text-gray-500">{item.phone}</Text>
              ) : null}
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
      <ScreenHeader title="New job" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => setStep('customer')}
          className="mb-4"
        >
          <Text className="text-sm text-gray-600 mb-1">Select Client *</Text>
          <View
            className="flex-row items-center justify-between border border-gray-300 rounded-xl px-4"
            style={{ height: controlHeight }}
          >
            <Text className="text-base text-black flex-1" numberOfLines={1}>
              {selectedCustomer?.name ?? 'Select client'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </View>
        </TouchableOpacity>

        <View className="mb-4">
          <SelectField
            label="Select Consignee"
            placeholder={
              consignmentsLoading
                ? 'Loading consignees…'
                : 'Select a consignee or N/A'
            }
            value={consignmentId}
            options={consigneeOptions}
            onChange={setConsignmentId}
            disabled={consignmentsLoading || !customerId}
            emptyMessage="No consignees for this client"
            helpText="Select 'N/A' if consignee is not available yet. You can add it later by editing the job."
          />
        </View>

        <View className="mb-4">
          <SelectField
            multi
            label="Types of Goods *"
            placeholder="Select goods types for this job"
            value={goodsTypes}
            options={goodsTypeSelectOptions}
            onChange={onGoodsTypesChange}
          />
        </View>

        <View className="mb-4">
          <SelectField
            label="Assign To *"
            placeholder="Select team member"
            value={assignedToId}
            options={assigneeOptions}
            onChange={setAssignedToId}
            emptyMessage="No team members available"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Status *</Text>
          <View
            className="flex-row items-center border border-gray-200 rounded-xl px-4 bg-gray-50"
            style={{ height: controlHeight }}
          >
            <Text className="text-base text-gray-700">New</Text>
          </View>
        </View>

        <View className="mb-4">
          <DateField
            label="ETA *"
            value={eta}
            onChange={setEta}
            placeholder="Select ETA date"
            helpText="Expected delivery date"
            disabled={isBusy}
          />
        </View>

        <View className="mb-4">
          <SelectField
            label="Medium of Enquiry Documents"
            placeholder="How were documents received?"
            value={mediumOfEnquiry}
            options={MEDIUM_OF_ENQUIRY.map((m) => ({ value: m, label: m }))}
            onChange={setMediumOfEnquiry}
          />
        </View>

        <View className="mb-4">
          <SelectField
            multi
            label="Documents Brought"
            placeholder="Select documents brought by client"
            value={documentsBrought}
            options={DOCUMENTS_BROUGHT.map((d) => ({ value: d, label: d }))}
            onChange={setDocumentsBrought}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Container Number</Text>
          <Input
            value={containerNumber}
            onChangeText={setContainerNumber}
            placeholder="Enter container number"
            editable={!isBusy}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">B/L Number</Text>
          <Input
            value={blNumber}
            onChangeText={setBlNumber}
            placeholder="Enter B/L number"
            editable={!isBusy}
            autoCapitalize="characters"
          />
        </View>

        <View className="mb-4">
          <SelectField
            label="Vessel Name"
            placeholder="Select vessel name"
            value={vesselName}
            options={vesselSelectOptions}
            onChange={onVesselChange}
          />
        </View>

        <View className="mb-4">
          <SelectField
            label="LINE"
            placeholder="Select line"
            value={line}
            options={lineSelectOptions}
            onChange={onLineChange}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Job Description</Text>
          <Input
            value={jobDescription}
            onChangeText={setJobDescription}
            placeholder="Enter detailed job description"
            multiline
            editable={!isBusy}
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">Documents</Text>
          <TouchableOpacity
            onPress={pickDocuments}
            disabled={isBusy || documents.length >= 5}
            className="flex-row items-center justify-center border border-dashed border-gray-300 rounded-xl"
            style={{ height: controlHeight }}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#666" />
            <Text className="text-base text-gray-700 ml-2">
              Upload Documents
            </Text>
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 mt-1">
            Up to 5 files. Uploaded after the job is saved.
          </Text>
          {documents.map((doc) => (
            <View
              key={`${doc.uri}-${doc.name}`}
              className="flex-row items-center justify-between mt-2 py-2 border-b border-gray-100"
            >
              <Text className="text-sm text-black flex-1 mr-2" numberOfLines={1}>
                {doc.name}
              </Text>
              <TouchableOpacity onPress={() => removeDocument(doc.uri)}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View className="flex-row" style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => void submitJob(true)}
            disabled={isBusy}
            className="flex-1 rounded-xl h-[52px] items-center justify-center border border-gray-300"
            style={isBusy && submitting !== 'draft' ? { opacity: 0.5 } : undefined}
          >
            {submitting === 'draft' ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className="text-black font-semibold text-[17px]">
                Save as Draft
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void submitJob(false)}
            disabled={isBusy}
            className="flex-1 rounded-xl h-[52px] items-center justify-center"
            style={{
              backgroundColor: accent,
              ...(isBusy && submitting !== 'submit' ? { opacity: 0.5 } : {}),
            }}
          >
            {submitting === 'submit' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-[17px]">
                Submit Job
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={customOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center px-6"
          onPress={() => setCustomOpen(false)}
        >
          <Pressable
            className="bg-white rounded-2xl p-5"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold text-black mb-3">
              Add custom{' '}
              {customField === 'goodsTypes'
                ? 'goods type'
                : customField === 'vesselName'
                  ? 'vessel name'
                  : 'line'}
            </Text>
            <TextInput
              value={customValue}
              onChangeText={setCustomValue}
              placeholder="Enter value"
              autoFocus
              className="border border-gray-300 rounded-xl px-4 text-base text-black"
              style={{ height: controlHeight }}
            />
            <View className="flex-row mt-4" style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => setCustomOpen(false)}
                className="flex-1 h-[52px] rounded-xl border border-gray-300 items-center justify-center"
              >
                <Text className="font-semibold text-[17px]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyCustomValue}
                className="flex-1 h-[52px] rounded-xl items-center justify-center"
                style={{ backgroundColor: accent }}
              >
                <Text className="text-white font-semibold text-[17px]">Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};
