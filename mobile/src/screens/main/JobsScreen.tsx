import React, { useMemo, useState } from 'react';
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
import type { Job, JobsListResponse } from '../../types/api';
import { useJobSocket } from '../../realtime/useJobSocket';

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const JobsListScreen: React.FC<Props> = ({ navigation }) => {
  const [page] = useState(1);
  const [statusFilter] = useState<string | undefined>(undefined);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['jobs', { page, statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '20');
      if (statusFilter) params.append('status', statusFilter);
      return api.get<JobsListResponse>(`/jobs?${params.toString()}`);
    },
  });

  const jobs = data?.jobs ?? [];

  useJobSocket(
    useMemo(
      () => ({
        onJobCreated: () => {
          void refetch();
        },
        onJobUpdated: () => {
          void refetch();
        },
        onJobDeleted: () => {
          void refetch();
        },
        onJobStatusUpdated: () => {
          void refetch();
        },
        onJobCommentAdded: () => {
          void refetch();
        },
      }),
      [refetch],
    ),
  );

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading jobs…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-6 pb-2 flex-row items-center justify-between flex-wrap">
        <View>
          <Text className="text-2xl font-semibold mb-2">Jobs</Text>
          <Text className="text-gray-500 text-sm">
            Jobs and enquiries from the CN Terminal backend.
          </Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => navigation.navigate('JobCreate')}
            className="rounded-lg bg-black px-3 py-2"
          >
            <Text className="text-white text-sm font-medium">Create job</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('EnquiriesList')}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            <Text className="text-sm font-medium text-gray-800">Enquiries</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item: Job) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('JobDetail', { jobId: item.id })
            }
            className="mb-3 rounded-2xl border border-gray-200 px-4 py-3"
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-semibold text-base">
                {item.customer?.name ?? 'Unknown customer'}
              </Text>
              <Text className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {item.status}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 mb-1">
              Tracking ID: {item.trackingId}
            </Text>
            <Text className="text-xs text-gray-500">
              Assigned:{' '}
              <Text className="font-medium">
                {item.assignedTo?.name ?? 'Unassigned'}
              </Text>
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};


