import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Job } from '../../types/api';
import type { Customer, CustomersListResponse } from '../../types/api';
import type { User } from '../../types/api';

interface UsersResponse {
  users: User[];
}

interface CreateJobResponse {
  job: Job;
  message: string;
}

export const JobCreateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'customer' | 'form'>('customer');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [goodsTypesStr, setGoodsTypesStr] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [eta, setEta] = useState('');

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () =>
      api.get<CustomersListResponse>('/customers?page=1&limit=100'),
  });
  const { data: usersData } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: () => api.get<UsersResponse>('/auth/assignable-users'),
  });

  const customers = customersData?.customers ?? [];
  const users = usersData?.users ?? [];
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const createMutation = useMutation({
    mutationFn: (payload: {
      customerId: string;
      assignedToId: string;
      goodsTypes: string[];
      jobDescription?: string;
      eta?: string;
    }) => api.post<CreateJobResponse>('/jobs', payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      Alert.alert('Success', 'Job created successfully.', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('JobDetail', { jobId: data.job.id }),
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ?? err?.message ?? 'Failed to create job.',
      );
    },
  });

  const handleSubmit = () => {
    if (!customerId || !assignedToId) {
      Alert.alert('Validation', 'Please select customer and assignee.');
      return;
    }
    const types = goodsTypesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (types.length === 0) {
      Alert.alert('Validation', 'Enter at least one goods type (comma-separated).');
      return;
    }
    createMutation.mutate({
      customerId,
      assignedToId,
      goodsTypes: types,
      ...(jobDescription.trim() ? { jobDescription: jobDescription.trim() } : {}),
      ...(eta.trim() ? { eta: eta.trim() } : {}),
    });
  };

  const loading = createMutation.isPending;

  if (step === 'customer') {
    return (
      <View className="flex-1 bg-white">
        <View className="px-4 pt-4 pb-2">
          <Text className="text-lg font-semibold mb-2">Select customer</Text>
        </View>
        <FlatList
          data={customers}
          keyExtractor={(item: Customer) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6"
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
          <Text className="text-sm text-gray-600 mb-1">Assigned to *</Text>
          <View className="border border-gray-300 rounded-lg overflow-hidden">
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
        <View className="mb-4">
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
        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">ETA (optional, YYYY-MM-DD)</Text>
          <TextInput
            value={eta}
            onChangeText={setEta}
            placeholder="2025-12-31"
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
            <Text className="text-white font-semibold text-sm">Create job</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
