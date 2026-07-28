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
import type { Invoice, InvoicesListResponse } from '../../types/api';

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const InvoicesScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['invoices'],
    queryFn: () =>
      api.get<InvoicesListResponse>('/invoices?page=1&limit=20'),
  });

  const invoices = data?.invoices ?? [];

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading invoices…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-6 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-semibold mb-2">Invoices</Text>
          <Text className="text-gray-500 text-sm">
            Recent invoices across all customers.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('InvoiceCreate')}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <Text className="text-sm font-medium text-gray-800">Create invoice</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item: Invoice) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('InvoiceDetail', { invoiceId: item.id })
            }
            className="mb-3 rounded-2xl border border-gray-200 px-4 py-3"
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-semibold text-base">
                {item.customer?.name ?? 'Invoice'}
              </Text>
              <Text className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {item.status}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 mb-1">
              #{item.invoiceNumber}
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

