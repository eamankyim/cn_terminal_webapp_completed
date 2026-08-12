import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SelectField } from '../../components/SelectField';
import { api } from '../../api/http';
import type { Job, User } from '../../types/api';

interface JobDetailResponse {
  job: Job & {
    assignedTo?: { id: string; name: string };
  };
}

interface UsersResponse {
  users: User[];
}

interface ReassignResponse {
  message: string;
  job: Job;
}

export const JobReassignScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const jobId: string = route.params?.jobId;
  const queryClient = useQueryClient();

  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.get<JobDetailResponse>(`/jobs/${jobId}`),
    enabled: Boolean(jobId),
  });

  const { data: usersData } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: () => api.get<UsersResponse>('/auth/assignable-users'),
  });

  const job = jobData?.job;
  const users = usersData?.users ?? [];

  const assigneeOptions = useMemo(
    () =>
      users
        .filter((u) => u.id !== job?.assignedTo?.id)
        .map((u) => ({
          value: u.id,
          label: u.name,
          subtitle: u.email,
        })),
    [users, job?.assignedTo?.id],
  );

  const reassignMutation = useMutation({
    mutationFn: (payload: { assignedToId: string; comment: string }) =>
      api.post<ReassignResponse>(`/jobs/${jobId}/reassign`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['job-comments', jobId] });
      Alert.alert('Success', 'Job reassigned successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ??
          err?.message ??
          'Failed to reassign job.',
      );
    },
  });

  const handleSubmit = () => {
    if (!assignedToId) {
      Alert.alert('Validation', 'Please select a team member.');
      return;
    }
    const trimmed = comment.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Please add a comment for this reassignment.');
      return;
    }
    reassignMutation.mutate({ assignedToId, comment: trimmed });
  };

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
      <ScreenHeader title="Reassign job" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-base text-gray-600 mb-1">
          Job {job.trackingId}
        </Text>
        <Text className="text-base text-black mb-4">
          Currently assigned to: {job.assignedTo?.name ?? 'Unassigned'}
        </Text>
        <Text className="text-sm text-gray-500 mb-5">
          Status will not change. A comment is required to record why the job
          is being reassigned.
        </Text>

        <SelectField
          label="Assign to"
          placeholder="Select team member"
          options={assigneeOptions}
          value={assignedToId}
          onChange={setAssignedToId}
          emptyMessage="No assignable team members"
        />

        <View className="mt-4 mb-6">
          <Text className="text-sm text-gray-600 mb-1">Comment *</Text>
          <Input
            placeholder="Explain why this job is being reassigned…"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            style={{ minHeight: 100 }}
          />
        </View>

        <View className="mb-8">
          <Button
            title="Reassign"
            onPress={handleSubmit}
            loading={reassignMutation.isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
