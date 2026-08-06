import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatsRow } from '../../components/StatsRow';
import { StatusBadge } from '../../components/StatusBadge';
import { useTheme } from '../../context/ThemeContext';

const now = new Date();
const endDate = now.toISOString().slice(0, 10);
const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const ReportsScreen: React.FC = () => {
  const { accent } = useTheme();
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
    <View className="flex-1 bg-white">
      <ScreenHeader title="Reports" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        <Text className="text-gray-500 text-sm mb-4">
          Last 30 days · {startDate} to {endDate}
        </Text>

        <StatsRow className="mb-4">
          <View
            className="rounded-xl border border-gray-300 px-4 py-4"
            style={{ backgroundColor: accent }}
          >
            <Text className="text-xs text-white/70 mb-1">Jobs</Text>
            <Text className="text-lg font-semibold text-white">
              {summary?.totalJobs ?? 0}
            </Text>
          </View>
          <View
            className="rounded-xl border border-gray-300 px-4 py-4"
            style={{ backgroundColor: accent }}
          >
            <Text className="text-xs text-white/70 mb-1">Completed</Text>
            <Text className="text-lg font-semibold text-white">
              {summary?.completedJobs ?? 0}
            </Text>
          </View>
          <View
            className="rounded-xl border border-gray-300 px-4 py-4"
            style={{ backgroundColor: accent }}
          >
            <Text className="text-xs text-white/70 mb-1">Revenue</Text>
            <Text
              className="text-lg font-semibold text-white"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              GHS {(summary?.totalRevenue ?? 0).toFixed(2)}
            </Text>
          </View>
          <View
            className="rounded-xl border border-gray-300 px-4 py-4"
            style={{ backgroundColor: accent }}
          >
            <Text className="text-xs text-white/70 mb-1">Customers</Text>
            <Text className="text-lg font-semibold text-white">
              {summary?.activeCustomers ?? 0}
            </Text>
          </View>
        </StatsRow>

        {Array.isArray(jobStatus) && jobStatus.length > 0 && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Jobs by status</Text>
            {jobStatus.map((item) => (
              <View
                key={item.status}
                className="mb-3 rounded-xl border border-gray-300 px-4 py-3 flex-row justify-between items-center"
              >
                <StatusBadge label={item.status} uppercase />
                <Text className="text-sm font-semibold">{item.count}</Text>
              </View>
            ))}
          </View>
        )}

        <Text className="text-gray-500 text-xs">
          Export (PDF/XLSX) and more charts can be added here or triggered from the web app.
        </Text>
      </ScrollView>
    </View>
  );
};
