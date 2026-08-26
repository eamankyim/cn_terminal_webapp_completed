import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatsRow } from '../../components/StatsRow';
import { StatusBadge } from '../../components/StatusBadge';
import { useTheme } from '../../context/ThemeContext';

// Friendly labels for job statuses shown in reports
const JOB_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  PREINVOICED: 'Pre-invoiced',
  INVOICED: 'Invoiced',
  VETTED: 'Vetted (Legacy)',
  ENTRY_COMPLETED: 'Entry Completed',
  DUTY_PAID: 'Duty Paid',
  READY_FOR_RELEASE: 'Ready for Release',
  RELEASED: 'Released',
  CLEARED: 'Cleared',
  DELIVERED: 'Delivered',
};

const formatJobStatusLabel = (status: string) =>
  JOB_STATUS_LABELS[status]
    ?? status
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

const toDateString = (d: Date) => d.toISOString().slice(0, 10);

const PERIOD_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export const ReportsScreen: React.FC = () => {
  const { accent } = useTheme();
  const [days, setDays] = useState(30);

  // Compute the window on every period change instead of once at module
  // load so the report always covers a current range.
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    return {
      startDate: toDateString(new Date(now.getTime() - days * 24 * 60 * 60 * 1000)),
      endDate: toDateString(now),
    };
  }, [days]);

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
        <Text className="text-gray-500 text-sm mb-2">
          {startDate} to {endDate}
        </Text>

        {/* Date period filter */}
        <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
          {PERIOD_OPTIONS.map((option) => {
            const active = option.days === days;
            return (
              <Pressable
                key={option.days}
                onPress={() => setDays(option.days)}
                className="px-4 py-2 rounded-full border border-gray-300"
                style={{ backgroundColor: active ? accent : '#fff' }}
              >
                <Text
                  className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-700'}`}
                >
                  Last {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

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
                <StatusBadge label={formatJobStatusLabel(item.status)} />
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
