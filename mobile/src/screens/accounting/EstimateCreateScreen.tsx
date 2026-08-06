import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Estimate } from '../../types/api';
import type { Customer, CustomersListResponse } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';

interface CreateEstimateResponse {
  estimate: Estimate;
  success: boolean;
  message: string;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const EstimateCreateScreen: React.FC = () => {
  const { accent } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'customer' | 'form'>('customer');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState(toDateString(new Date()));
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toDateString(d);
  });
  const [customerSearch, setCustomerSearch] = useState('');

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () =>
      api.get<CustomersListResponse>('/customers?page=1&limit=100'),
  });

  const customers = customersData?.customers ?? [];
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = `${c.name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [customers, customerSearch]);

  const createMutation = useMutation({
    mutationFn: (payload: {
      customerId: string;
      amount: number;
      description?: string;
      issueDate: string;
      validUntil: string;
    }) => api.post<CreateEstimateResponse>('/estimates', payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['estimates'] });
      Alert.alert('Success', 'Estimate created successfully.', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('EstimateDetail', { estimateId: data.estimate.id }),
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ?? err?.message ?? 'Failed to create estimate.',
      );
    },
  });

  const handleSubmit = () => {
    if (!customerId) {
      Alert.alert('Validation', 'Please select a customer.');
      return;
    }
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num <= 0) {
      Alert.alert('Validation', 'Enter a valid amount.');
      return;
    }
    createMutation.mutate({
      customerId,
      amount: num,
      ...(description.trim() ? { description: description.trim() } : {}),
      issueDate,
      validUntil,
    });
  };

  const loading = createMutation.isPending;

  if (step === 'customer') {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="New estimate" />
        <View className="px-4 mb-3">
          <SearchBar
            value={customerSearch}
            onChangeText={setCustomerSearch}
            placeholder="Search customers…"
          />
        </View>
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item: Customer) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-base text-gray-500">No customers found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setCustomerId(item.id);
                setStep('form');
              }}
              className="mb-3 rounded-2xl border border-gray-200 px-4 py-3"
            >
              <Text className="font-semibold text-base">{item.name}</Text>
              {item.email ? (
                <Text className="text-xs text-gray-500">{item.email}</Text>
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
      <ScreenHeader title="New estimate" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => setStep('customer')}
          className="mb-4"
        >
          <Text className="text-sm text-gray-500">Customer</Text>
          <Text className="text-base font-medium text-gray-900">
            {selectedCustomer?.name ?? 'Select'}
          </Text>
        </TouchableOpacity>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Amount (GHS) *</Text>
          <Input
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Description (optional)</Text>
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            multiline
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Issue date</Text>
          <Input
            value={issueDate}
            onChangeText={setIssueDate}
            placeholder="YYYY-MM-DD"
            editable={!loading}
          />
        </View>
        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">Valid until</Text>
          <Input
            value={validUntil}
            onChangeText={setValidUntil}
            placeholder="YYYY-MM-DD"
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
            <Text className="text-white font-semibold text-[17px]">Create estimate</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
