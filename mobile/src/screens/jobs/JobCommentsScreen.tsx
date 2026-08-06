import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { api } from '../../api/http';
import { useJobSocket } from '../../realtime/useJobSocket';
import type { JobComment, JobCommentsResponse } from '../../types/api';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** e.g. 31/07/2026 17:30 */
function formatCommentDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 16);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export const JobCommentsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const jobId: string | undefined = route.params?.jobId;
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['job-comments', jobId],
    queryFn: () => api.get<JobCommentsResponse>(`/jobs/${jobId}/comments`),
    enabled: Boolean(jobId),
  });

  const comments = data?.comments ?? [];

  useJobSocket(
    useMemo(
      () => ({
        onJobCommentAdded: (payload: { jobId?: string }) => {
          if (payload?.jobId === jobId) {
            void queryClient.invalidateQueries({
              queryKey: ['job-comments', jobId],
            });
          }
        },
      }),
      [jobId, queryClient],
    ),
  );

  const submit = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) {
      setError('Please enter a comment');
      return;
    }
    if (!jobId) {
      setError('Missing job');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/jobs/${jobId}/comments`, { comment: trimmed });
      setNewComment('');
      await queryClient.invalidateQueries({ queryKey: ['job-comments', jobId] });
    } catch (err: any) {
      const message = err?.message ?? 'Failed to post comment';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && comments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3 text-base">Loading comments…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScreenHeader title="Comments" />
      <FlatList
        data={comments}
        keyExtractor={(item: JobComment) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 16,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <Text className="text-gray-500 text-base text-center py-8">
            No comments yet
          </Text>
        }
        renderItem={({ item }) => (
          <View className="rounded-xl border border-gray-200 px-4 py-3 mb-2">
            <Text className="text-base text-gray-800">{item.comment}</Text>
            <Text className="text-sm text-gray-500 mt-1.5">
              {item.createdBy?.name ?? 'Unknown'} ·{' '}
              {formatCommentDate(item.createdAt)}
            </Text>
          </View>
        )}
      />
      <View
        className="border-t border-gray-200 px-4 pt-3 bg-white"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Input
          value={newComment}
          onChangeText={(text) => {
            setNewComment(text);
            if (error) setError(null);
          }}
          placeholder="Add a comment…"
          className="mb-2"
          multiline
          editable={!submitting}
        />
        {error ? (
          <Text className="text-red-600 text-sm mb-2">{error}</Text>
        ) : null}
        <Button
          title="Post comment"
          loading={submitting}
          disabled={!newComment.trim()}
          onPress={submit}
        />
      </View>
    </KeyboardAvoidingView>
  );
};
