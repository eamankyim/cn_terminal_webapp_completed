import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Job } from '../../types/api';

interface JobDetailResponse {
  job: Job & {
    description?: string;
    customer?: Job['customer'] & { email?: string; phone?: string };
  };
}

export const JobDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const jobId: string = route.params?.jobId;

  const { data, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.get<JobDetailResponse>(`/jobs/${jobId}`),
  });

  if (isLoading || !data?.job) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading job…</Text>
      </View>
    );
  }

  const job = data.job;

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-4 py-6">
      <Text className="text-2xl font-semibold mb-1">
        {job.customer?.name ?? 'Job'}
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        Tracking ID: {job.trackingId}
      </Text>

      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Text className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 mr-2">
            {job.status}
          </Text>
          {job.isDraft ? (
            <Text className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
              Draft
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('JobEdit', { jobId })}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <Text className="text-sm font-medium text-gray-800">Edit</Text>
        </TouchableOpacity>
      </View>

      {job.description ? (
        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1">Description</Text>
          <Text className="text-sm text-gray-800">{job.description}</Text>
        </View>
      ) : null}

      {job.customer ? (
        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1">Customer</Text>
          <Text className="text-sm text-gray-800">{job.customer.name}</Text>
          {job.customer.email ? (
            <Text className="text-xs text-gray-500 mt-1">
              {job.customer.email} · {job.customer.phone}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View className="mt-6 space-y-3">
        <TouchableOpacity
          onPress={() => navigation.navigate('JobStatusUpdate', { jobId })}
          className="bg-black rounded-lg py-3 items-center"
        >
          <Text className="text-white font-semibold text-sm">Update status</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('JobComments', { jobId })}
          className="border border-gray-300 rounded-lg py-3 items-center"
        >
          <Text className="text-gray-800 font-semibold text-sm">View comments</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

