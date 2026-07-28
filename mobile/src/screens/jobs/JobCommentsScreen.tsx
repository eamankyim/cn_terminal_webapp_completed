import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: { name: string };
}

export const JobCommentsScreen: React.FC = () => {
  const route = useRoute<any>();
  const jobId = route.params?.jobId;
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['job-comments', jobId],
    queryFn: () => api.get<{ comments: Comment[] }>(`/jobs/${jobId}/comments`),
  });

  const comments = data?.comments ?? [];

  const submit = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await api.post(`/jobs/${jobId}/comments`, { comment: trimmed });
      setNewComment('');
      await queryClient.invalidateQueries({ queryKey: ['job-comments', jobId] });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && comments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <Text className="text-gray-500 text-sm text-center py-6">No comments yet</Text>
        }
        renderItem={({ item }) => (
          <View className="rounded-xl border border-gray-200 px-4 py-3 mb-2">
            <Text className="text-sm text-gray-800">{item.content}</Text>
            <Text className="text-xs text-gray-500 mt-1">
              {item.createdBy?.name ?? 'User'} · {item.createdAt?.slice(0, 10)}
            </Text>
          </View>
        )}
      />
      <View className="border-t border-gray-200 px-4 py-3 bg-white">
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-base mb-2"
          multiline
        />
        <TouchableOpacity
          disabled={submitting || !newComment.trim()}
          onPress={submit}
          className="bg-black rounded-lg py-2 items-center"
        >
          <Text className="text-white font-semibold text-sm">Post comment</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
