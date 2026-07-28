import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Job } from '../../types/api';
import type { User } from '../../types/api';

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
        (err?.details?.error as string) ?? err?.message ?? 'Failed to update job.',
      );
    },
  });

  const handleSubmit = () => {
    const types = goodsTypesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (types.length === 0) {
      Alert.alert('Validation', 'Enter at least one goods type (comma-separated).');
      return;
    }
    updateMutation.mutate({
      ...(assignedToId ? { assignedToId } : {}),
      goodsTypes: types,
      ...(jobDescription.trim() ? { jobDescription: jobDescription.trim() } : {}),
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4">
          <Text className="text-sm text-gray-500">Job</Text>
          <Text className="text-base font-medium text-gray-900">
            {job.trackingId} · {job.customer?.name}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Assigned to</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
            {users.map((u) => (
              <TouchableOpacity
                key={u.id}
                onPress={() => setAssignedToId(u.id)}
                className={`px-3 py-2 mx-1 rounded-lg ${
                  assignedToId === u.id ? 'bg-black' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    assignedToId === u.id ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {u.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Goods types * (comma-separated)</Text>
          <TextInput
            value={goodsTypesStr}
            onChangeText={setGoodsTypesStr}
            placeholder="e.g. General, Electronics"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">Description (optional)</Text>
          <TextInput
            value={jobDescription}
            onChangeText={setJobDescription}
            placeholder="Job description"
            multiline
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
            <Text className="text-white font-semibold text-sm">Save changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
