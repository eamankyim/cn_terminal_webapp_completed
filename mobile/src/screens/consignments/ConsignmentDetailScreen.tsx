import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import type { Consignment } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';

interface ConsignmentDetailResponse {
  consignment: Consignment;
}

export const ConsignmentDetailScreen: React.FC = () => {
  const { accent } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const consignmentId: string = route.params?.consignmentId;

  const { data, isLoading } = useQuery({
    queryKey: ['consignment', consignmentId],
    queryFn: () =>
      api.get<ConsignmentDetailResponse>(`/consignments/${consignmentId}`),
  });

  if (isLoading || !data?.consignment) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading…</Text>
      </View>
    );
  }

  const c = data.consignment;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Consignment" />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-base font-semibold">
            {c.consigneeName ?? 'Consignment'}
          </Text>
          <StatusBadge label={c.status} />
        </View>

        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1">Tracking ID</Text>
          <Text className="text-sm text-gray-800">{c.trackingId}</Text>
        </View>
        {c.consigneePhone ? (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Phone</Text>
            <Text className="text-sm text-gray-800">{c.consigneePhone}</Text>
          </View>
        ) : null}
        {c.consigneeAddress ? (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Address</Text>
            <Text className="text-sm text-gray-800">{c.consigneeAddress}</Text>
          </View>
        ) : null}
        {c.customer ? (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Customer</Text>
            <Text className="text-sm text-gray-800">{c.customer.name}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ConsignmentEdit', { consignmentId: c.id })
          }
          className="mt-4 rounded-xl h-[52px] items-center justify-center"
          style={{ backgroundColor: accent }}
        >
          <Text className="text-white font-semibold text-[17px]">Edit consignment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
