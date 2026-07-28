import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';

interface Request {
  id: string;
  amount: number;
  category: string;
  status: string;
  createdAt: string;
  description?: string;
}

interface MyRequestsResponse {
  requests: Request[];
  pagination?: { page: number; limit: number; total: number };
}

export const MyRequestsScreen: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['expenses-my-requests'],
    queryFn: () => api.get<MyRequestsResponse>('/expenses/my-requests?page=1&limit=20'),
  });

  const requests = data?.requests ?? [];

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-6 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-semibold mb-1">My expense requests</Text>
          <Text className="text-gray-500 text-sm">Submit and track your requests</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="bg-black rounded-lg px-4 py-2"
        >
          <Text className="text-white font-semibold text-sm">New request</Text>
        </TouchableOpacity>
      </View>

      {isLoading && !isRefetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="rounded-2xl border border-dashed border-gray-300 px-4 py-8">
              <Text className="text-gray-500 text-sm text-center">No expense requests yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="rounded-2xl border border-gray-200 px-4 py-3 mb-3">
              <View className="flex-row justify-between items-start mb-1">
                <Text className="font-semibold text-sm">GHS {item.amount.toFixed(2)}</Text>
                <Text className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {item.status}
                </Text>
              </View>
              <Text className="text-xs text-gray-500">{item.category}</Text>
              {item.description ? (
                <Text className="text-xs text-gray-600 mt-1">{item.description}</Text>
              ) : null}
              <Text className="text-xs text-gray-400 mt-1">{item.createdAt?.slice(0, 10)}</Text>
            </View>
          )}
        />
      )}

      {showForm && (
        <NewRequestSheet
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['expenses-my-requests'] });
          }}
        />
      )}
    </View>
  );
}

function NewRequestSheet({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('MISCELLANEOUS');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('Enter a valid amount');
      return;
    }
    const desc = description.trim();
    if (!desc) {
      setError('Description is required');
      return;
    }
    const validCategories = ['FUEL', 'MATERIALS', 'OPERATIONS', 'MISCELLANEOUS'];
    const cat = category.trim().toUpperCase();
    if (!validCategories.includes(cat)) {
      setError('Category must be FUEL, MATERIALS, OPERATIONS, or MISCELLANEOUS');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/expenses/requests', {
        amount: num,
        category: cat,
        description: desc,
        expenseDate: new Date().toISOString().slice(0, 10),
      });
      onSuccess();
    } catch (e: any) {
      setError(
        (e?.details?.error as string) ?? e?.message ?? 'Failed to submit',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="absolute inset-0 bg-black/50 justify-end">
      <View className="bg-white rounded-t-3xl p-6 pb-10">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold">New expense request</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-gray-500">Cancel</Text>
          </TouchableOpacity>
        </View>
        {error ? <Text className="text-red-600 text-sm mb-2">{error}</Text> : null}
        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">Amount (GHS)</Text>
          <RNTextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            className="border border-gray-300 rounded-lg px-3 py-3"
          />
        </View>
        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">Category</Text>
          <RNTextInput
            value={category}
            onChangeText={setCategory}
            placeholder="FUEL, MATERIALS, OPERATIONS, MISCELLANEOUS"
            className="border border-gray-300 rounded-lg px-3 py-3"
          />
        </View>
        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-600 mb-1">Description *</Text>
          <RNTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description"
            className="border border-gray-300 rounded-lg px-3 py-3"
          />
        </View>
        <TouchableOpacity
          disabled={submitting}
          onPress={submit}
          className="bg-black rounded-lg py-3 items-center"
        >
          <Text className="text-white font-semibold">{submitting ? 'Submitting…' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
