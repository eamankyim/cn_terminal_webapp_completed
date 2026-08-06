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
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import type { Estimate } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PERMISSIONS } from '../../utils/permissions';

interface EstimateDetailResponse {
  estimate: Estimate;
}

export const EstimateDetailScreen: React.FC = () => {
  const { accent } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const estimateId: string = route.params?.estimateId;
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const { hasPermission } = useAuth();
  const canEditEstimate = hasPermission(PERMISSIONS.ESTIMATE_EDIT);
  const canSendEstimate = hasPermission(PERMISSIONS.ESTIMATE_SEND);

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
    <View className="flex-1 bg-white">
      <ScreenHeader title="Estimate" />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6">
        <Text className="text-base font-semibold mb-1">
          #{estimate.estimateNumber}
        </Text>
        <Text className="text-xs text-gray-500 mb-3">
          {estimate.customer?.name ?? 'Customer'}
        </Text>

        <View className="flex-row items-center mb-4">
          <StatusBadge label={estimate.status} className="mr-2" />
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
          {canEditEstimate ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('EstimateEdit', { estimateId })}
              className="flex-1 border border-gray-300 rounded-xl h-[52px] items-center justify-center"
            >
              <Text className="text-gray-800 font-semibold text-[17px]">Edit</Text>
            </TouchableOpacity>
          ) : null}
          {canSend && canSendEstimate ? (
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending}
              className="flex-1 rounded-xl h-[52px] items-center justify-center"
              style={{ backgroundColor: accent }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-[17px]">Send estimate</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};
