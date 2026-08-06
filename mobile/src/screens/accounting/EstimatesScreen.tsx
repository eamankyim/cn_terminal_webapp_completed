import React, { useEffect, useMemo, useState } from 'react';
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
import type { Estimate, EstimatesListResponse } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const EstimatesScreen: React.FC<Props> = ({ navigation }) => {
  const { hasPermission } = useAuth();
  const canCreateEstimate = hasPermission(PERMISSIONS.ESTIMATE_CREATE);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => api.get<EstimatesListResponse>('/estimates'),
  });

  const estimates = useMemo(() => {
    const all = data?.estimates ?? [];
    if (!search) return all;
    return all.filter((item) => {
      const hay = `${item.estimateNumber} ${item.customer?.name ?? ''} ${item.status}`.toLowerCase();
      return hay.includes(search);
    });
  }, [data?.estimates, search]);

  if (isLoading && !isRefetching && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading estimates…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="Estimates"
        right={
          canCreateEstimate ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('EstimateCreate')}
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
          placeholder="Search by estimate # or customer"
        />
      </View>

      <FlatList
        data={estimates}
        keyExtractor={(item: Estimate) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-base text-gray-500">No estimates found</Text>
          </View>
        }
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
              <StatusBadge label={item.status} />
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
