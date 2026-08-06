import React, { useEffect, useMemo, useState } from 'react';
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
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatusBadge } from '../../components/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import type { Consignment } from '../../types/api';

interface ConsignmentsResponse {
  consignments: Consignment[];
}

export const ConsignmentsListScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { accent } = useTheme();
  const customerId: string = route.params?.customerId;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['consignments', customerId],
    queryFn: () =>
      api.get<ConsignmentsResponse>(`/consignments/customer/${customerId}`),
  });

  const consignments = useMemo(() => {
    const all = data?.consignments ?? [];
    if (!search) return all;
    return all.filter((item) => {
      const hay = `${item.trackingId} ${item.consigneeName ?? ''} ${item.status}`.toLowerCase();
      return hay.includes(search);
    });
  }, [data?.consignments, search]);

  if (isLoading && !isRefetching && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading consignments…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="Consignments"
        right={
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ConsignmentCreate', { customerId })
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-sm font-semibold" style={{ color: accent }}>
              Add
            </Text>
          </TouchableOpacity>
        }
      />

      <View className="px-4 mb-3">
        <SearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by tracking ID or consignee"
        />
      </View>

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
              navigation.navigate('ConsignmentDetail', {
                consignmentId: item.id,
              })
            }
            className="mb-3 rounded-2xl border border-gray-200 px-4 py-3"
          >
            <Text className="font-semibold text-base">
              {item.consigneeName ?? 'Consignment'}
            </Text>
            <View className="flex-row items-center mt-1" style={{ gap: 8 }}>
              <Text className="text-xs text-gray-500">
                Tracking: {item.trackingId}
              </Text>
              <StatusBadge label={item.status} />
            </View>
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
