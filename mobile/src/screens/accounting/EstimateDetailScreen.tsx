import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Estimate } from '../../types/api';

interface EstimateDetailResponse {
  estimate: Estimate;
}

export const EstimateDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const estimateId: string = route.params?.estimateId;
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['estimate', estimateId],
    queryFn: () =>
      api.get<EstimateDetailResponse>(`/estimates/${estimateId}`),
  });

  const sendMutation = useMutation({
    mutationFn: () => api.post<{ success: boolean; message: string }>(`/estimates/${estimateId}/send`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] });
      void queryClient.invalidateQueries({ queryKey: ['estimates'] });
      setSending(false);
      Alert.alert('Success', 'Estimate sent successfully.');
    },
    onError: (err: any) => {
      setSending(false);
      Alert.alert('Error', err?.message ?? 'Failed to send estimate.');
    },
  });

  const handleSend = () => {
    setSending(true);
    sendMutation.mutate();
  };

  if (isLoading || !data?.estimate) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading estimate…</Text>
      </View>
    );
  }

  const estimate = data.estimate;
  const canSend = estimate.status?.toUpperCase() !== 'SENT';

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-4 py-6">
      <Text className="text-2xl font-semibold mb-1">
        Estimate #{estimate.estimateNumber}
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        {estimate.customer?.name ?? 'Customer'}
      </Text>

      <View className="flex-row items-center mb-4">
        <Text className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 mr-2">
          {estimate.status}
        </Text>
        <Text className="text-sm font-semibold">
          GHS {estimate.amount.toFixed(2)}
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-xs text-gray-500 mb-1">Dates</Text>
        <Text className="text-xs text-gray-700">
          Issued: {estimate.issueDate} · Valid until: {estimate.validUntil}
        </Text>
      </View>

      <View className="flex-row gap-2 mt-2">
        <TouchableOpacity
          onPress={() => navigation.navigate('EstimateEdit', { estimateId })}
          className="flex-1 border border-gray-300 rounded-lg py-3 items-center"
        >
          <Text className="text-gray-800 font-semibold text-sm">Edit</Text>
        </TouchableOpacity>
        {canSend && (
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending}
            className="flex-1 bg-black rounded-lg py-3 items-center"
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-sm">Send estimate</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

