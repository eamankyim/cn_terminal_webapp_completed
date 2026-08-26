import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { StatusBadge } from '../../components/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import type { ExpenseRequest } from '../../types/api';
import { useAuth } from '../../context/AuthContext';

function expenseCategoryLabel(item: ExpenseRequest) {
  if (item.category === 'OTHER' && item.categoryOther?.trim()) {
    return item.categoryOther.trim();
  }
  return item.category;
}

interface ExpenseRequestsResponse {
  requests: ExpenseRequest[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const ExpenseRequestsScreen: React.FC = () => {
  const { accent } = useTheme();
  const { user } = useAuth();
  const canEndorse = ['ADMIN', 'ACCOUNTANT', 'INVOICE_OFFICER'].includes(user?.role || '')
    || (user?.permissions || []).includes('expense:endorse');
  const canApprove = user?.role === 'ACCOUNTANT';
  const queryClient = useQueryClient();
  const [page] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState<{
    request: ExpenseRequest;
    action: 'endorse' | 'approve' | 'reject';
  } | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

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

  const endorseMutation = useMutation({
    mutationFn: ({ id, endorsementComment }: { id: string; endorsementComment?: string }) =>
      api.patch(`/expenses/requests/${id}/endorse`, { endorsementComment }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expense-requests'] });
      setActionModal(null);
      setComment('');
      Alert.alert('Success', 'Request endorsed.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message ?? 'Failed to endorse.');
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

  const requests = useMemo(() => {
    const all = data?.requests ?? [];
    if (!search) return all;
    return all.filter((item) => {
      const hay = `${item.category} ${item.categoryOther ?? ''} ${item.description ?? ''} ${item.requestedBy?.name ?? ''} ${item.status}`.toLowerCase();
      return hay.includes(search);
    });
  }, [data?.requests, search]);

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
      <ScreenHeader title="Expense requests" />

      <View className="px-4 mb-3">
        <SearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by category, person, or notes"
        />
      </View>

      <View className="px-4 pb-2 flex-row flex-wrap gap-2">
        {(
          [
            { key: undefined, label: 'All' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'ENDORSED', label: 'Endorsed' },
            { key: 'APPROVED', label: 'Approved' },
            { key: 'REJECTED', label: 'Rejected' },
          ] as const
        ).map((chip) => {
          const selected = statusFilter === chip.key;
          return (
            <TouchableOpacity
              key={chip.label}
              onPress={() => setStatusFilter(chip.key)}
              className={`rounded-full px-3 py-2 ${selected ? '' : 'bg-gray-200'}`}
              style={selected ? { backgroundColor: accent } : undefined}
            >
              <Text
                className={`text-sm font-medium ${
                  selected ? 'text-white' : 'text-gray-800'
                }`}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
                GHS {item.amount.toFixed(2)} · {expenseCategoryLabel(item)}
              </Text>
              <StatusBadge label={item.status} />
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
            {item.status === 'PENDING' && canEndorse && (
              <View className="flex-row mt-2 gap-2">
                <TouchableOpacity
                  onPress={() =>
                    setActionModal({ request: item, action: 'endorse' })
                  }
                  className="flex-1 bg-green-600 rounded-xl h-[52px] items-center justify-center"
                >
                  <Text className="text-white text-[17px] font-semibold">Endorse</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setActionModal({ request: item, action: 'reject' })
                  }
                  className="flex-1 bg-red-600 rounded-xl h-[52px] items-center justify-center"
                >
                  <Text className="text-white text-[17px] font-semibold">Reject</Text>
                </TouchableOpacity>
              </View>
            )}
            {item.status === 'ENDORSED' && (canApprove || canEndorse) && (
              <View className="flex-row mt-2 gap-2">
                {canApprove ? (
                  <TouchableOpacity
                    onPress={() =>
                      setActionModal({ request: item, action: 'approve' })
                    }
                    className="flex-1 bg-green-600 rounded-xl h-[52px] items-center justify-center"
                  >
                    <Text className="text-white text-[17px] font-semibold">Approve</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() =>
                    setActionModal({ request: item, action: 'reject' })
                  }
                  className="flex-1 bg-red-600 rounded-xl h-[52px] items-center justify-center"
                >
                  <Text className="text-white text-[17px] font-semibold">Reject</Text>
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
              {actionModal?.action === 'endorse'
                ? 'Endorse request'
                : actionModal?.action === 'approve'
                ? 'Approve request'
                : 'Reject request'}
            </Text>
            {actionModal?.request && (
              <Text className="text-sm text-gray-600 mb-2">
                GHS {actionModal.request.amount.toFixed(2)} ·{' '}
                {expenseCategoryLabel(actionModal.request)}
              </Text>
            )}
            <Input
              value={comment}
              onChangeText={setComment}
              placeholder={
                actionModal?.action === 'reject'
                  ? 'Reason (optional)'
                  : 'Comment (optional)'
              }
              multiline
              className="mb-4"
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  setActionModal(null);
                  setComment('');
                }}
                className="flex-1 border border-gray-300 rounded-xl h-[52px] items-center justify-center"
              >
                <Text className="text-gray-800 font-semibold text-[17px]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (actionModal?.action === 'endorse') {
                    endorseMutation.mutate({
                      id: actionModal.request.id,
                      endorsementComment: comment.trim() || undefined,
                    });
                    return;
                  }
                  if (actionModal?.action === 'approve') {
                    handleApprove();
                    return;
                  }
                  handleReject();
                }}
                disabled={
                  approveMutation.isPending ||
                  rejectMutation.isPending ||
                  endorseMutation.isPending
                }
                className={`flex-1 rounded-xl h-[52px] items-center justify-center ${
                  actionModal?.action === 'reject' ? 'bg-red-600' : 'bg-green-600'
                }`}
              >
                <Text className="text-white font-semibold text-[17px]">
                  {actionModal?.action === 'endorse'
                    ? 'Endorse'
                    : actionModal?.action === 'approve'
                    ? 'Approve'
                    : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
