import React, { useEffect, useState } from 'react';
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
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatusBadge } from '../../components/StatusBadge';
import type { Invoice, InvoicesListResponse } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const InvoicesScreen: React.FC<Props> = ({ navigation }) => {
  const { hasPermission } = useAuth();
  const canCreateInvoice = hasPermission(PERMISSIONS.INVOICE_CREATE);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['invoices', { search }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');
      if (search) params.append('search', search);
      return api.get<InvoicesListResponse>(`/invoices?${params.toString()}`);
    },
  });

  const invoices = data?.invoices ?? [];

  if (isLoading && !isRefetching && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading invoices…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="Invoices"
        right={
          canCreateInvoice ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('InvoiceCreate')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-sm font-semibold text-black">Add</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View className="px-4 mb-3">
        <SearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by invoice # or customer"
        />
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item: Invoice) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-base text-gray-500">No invoices found</Text>
          </View>
        }
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
              <StatusBadge label={item.status} />
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
