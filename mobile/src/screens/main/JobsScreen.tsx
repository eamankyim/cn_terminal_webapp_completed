import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/http';
import type { Job, JobsListResponse } from '../../types/api';
import { useJobSocket } from '../../realtime/useJobSocket';
import type { JobsStackParamList } from '../../navigation/types';
import { DetailBottomSheet } from '../../components/DetailBottomSheet';
import { StatsRow } from '../../components/StatsRow';
import { StatusBadge } from '../../components/StatusBadge';
import { controlHeight, inputs } from '../../theme/inputs';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PERMISSIONS } from '../../utils/permissions';
import { JobDetailContent } from '../jobs/JobDetailScreen';

const PAGE_SIZE = 20;

const FILTER_STATUSES = [
  'IN_PROGRESS',
  'NEW',
  'PREINVOICED',
  'INVOICED',
  'VETTED',
  'ENTRY',
  'ENTRY_COMPLETED',
  'DUTY_PAID',
  'READY_FOR_RELEASE',
  'RELEASE',
  'RELEASED',
  'CLEARED',
  'DELIVERED',
] as const;

interface DashboardStats {
  stats: {
    totalJobs: number;
    jobsInProgress: number;
    jobsDelivered: number;
    workflowStatuses?: Record<string, number>;
  };
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatJobDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatStatusLabel(status?: string): string {
  if (!status) return '—';
  return status.replace(/_/g, ' ').toUpperCase();
}

function getPagination(data?: JobsListResponse) {
  const pagination = data?.pagination as
    | {
        currentPage?: number;
        page?: number;
        totalPages?: number;
        pages?: number;
        totalCount?: number;
        total?: number;
      }
    | undefined;
  return {
    currentPage: pagination?.currentPage ?? pagination?.page ?? 1,
    totalPages: Math.max(
      1,
      pagination?.totalPages ?? pagination?.pages ?? 1,
    ),
    totalCount: pagination?.totalCount ?? pagination?.total ?? 0,
  };
}

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const JobsListScreen: React.FC<Props> = ({ navigation }) => {
  const route = useRoute<RouteProp<JobsStackParamList, 'JobsList'>>();
  const insets = useSafeAreaInsets();
  const { hasPermission } = useAuth();
  const { accent } = useTheme();
  const canCreateJob = hasPermission(PERMISSIONS.JOB_CREATE);

  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    route.params?.status,
  );
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    setStatusFilter(route.params?.status);
  }, [route.params?.status]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    data: statsData,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  });

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['jobs', { statusFilter, search, limit: PAGE_SIZE }],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append('page', String(pageParam));
      params.append('limit', String(PAGE_SIZE));
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      return api.get<JobsListResponse>(`/jobs?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = getPagination(lastPage);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  const jobs = useMemo(
    () => data?.pages.flatMap((page) => page.jobs ?? []) ?? [],
    [data],
  );
  const totalCount = getPagination(data?.pages[0]).totalCount;

  const stats = statsData?.stats;
  const workflow = stats?.workflowStatuses ?? {};
  const newCount = workflow.NEW ?? 0;
  const inProgressCount = stats?.jobsInProgress ?? 0;
  const completedCount =
    (stats?.jobsDelivered ?? 0) + (workflow.CLEARED ?? 0);

  const summaryItems: Array<{
    key: string;
    count: number;
    label: string;
    filter?: string | 'all';
  }> = [
    {
      key: 'total',
      count: stats?.totalJobs ?? totalCount,
      label: 'Total Jobs',
      filter: 'all',
    },
    {
      key: 'new',
      count: newCount,
      label: 'New',
      filter: 'NEW',
    },
    {
      key: 'progress',
      count: inProgressCount,
      label: 'In Progress',
      filter: 'IN_PROGRESS',
    },
    {
      key: 'completed',
      count: completedCount,
      label: 'Completed',
      filter: 'DELIVERED',
    },
  ];

  useJobSocket(
    useMemo(
      () => ({
        onJobCreated: () => {
          void refetch();
          void refetchStats();
        },
        onJobUpdated: () => {
          void refetch();
          void refetchStats();
        },
        onJobDeleted: () => {
          void refetch();
          void refetchStats();
        },
        onJobStatusUpdated: () => {
          void refetch();
          void refetchStats();
        },
        onJobCommentAdded: () => {
          void refetch();
        },
      }),
      [refetch, refetchStats],
    ),
  );

  const applyStatusFilter = (status?: string) => {
    setStatusFilter(status);
    setFilterOpen(false);
  };

  const onRefresh = () => {
    void refetch();
    void refetchStats();
  };

  const closeJobSheet = () => setSelectedJobId(null);

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  if (isLoading && !isRefetching && !data) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3 text-base">Loading jobs…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="w-10" />
        <Text className="text-lg font-bold text-black">Jobs</Text>
        {canCreateJob ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('JobCreate')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Create job"
            className="w-10 items-end"
          >
            <Ionicons name="add" size={30} color="#000" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item: Job) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View>
            <StatsRow className="mb-6 mt-1">
              {summaryItems.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  className="items-center border border-gray-300 rounded-xl px-1.5 py-3"
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item.filter === 'all') {
                      applyStatusFilter(undefined);
                      return;
                    }
                    if (!item.filter) return;
                    applyStatusFilter(
                      statusFilter === item.filter ? undefined : item.filter,
                    );
                  }}
                >
                  <Text className="text-2xl font-bold text-black">
                    {item.count}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1 text-center">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </StatsRow>

            <View className="h-px bg-gray-200 mb-5" />

            <View className="flex-row items-center mb-2" style={{ gap: 10 }}>
              <View
                className="flex-1 flex-row items-center border border-gray-300 rounded-xl px-4"
                style={{ height: controlHeight }}
              >
                <Ionicons name="search" size={20} color="#888" />
                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder="Search by Job ID, Container No, or BL"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 ml-2 text-base text-black py-0"
                  style={{ fontSize: inputs.fontSize }}
                  returnKeyType="search"
                />
                {searchInput.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setSearchInput('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => setFilterOpen(true)}
                className="flex-row items-center border border-gray-300 rounded-xl px-4"
                style={{ height: controlHeight }}
                accessibilityLabel="Filter jobs"
              >
                <Ionicons name="filter" size={18} color="#000" />
                <Text className="text-base font-medium text-black ml-1.5">
                  Filter
                </Text>
                {statusFilter ? (
                  <View
                    className="w-1.5 h-1.5 rounded-full ml-1.5"
                    style={{ backgroundColor: accent }}
                  />
                ) : null}
              </TouchableOpacity>
            </View>

            {statusFilter ? (
              <View className="flex-row items-center mb-2 mt-1" style={{ gap: 8 }}>
                <StatusBadge
                  label={formatStatusLabel(statusFilter)}
                  variant="solid"
                  size="sm"
                  uppercase
                />
                <TouchableOpacity onPress={() => applyStatusFilter(undefined)}>
                  <Text className="text-sm font-medium text-black underline">
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {totalCount > 0 ? (
              <Text className="text-sm text-gray-500 mb-1 mt-2">
                Showing {jobs.length} of {totalCount} jobs
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-base text-gray-500">No jobs found</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#000" />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedJobId(item.id)}
            activeOpacity={0.7}
            className="flex-row items-center py-5 border-b border-gray-200"
          >
            <View className="flex-1 mr-2">
              <Text className="text-xl font-bold text-black tracking-tight">
                {item.trackingId}
              </Text>
              <Text className="text-base text-black mt-1.5">
                {item.customer?.name ?? 'Unknown client'}
              </Text>
              <Text className="text-sm text-gray-500 mt-1.5">
                ETA {formatJobDate(item.eta)}
                {' · '}
                Created {formatJobDate(item.createdAt)}
              </Text>
            </View>
            <StatusBadge
              label={formatStatusLabel(item.status)}
              variant="outline"
              size="sm"
              uppercase
              className="mr-1 max-w-[42%]"
            />
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}
      />

      <DetailBottomSheet
        visible={Boolean(selectedJobId)}
        onClose={closeJobSheet}
      >
        {selectedJobId ? (
          <JobDetailContent
            jobId={selectedJobId}
            presentation="sheet"
            onClose={closeJobSheet}
            onNavigate={(screen, params) => {
              closeJobSheet();
              requestAnimationFrame(() => {
                navigation.navigate(screen, params);
              });
            }}
          />
        ) : null}
      </DetailBottomSheet>

      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setFilterOpen(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl px-5 pt-4 max-h-[80%]"
            style={{ paddingBottom: insets.bottom + 20 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-10 h-1 rounded-full bg-gray-300 self-center mb-4" />
            <Text className="text-xl font-bold text-black mb-1">Filter</Text>
            <Text className="text-base text-gray-500 mb-4">
              Filter jobs by status
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => applyStatusFilter(undefined)}
                className="flex-row items-center justify-between py-4 border-b border-gray-100"
              >
                <Text className="text-base text-black">All statuses</Text>
                {!statusFilter ? (
                  <Ionicons name="checkmark" size={20} color="#000" />
                ) : null}
              </TouchableOpacity>

              {FILTER_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => applyStatusFilter(status)}
                  className="flex-row items-center justify-between py-4 border-b border-gray-100"
                >
                  <Text className="text-base text-black">
                    {formatStatusLabel(status)}
                  </Text>
                  {statusFilter === status ? (
                    <Ionicons name="checkmark" size={20} color="#000" />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
