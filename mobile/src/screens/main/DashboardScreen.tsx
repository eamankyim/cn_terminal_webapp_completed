import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { reloadAppAsync } from 'expo';
import { api } from '../../api/http';
import { StatsRow } from '../../components/StatsRow';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PERMISSIONS, UI_PERMISSIONS } from '../../utils/permissions';
import { useNotificationSocket } from '../../realtime/useNotificationSocket';

interface DashboardStats {
  stats: {
    totalJobs: number;
    jobsInProgress: number;
    jobsDelivered: number;
    totalClients?: number;
    totalInvoices?: number;
    revenueThisMonth: number;
    workflowStatuses?: Record<string, number>;
  };
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function formatRevenue(amount: number): string {
  const rounded = Math.round(amount);
  if (Math.abs(amount - rounded) < 0.005) {
    return `${rounded} GHS`;
  }
  return `${amount.toFixed(2)} GHS`;
}

type OverviewStat = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
};

type JobsOverviewRow = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  count: number;
  onPress: () => void;
};

type QuickAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const { accent } = useTheme();
  const [hardRefreshing, setHardRefreshing] = useState(false);

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  });

  const {
    data: unreadData,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () =>
      api.get<{ success: boolean; data: { count: number } }>(
        '/notifications/unread-count',
      ),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useNotificationSocket(
    useMemo(
      () => ({
        onUnreadCountUpdate: (payload: { count?: number }) => {
          if (typeof payload?.count !== 'number') return;
          queryClient.setQueryData(
            ['notifications-unread-count'],
            { success: true, data: { count: payload.count } },
          );
        },
        onNotificationsCleared: () => {
          queryClient.setQueryData(
            ['notifications-unread-count'],
            { success: true, data: { count: 0 } },
          );
        },
      }),
      [queryClient],
    ),
  );

  const refetch = () => {
    void refetchStats();
    void refetchUnread();
  };

  const handleHardRefresh = async () => {
    if (hardRefreshing) return;
    setHardRefreshing(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await reloadAppAsync();
    } catch {
      setHardRefreshing(false);
      refetch();
    }
  };

  const isLoading = statsLoading;
  const stats = statsData?.stats;
  const unreadCount = unreadData?.data?.count ?? 0;
  const greeting = useMemo(() => getGreeting(new Date().getHours()), []);
  const displayName = user?.name?.trim() || 'User';
  const canCreateJob = hasPermission(PERMISSIONS.JOB_CREATE);
  const canCreateInvoice = hasPermission(PERMISSIONS.INVOICE_CREATE);
  const canViewReports = hasPermission(UI_PERMISSIONS.REPORTS);
  const canViewInvoices = hasPermission(UI_PERMISSIONS.INVOICES);

  const goToJobs = (params?: { status?: string }) => {
    navigation.getParent()?.navigate('Jobs', {
      screen: 'JobsList',
      params: params ?? {},
    });
  };

  const goToAccountScreen = (screen: string, params?: object) => {
    navigation.getParent()?.navigate('Account', {
      screen,
      params,
    });
  };

  const overviewStats: OverviewStat[] = [
    {
      key: 'total',
      icon: 'briefcase-outline',
      value: String(stats?.totalJobs ?? 0),
      label: 'Total Jobs',
    },
    {
      key: 'progress',
      icon: 'time-outline',
      value: String(stats?.jobsInProgress ?? 0),
      label: 'In Progress',
    },
    {
      key: 'delivered',
      icon: 'checkmark-circle-outline',
      value: String(stats?.jobsDelivered ?? 0),
      label: 'Delivered',
    },
    {
      key: 'revenue',
      icon: 'cash-outline',
      value: formatRevenue(stats?.revenueThisMonth ?? 0),
      label: 'Revenue',
    },
  ];

  const jobsOverviewRows: JobsOverviewRow[] = [
    {
      key: 'all',
      icon: 'briefcase-outline',
      title: 'All Jobs',
      subtitle: 'View all jobs',
      count: stats?.totalJobs ?? 0,
      onPress: () => goToJobs(),
    },
    {
      key: 'progress',
      icon: 'time-outline',
      title: 'In Progress',
      subtitle: 'Jobs currently in progress',
      count: stats?.jobsInProgress ?? 0,
      onPress: () => goToJobs({ status: 'IN_PROGRESS' }),
    },
    {
      key: 'delivered',
      icon: 'checkmark-circle-outline',
      title: 'Delivered',
      subtitle: 'Completed jobs',
      count: stats?.jobsDelivered ?? 0,
      onPress: () => goToJobs({ status: 'DELIVERED' }),
    },
    ...(canViewInvoices
      ? [
          {
            key: 'invoices',
            icon: 'document-text-outline' as const,
            title: 'Invoices',
            subtitle: 'View all invoices',
            count: stats?.totalInvoices ?? 0,
            onPress: () => goToAccountScreen('Invoices'),
          },
        ]
      : []),
  ];

  const quickActions: QuickAction[] = [
    ...(canCreateJob
      ? [
          {
            key: 'new-job',
            icon: 'add' as const,
            label: 'New Job',
            onPress: () =>
              navigation.getParent()?.navigate('Jobs', { screen: 'JobCreate' }),
          },
        ]
      : []),
    {
      key: 'track',
      icon: 'search-outline',
      label: 'Track Job',
      onPress: () => goToJobs(),
    },
    ...(canCreateInvoice
      ? [
          {
            key: 'invoice',
            icon: 'document-text-outline' as const,
            label: 'Create Invoice',
            onPress: () => goToAccountScreen('InvoiceCreate'),
          },
        ]
      : []),
    ...(canViewReports
      ? [
          {
            key: 'reports',
            icon: 'bar-chart-outline' as const,
            label: 'Reports',
            onPress: () => goToAccountScreen('Reports'),
          },
        ]
      : []),
  ];

  if (isLoading && !stats) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: 32,
        paddingHorizontal: 20,
      }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {/* Top bar */}
      <View className="flex-row items-center justify-end mb-5" style={{ gap: 16 }}>
        <TouchableOpacity
          onPress={() => {
            void handleHardRefresh();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Hard refresh"
          disabled={hardRefreshing}
        >
          {hardRefreshing ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="refresh-outline" size={24} color="#000" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => goToAccountScreen('Notifications')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Notifications"
        >
          <View>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {unreadCount > 0 ? (
              <View
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ backgroundColor: accent }}
              />
            ) : null}
          </View>
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <Text className="text-lg text-black mb-1">{greeting}</Text>
      <Text className="text-4xl font-bold text-black mb-1.5 tracking-tight">
        {displayName}
      </Text>
      <Text className="text-base text-gray-500 mb-7">
        Here&apos;s what&apos;s happening at your terminal today.
      </Text>

      {/* Overview */}
      <Text className="text-xl font-bold text-black mb-4">Overview</Text>
      <StatsRow className="mb-8">
        {overviewStats.map((stat) => (
          <View
            key={stat.key}
            className="items-center border border-gray-300 rounded-xl px-1 py-3"
          >
            <Ionicons name={stat.icon} size={20} color="#000" />
            <Text
              className="text-lg font-bold text-black mt-1.5 text-center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {stat.value}
            </Text>
            <Text className="text-xs text-gray-500 mt-1 text-center">
              {stat.label}
            </Text>
          </View>
        ))}
      </StatsRow>

      {/* Jobs Overview */}
      <TouchableOpacity
        className="flex-row items-center justify-between mb-1"
        onPress={() => goToJobs()}
        activeOpacity={0.7}
      >
        <Text className="text-xl font-bold text-black">Jobs Overview</Text>
        <Ionicons name="chevron-forward" size={20} color="#000" />
      </TouchableOpacity>

      <View className="mb-8">
        {jobsOverviewRows.map((row, index) => (
          <TouchableOpacity
            key={row.key}
            onPress={row.onPress}
            activeOpacity={0.7}
            className={`flex-row items-center py-4 ${
              index < jobsOverviewRows.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center mr-3">
              <Ionicons name={row.icon} size={20} color="#000" />
            </View>
            <View className="flex-1 mr-2">
              <Text className="text-base font-semibold text-black">
                {row.title}
              </Text>
              <Text className="text-sm text-gray-500 mt-0.5">{row.subtitle}</Text>
            </View>
            <Text className="text-lg font-semibold text-black mr-1">
              {row.count}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <Text className="text-xl font-bold text-black mb-3">Quick Actions</Text>
      <View className="flex-row" style={{ gap: 10 }}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.key}
            onPress={action.onPress}
            activeOpacity={0.7}
            className="flex-1 aspect-square rounded-2xl border border-gray-200 items-center justify-center px-1"
          >
            <Ionicons name={action.icon} size={24} color="#000" />
            <Text className="text-xs font-medium text-black mt-2 text-center">
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};
