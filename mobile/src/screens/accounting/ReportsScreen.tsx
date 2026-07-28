import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';

const now = new Date();
const endDate = now.toISOString().slice(0, 10);
const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const ReportsScreen: React.FC = () => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['reports-summary', startDate, endDate],
    queryFn: () =>
      api.get<{
        totalJobs?: number;
        completedJobs?: number;
        pendingJobs?: number;
        totalRevenue?: number;
        activeCustomers?: number;
        avgProcessingTime?: number;
      }>(`/reports/summary?startDate=${startDate}&endDate=${endDate}`),
  });

  const { data: jobStatus } = useQuery({
    queryKey: ['reports-job-status', startDate, endDate],
    queryFn: () =>
      api.get<Array<{ status: string; count: number }>>(
        `/reports/job-status?startDate=${startDate}&endDate=${endDate}`
      ),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading reports…</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <Text className="text-2xl font-semibold mb-2">Reports</Text>
      <Text className="text-gray-500 text-sm mb-4">
        Last 30 days · {startDate} to {endDate}
      </Text>

      <View className="rounded-2xl bg-black px-4 py-4 mb-4">
        <Text className="text-white text-xs opacity-80 mb-1">Summary</Text>
        <Text className="text-white text-sm">
          Jobs: {summary?.totalJobs ?? 0} · Revenue: GHS{' '}
          {(summary?.totalRevenue ?? 0).toFixed(2)} · Customers:{' '}
          {summary?.activeCustomers ?? 0}
          {summary?.avgProcessingTime != null
            ? ` · Avg days: ${summary.avgProcessingTime}`
            : ''}
        </Text>
      </View>

      {Array.isArray(jobStatus) && jobStatus.length > 0 && (
        <View className="mb-4">
          <Text className="text-base font-semibold mb-2">Jobs by status</Text>
          {jobStatus.map((item) => (
            <View
              key={item.status}
              className="mb-3 rounded-2xl border border-gray-200 px-4 py-3 flex-row justify-between items-center"
            >
              <Text className="text-sm text-gray-800">{item.status}</Text>
              <Text className="text-sm font-semibold">{item.count}</Text>
            </View>
          ))}
        </View>
      )}

      <Text className="text-gray-500 text-xs">
        Export (PDF/XLSX) and more charts can be added here or triggered from the web app.
      </Text>
    </ScrollView>
  );
}
