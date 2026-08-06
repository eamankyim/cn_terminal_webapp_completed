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
import type { Enquiry, EnquiriesListResponse } from '../../types/api';

interface Props {
  navigation: {
    navigate: (screen: string, params: { enquiryId: string }) => void;
    goBack: () => void;
  };
}

export const EnquiriesListScreen: React.FC<Props> = ({ navigation }) => {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['enquiries', { search }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');
      if (search) params.append('search', search);
      return api.get<EnquiriesListResponse>(`/enquiries?${params.toString()}`);
    },
  });

  const enquiries = data?.enquiries ?? [];

  if (isLoading && !isRefetching && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading enquiries…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Enquiries" />

      <View className="px-4 mb-3">
        <SearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by customer or port"
        />
      </View>

      <FlatList
        data={enquiries}
        keyExtractor={(item: Enquiry) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-base text-gray-500">No enquiries found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('EnquiryDetail', { enquiryId: item.id })
            }
            className="mb-3 rounded-2xl border border-gray-200 px-4 py-3"
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-semibold text-base">
                {item.customer?.name ?? 'Unknown'}
              </Text>
              <StatusBadge label={item.status} />
            </View>
            <Text className="text-xs text-gray-500">
              Port: {item.port} · {item.createdAt?.slice(0, 10)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
