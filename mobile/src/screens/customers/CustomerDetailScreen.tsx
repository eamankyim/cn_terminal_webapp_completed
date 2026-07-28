import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Consignment, Customer } from '../../types/api';

interface CustomerDetailResponse {
  customer: Customer & {
    consignments?: Consignment[];
  };
}

export const CustomerDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const customerId: string = route.params?.customerId;

  const { data, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () =>
      api.get<CustomerDetailResponse>(`/customers/${customerId}`),
  });

  if (isLoading || !data?.customer) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading customer…</Text>
      </View>
    );
  }

  const customer = data.customer;
  const consignments = customer.consignments ?? [];

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-4 py-6">
      <View className="flex-row justify-end mb-2">
        <TouchableOpacity
          onPress={() => navigation.navigate('CustomerEdit', { customerId })}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <Text className="text-sm font-medium text-gray-800">Edit</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-2xl font-semibold mb-1">{customer.name}</Text>
      {customer.email ? (
        <Text className="text-xs text-gray-500">{customer.email}</Text>
      ) : null}
      {customer.phone ? (
        <Text className="text-xs text-gray-500 mt-0.5">{customer.phone}</Text>
      ) : null}

      <View className="mt-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold">Consignments</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ConsignmentsList', { customerId })}
            className="rounded-lg bg-black px-3 py-1.5"
          >
            <Text className="text-white text-xs font-medium">
              {consignments.length > 0 ? 'View all' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
        {consignments.length === 0 ? (
          <Text className="text-xs text-gray-500">
            No consignments recorded for this customer yet.
          </Text>
        ) : (
          <FlatList
            data={consignments.slice(0, 3)}
            keyExtractor={(item: Consignment) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ConsignmentDetail', { consignmentId: item.id })
                }
                className="mb-2 rounded-xl border border-gray-200 px-3 py-2"
              >
                <Text className="text-sm font-medium">
                  {item.consigneeName ?? 'Consignment'}
                </Text>
                <Text className="text-xs text-gray-500">
                  Tracking ID: {item.trackingId}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  Status: {item.status}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
};

