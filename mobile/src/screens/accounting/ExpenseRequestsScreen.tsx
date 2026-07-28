import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { ExpenseRequest } from '../../types/api';

interface ExpenseRequestsResponse {
  requests: ExpenseRequest[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const ExpenseRequestsScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [page] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [actionModal, setActionModal] = useState<{
    request: ExpenseRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [comment, setComment] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['expense-requests', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '20');
      if (statusFilter) params.append('status', statusFilter);
      return api.get<ExpenseRequestsResponse>(
        `/expenses/requests?${params.toString()}`
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approvalComment }: { id: string; approvalComment?: string }) =>
      api.patch(`/expenses/requests/${id}/approve`, { approvalComment }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expense-requests'] });
      setActionModal(null);
      setComment('');
      Alert.alert('Success', 'Request approved.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Failed to approve.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason?: string }) =>
      api.patch(`/expenses/requests/${id}/reject`, {
        rejectionReason: rejectionReason || 'No reason provided',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expense-requests'] });
      setActionModal(null);
      setComment('');
      Alert.alert('Success', 'Request rejected.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Failed to reject.');
    },
  });

  const requests = data?.requests ?? [];

  const handleApprove = () => {
    if (!actionModal) return;
    approveMutation.mutate({
      id: actionModal.request.id,
      approvalComment: comment.trim() || undefined,
    });
  };

  const handleReject = () => {
    if (!actionModal) return;
    rejectMutation.mutate({
      id: actionModal.request.id,
      rejectionReason: comment.trim() || undefined,
    });
  };

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading requests…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2 flex-row flex-wrap gap-2">
        <TouchableOpacity
          onPress={() => setStatusFilter(undefined)}
          className={`rounded-lg px-3 py-2 ${!statusFilter ? 'bg-black' : 'bg-gray-200'}`}
        >
          <Text className={`text-sm font-medium ${!statusFilter ? 'text-white' : 'text-gray-800'}`}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStatusFilter('PENDING')}
          className={`rounded-lg px-3 py-2 ${statusFilter === 'PENDING' ? 'bg-black' : 'bg-gray-200'}`}
        >
          <Text className={`text-sm font-medium ${statusFilter === 'PENDING' ? 'text-white' : 'text-gray-800'}`}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStatusFilter('APPROVED')}
          className={`rounded-lg px-3 py-2 ${statusFilter === 'APPROVED' ? 'bg-black' : 'bg-gray-200'}`}
        >
          <Text className={`text-sm font-medium ${statusFilter === 'APPROVED' ? 'text-white' : 'text-gray-800'}`}>
            Approved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStatusFilter('REJECTED')}
          className={`rounded-lg px-3 py-2 ${statusFilter === 'REJECTED' ? 'bg-black' : 'bg-gray-200'}`}
        >
          <Text className={`text-sm font-medium ${statusFilter === 'REJECTED' ? 'text-white' : 'text-gray-800'}`}>
            Rejected
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-semibold text-base">
                GHS {item.amount.toFixed(2)} · {item.category}
              </Text>
              <Text className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {item.status}
              </Text>
            </View>
            {item.requestedBy ? (
              <Text className="text-xs text-gray-500">
                {item.requestedBy.name} · {item.createdAt?.slice(0, 10)}
              </Text>
            ) : null}
            {item.description ? (
              <Text className="text-xs text-gray-600 mt-1" numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            {item.status === 'PENDING' && (
              <View className="flex-row mt-2 gap-2">
                <TouchableOpacity
                  onPress={() =>
                    setActionModal({ request: item, action: 'approve' })
                  }
                  className="flex-1 bg-green-600 rounded-lg py-2 items-center"
                >
                  <Text className="text-white text-sm font-medium">Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setActionModal({ request: item, action: 'reject' })
                  }
                  className="flex-1 bg-red-600 rounded-lg py-2 items-center"
                >
                  <Text className="text-white text-sm font-medium">Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center py-8">No expense requests.</Text>
        }
      />

      <Modal
        visible={!!actionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModal(null)}
      >
        <View className="flex-1 justify-center bg-black/50 px-4">
          <View className="bg-white rounded-2xl p-4">
            <Text className="text-lg font-semibold mb-2">
              {actionModal?.action === 'approve'
                ? 'Approve request'
                : 'Reject request'}
            </Text>
            {actionModal?.request && (
              <Text className="text-sm text-gray-600 mb-2">
                GHS {actionModal.request.amount.toFixed(2)} ·{' '}
                {actionModal.request.category}
              </Text>
            )}
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder={
                actionModal?.action === 'approve'
                  ? 'Comment (optional)'
                  : 'Reason (optional)'
              }
              multiline
              className="border border-gray-300 rounded-lg px-3 py-2 text-base mb-4"
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  setActionModal(null);
                  setComment('');
                }}
                className="flex-1 border border-gray-300 rounded-lg py-2 items-center"
              >
                <Text className="text-gray-800 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={
                  actionModal?.action === 'approve' ? handleApprove : handleReject
                }
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={`flex-1 rounded-lg py-2 items-center ${
                  actionModal?.action === 'approve'
                    ? 'bg-green-600'
                    : 'bg-red-600'
                }`}
              >
                <Text className="text-white font-medium">
                  {actionModal?.action === 'approve' ? 'Approve' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
