import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Estimate, EstimatesListResponse } from '../../types/api';

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const EstimatesScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => api.get<EstimatesListResponse>('/estimates'),
  });

  const estimates = data?.estimates ?? [];

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading estimates…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-6 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-semibold mb-2">Estimates</Text>
          <Text className="text-gray-500 text-sm">
            Recent estimates issued to customers.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('EstimateCreate')}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <Text className="text-sm font-medium text-gray-800">Create estimate</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={estimates}
        keyExtractor={(item: Estimate) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('EstimateDetail', { estimateId: item.id })
            }
            className="mb-3 rounded-2xl border border-gray-200 px-4 py-3"
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-semibold text-base">
                {item.customer?.name ?? 'Estimate'}
              </Text>
              <Text className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {item.status}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 mb-1">
              #{item.estimateNumber}
            </Text>
            <Text className="text-xs text-gray-900 font-semibold">
              GHS {item.amount.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

