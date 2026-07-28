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
import type { Customer, CustomersListResponse } from '../../types/api';

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const CustomersListScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customers'],
    queryFn: () =>
      api.get<CustomersListResponse>('/customers?page=1&limit=20'),
  });

  const customers = data?.customers ?? [];

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading customers…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-6 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-semibold mb-2">Customers</Text>
          <Text className="text-gray-500 text-sm">
            Manage CN Terminal customers and their consignments.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('CustomerCreate')}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <Text className="text-sm font-medium text-gray-800">Add customer</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item: Customer) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CustomerDetail', { customerId: item.id })
            }
            className="mb-3 rounded-2xl border border-gray-200 px-4 py-3"
          >
            <Text className="font-semibold text-base mb-1">{item.name}</Text>
            {item.email ? (
              <Text className="text-xs text-gray-500">{item.email}</Text>
            ) : null}
            {item.phone ? (
              <Text className="text-xs text-gray-500 mt-0.5">
                {item.phone}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};


