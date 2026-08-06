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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/http';
import type { Customer, CustomersListResponse } from '../../types/api';
import { DetailBottomSheet } from '../../components/DetailBottomSheet';
import { SearchBar } from '../../components/SearchBar';
import { CustomerDetailContent } from '../customers/CustomerDetailScreen';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const CustomersListScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { hasPermission } = useAuth();
  const canCreateCustomer = hasPermission(PERMISSIONS.CUSTOMER_CREATE);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customers', { search }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');
      if (search) params.append('search', search);
      return api.get<CustomersListResponse>(`/customers?${params.toString()}`);
    },
  });

  const customers = data?.customers ?? [];
  const closeCustomerSheet = () => setSelectedCustomerId(null);

  if (isLoading && !isRefetching && !data) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3 text-base">Loading customers…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-5 pt-3 pb-3 flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-3xl font-bold text-black mb-1">Clients</Text>
          <Text className="text-base text-gray-500">
            Manage clients and consignments.
          </Text>
        </View>
        {canCreateCustomer ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('CustomerCreate')}
            className="rounded-xl border border-gray-300 px-3.5 py-2.5"
          >
            <Text className="text-base font-medium text-black">Add</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View className="px-5 mb-3">
        <SearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by name, email, or phone"
        />
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item: Customer) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-base text-gray-500">No customers found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedCustomerId(item.id)}
            activeOpacity={0.7}
            className="flex-row items-center py-5 border-b border-gray-200"
          >
            <View className="flex-1 mr-2">
              <Text className="text-xl font-bold text-black">{item.name}</Text>
              {item.email ? (
                <Text className="text-base text-gray-500 mt-1.5">
                  {item.email}
                </Text>
              ) : null}
              {item.phone ? (
                <Text className="text-sm text-gray-500 mt-1">{item.phone}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}
      />

      <DetailBottomSheet
        visible={Boolean(selectedCustomerId)}
        onClose={closeCustomerSheet}
      >
        {selectedCustomerId ? (
          <CustomerDetailContent
            customerId={selectedCustomerId}
            presentation="sheet"
            onClose={closeCustomerSheet}
            onNavigate={(screen, params) => {
              closeCustomerSheet();
              requestAnimationFrame(() => {
                navigation.navigate(screen, params);
              });
            }}
          />
        ) : null}
      </DetailBottomSheet>
    </View>
  );
};
