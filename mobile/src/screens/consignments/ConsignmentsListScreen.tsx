import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Consignment } from '../../types/api';

interface ConsignmentsResponse {
  consignments: Consignment[];
}

export const ConsignmentsListScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const customerId: string = route.params?.customerId;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['consignments', customerId],
    queryFn: () =>
      api.get<ConsignmentsResponse>(`/consignments/customer/${customerId}`),
  });

  const consignments = data?.consignments ?? [];

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading consignments…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="py-2">
          <Text className="text-base text-black font-medium">← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('ConsignmentCreate', { customerId })}
          className="rounded-lg bg-black px-3 py-2"
        >
          <Text className="text-white text-sm font-medium">Add consignment</Text>
        </TouchableOpacity>
      </View>
      <Text className="px-4 text-lg font-semibold mb-2">Consignments</Text>

      <FlatList
        data={consignments}
        keyExtractor={(item: Consignment) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ConsignmentDetail', { consignmentId: item.id })
            }
            className="mb-3 rounded-2xl border border-gray-200 px-4 py-3"
          >
            <Text className="font-semibold text-base">
              {item.consigneeName ?? 'Consignment'}
            </Text>
            <Text className="text-xs text-gray-500">
              Tracking: {item.trackingId} · {item.status}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center py-8">
            No consignments yet. Add one to get started.
          </Text>
        }
      />
    </View>
  );
};
