import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../api/http';

interface DashboardStats {
  stats: {
    totalJobs: number;
    jobsInProgress: number;
    jobsDelivered: number;
    totalClients?: number;
    revenueThisMonth: number;
    workflowStatuses?: Record<string, number>;
  };
}

interface RecentJobsResponse {
  jobs: Array<{
    id: string;
    trackingId: string;
    status: string;
    customer?: { id: string; name: string };
    assignedTo?: { id: string; name: string };
  }>;
}

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  });

  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['dashboard-recent-jobs'],
    queryFn: () => api.get<RecentJobsResponse>('/dashboard/recent-jobs?limit=5'),
  });

  const refetch = () => {
    refetchStats();
    refetchJobs();
  };
  const isLoading = statsLoading || jobsLoading;
  const stats = statsData?.stats;
  const recentJobs = jobsData?.jobs ?? [];

  if (isLoading && !stats) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <Text className="text-2xl font-semibold mt-6 mb-4">Dashboard</Text>

      <View className="flex-row flex-wrap mb-4" style={{ gap: 10 }}>
        <View className="rounded-2xl bg-black px-4 py-4 flex-1 min-w-[140px]">
          <Text className="text-white text-xs opacity-80 mb-0.5">Total jobs</Text>
          <Text className="text-white text-xl font-semibold">{stats?.totalJobs ?? 0}</Text>
        </View>
        <View className="rounded-2xl bg-gray-900 px-4 py-4 flex-1 min-w-[140px]">
          <Text className="text-white text-xs opacity-80 mb-0.5">In progress</Text>
          <Text className="text-white text-xl font-semibold">{stats?.jobsInProgress ?? 0}</Text>
        </View>
        <View className="rounded-2xl bg-gray-800 px-4 py-4 flex-1 min-w-[140px]">
          <Text className="text-white text-xs opacity-80 mb-0.5">Delivered</Text>
          <Text className="text-white text-xl font-semibold">{stats?.jobsDelivered ?? 0}</Text>
        </View>
        <View className="rounded-2xl border border-gray-200 px-4 py-4 flex-1 min-w-[140px]">
          <Text className="text-gray-600 text-xs mb-0.5">Revenue (month)</Text>
          <Text className="text-gray-900 text-lg font-semibold">
            GHS {(stats?.revenueThisMonth ?? 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold">Jobs in progress</Text>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Jobs')}>
          <Text className="text-xs font-semibold text-black">View all</Text>
        </TouchableOpacity>
      </View>
      {recentJobs.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 mb-4">
          <Text className="text-gray-500 text-sm text-center">No jobs in progress</Text>
        </View>
      ) : (
        recentJobs.map((job) => (
          <TouchableOpacity
            key={job.id}
            onPress={() => navigation.getParent()?.navigate('Jobs', { screen: 'JobDetail', params: { jobId: job.id } })}
            className="rounded-2xl border border-gray-200 px-4 py-3 mb-3"
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-semibold text-sm">{job.customer?.name ?? 'Job'}</Text>
              <Text className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {job.status}
              </Text>
            </View>
            <Text className="text-xs text-gray-500">Tracking: {job.trackingId}</Text>
          </TouchableOpacity>
        ))
      )}

      <View className="mt-4 flex-row flex-wrap" style={{ gap: 10 }}>
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('Jobs')}
          className="rounded-xl border border-black px-4 py-2"
        >
          <Text className="text-black font-semibold text-sm">Jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('Account', { screen: 'Invoices' })}
          className="rounded-xl border border-black px-4 py-2"
        >
          <Text className="text-black font-semibold text-sm">Invoices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('Customers')}
          className="rounded-xl border border-black px-4 py-2"
        >
          <Text className="text-black font-semibold text-sm">Customers</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
