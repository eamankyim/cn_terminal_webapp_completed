import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SelectField } from '../../components/SelectField';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Job } from '../../types/api';
import type { User } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';

interface JobDetailResponse {
  job: Job & {
    jobDescription?: string;
    goodsTypes?: string[];
    assignedTo?: { id: string; name: string };
  };
}

interface UsersResponse {
  users: User[];
}

export const JobEditScreen: React.FC = () => {
  const { accent } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const jobId: string = route.params?.jobId;
  const queryClient = useQueryClient();

  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [goodsTypesStr, setGoodsTypesStr] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.get<JobDetailResponse>(`/jobs/${jobId}`),
  });
  const { data: usersData } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: () => api.get<UsersResponse>('/auth/assignable-users'),
  });

  const job = jobData?.job;
  const users = usersData?.users ?? [];

  const assigneeOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name,
        subtitle: u.email,
      })),
    [users],
  );

  useEffect(() => {
    if (job) {
      setAssignedToId(job.assignedTo?.id ?? null);
      const g = (job as any).goodsTypes;
      setGoodsTypesStr(Array.isArray(g) ? g.join(', ') : '');
      setJobDescription((job as any).jobDescription ?? '');
    }
  }, [job]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      assignedToId?: string;
      goodsTypes: string[];
      jobDescription?: string;
    }) => api.put<{ job: Job }>(`/jobs/${jobId}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      Alert.alert('Success', 'Job updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ??
          err?.message ??
          'Failed to update job.',
      );
    },
  });

  const handleSubmit = () => {
    const types = goodsTypesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (types.length === 0) {
      Alert.alert(
        'Validation',
        'Enter at least one goods type (comma-separated).',
      );
      return;
    }
    updateMutation.mutate({
      ...(assignedToId ? { assignedToId } : {}),
      goodsTypes: types,
      ...(jobDescription.trim()
        ? { jobDescription: jobDescription.trim() }
        : {}),
    });
  };

  const loading = updateMutation.isPending;

  if (isLoading || !job) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScreenHeader title="Edit job" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4">
          <Text className="text-sm text-gray-500">Job</Text>
          <Text className="text-base font-medium text-gray-900">
            {job.trackingId} · {job.customer?.name}
          </Text>
        </View>

        <View className="mb-4">
          <SelectField
            label="Assigned to"
            placeholder="Select assignee"
            value={assignedToId}
            options={assigneeOptions}
            onChange={setAssignedToId}
            emptyMessage="No assignable users"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">
            Goods types * (comma-separated)
          </Text>
          <Input
            value={goodsTypesStr}
            onChangeText={setGoodsTypesStr}
            placeholder="e.g. General, Electronics"
            editable={!loading}
          />
        </View>
        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">
            Description (optional)
          </Text>
          <Input
            value={jobDescription}
            onChangeText={setJobDescription}
            placeholder="Job description"
            multiline
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
            <Text className="text-white font-semibold text-[17px]">
              Save changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
