import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Estimate } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';

interface EstimateDetailResponse {
  estimate: Estimate & { description?: string };
}

export const EstimateEditScreen: React.FC = () => {
  const { accent } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const estimateId: string = route.params?.estimateId;
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['estimate', estimateId],
    queryFn: () =>
      api.get<EstimateDetailResponse>(`/estimates/${estimateId}`),
  });

  useEffect(() => {
    if (data?.estimate) {
      const e = data.estimate;
      setAmount(String(e.amount ?? ''));
      setDescription((e as any).description ?? '');
      setIssueDate(e.issueDate ?? '');
      setValidUntil(e.validUntil ?? '');
    }
  }, [data?.estimate]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      amount: number;
      description?: string;
      issueDate: string;
      validUntil: string;
    }) =>
      api.put<{ estimate: Estimate }>(`/estimates/${estimateId}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] });
      void queryClient.invalidateQueries({ queryKey: ['estimates'] });
      Alert.alert('Success', 'Estimate updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ?? err?.message ?? 'Failed to update estimate.',
      );
    },
  });

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num <= 0) {
      Alert.alert('Validation', 'Enter a valid amount.');
      return;
    }
    if (!issueDate || !validUntil) {
      Alert.alert('Validation', 'Issue date and valid until are required.');
      return;
    }
    updateMutation.mutate({
      amount: num,
      ...(description.trim() ? { description: description.trim() } : {}),
      issueDate,
      validUntil,
    });
  };

  const loading = updateMutation.isPending;

  if (isLoading || !data?.estimate) {
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
      <ScreenHeader title="Edit estimate" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4">
          <Text className="text-sm text-gray-500">Estimate</Text>
          <Text className="text-base font-medium text-gray-900">
            #{data.estimate.estimateNumber} · {data.estimate.customer?.name}
          </Text>
        </View>

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
        style={{ backgroundColor: accent }}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-[17px]">Save changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
