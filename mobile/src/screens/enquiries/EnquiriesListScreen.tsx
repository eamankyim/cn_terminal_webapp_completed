import React, { useState } from 'react';
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
import type { Enquiry, EnquiriesListResponse } from '../../types/api';

interface Props {
  navigation: {
    navigate: (screen: string, params: { enquiryId: string }) => void;
    goBack: () => void;
  };
}

export const EnquiriesListScreen: React.FC<Props> = ({ navigation }) => {
  const [page] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['enquiries', page],
    queryFn: () =>
      api.get<EnquiriesListResponse>(
        `/enquiries?page=${page}&limit=20`
      ),
  });

  const enquiries = data?.enquiries ?? [];

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading enquiries…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-6 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="py-2">
          <Text className="text-base text-black font-medium">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-semibold">Enquiries</Text>
        <View style={{ width: 48 }} />
      </View>
      <Text className="px-4 text-gray-500 text-sm mb-2">
        Customer enquiries and submissions.
      </Text>

      <FlatList
        data={enquiries}
        keyExtractor={(item: Enquiry) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
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
              <Text className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {item.status}
              </Text>
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
