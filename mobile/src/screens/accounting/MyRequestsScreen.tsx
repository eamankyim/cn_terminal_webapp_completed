import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { StatusBadge } from '../../components/StatusBadge';
import { SelectField } from '../../components/SelectField';
import { useTheme } from '../../context/ThemeContext';

const EXPENSE_CATEGORIES = [
  { value: 'FUEL', label: 'Fuel' },
  { value: 'MATERIALS', label: 'Materials' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous' },
  { value: 'OTHER', label: 'Other' },
] as const;

function expenseCategoryLabel(item: {
  category: string;
  categoryOther?: string | null;
}) {
  if (item.category === 'OTHER' && item.categoryOther?.trim()) {
    return item.categoryOther.trim();
  }
  return EXPENSE_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category;
}

interface Request {
  id: string;
  amount: number;
  category: string;
  categoryOther?: string | null;
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
      <ScreenHeader
        title="My expense requests"
        right={
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-sm font-semibold text-black">New</Text>
          </TouchableOpacity>
        }
      />
      <Text className="text-gray-500 text-sm px-4 mb-2">
        Submit and track your requests
      </Text>

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
                <StatusBadge label={item.status} />
              </View>
              <Text className="text-xs text-gray-500">{expenseCategoryLabel(item)}</Text>
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
  const { accent } = useTheme();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('MISCELLANEOUS');
  const [categoryOther, setCategoryOther] = useState('');
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
    if (!EXPENSE_CATEGORIES.some((c) => c.value === category)) {
      setError('Select a category');
      return;
    }
    const custom = categoryOther.trim();
    if (category === 'OTHER' && !custom) {
      setError('Please specify the category');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/expenses/requests', {
        amount: num,
        category,
        categoryOther: category === 'OTHER' ? custom : null,
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
          <Input
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>
        <View className="mb-3">
          <SelectField
            label="Category"
            placeholder="Select category"
            value={category}
            onChange={(value) => {
              setCategory(value);
              if (value !== 'OTHER') setCategoryOther('');
            }}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
        </View>
        {category === 'OTHER' ? (
          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-600 mb-1">Specify category</Text>
            <Input
              value={categoryOther}
              onChangeText={setCategoryOther}
              placeholder="e.g. Parking, Toll, Courier"
              maxLength={80}
            />
          </View>
        ) : null}
        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-600 mb-1">Description *</Text>
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description"
          />
        </View>
        <TouchableOpacity
          disabled={submitting}
          onPress={submit}
          className="rounded-xl h-[52px] items-center justify-center"
        style={{ backgroundColor: accent }}>
          <Text className="text-white font-semibold text-[17px]">{submitting ? 'Submitting…' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
