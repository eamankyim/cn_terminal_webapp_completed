import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type {
  NotificationItem,
  NotificationsListResponse,
} from '../../types/notifications';
import { useNotificationSocket } from '../../realtime/useNotificationSocket';

export const NotificationsScreen: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<NotificationsListResponse>('/notifications?page=1&limit=20'),
  });

  const notifications = data?.data.notifications ?? [];

  useNotificationSocket(
    useMemo(
      () => ({
        onNewNotification: () => {
          void refetch();
        },
        onUnreadCountUpdate: () => {
          void refetch();
        },
        onNotificationReadUpdate: () => {
          void refetch();
        },
        onNotificationDeleted: () => {
          void refetch();
        },
        onSystemNotification: () => {
          void refetch();
        },
      }),
      [refetch],
    ),
  );

  const markAsRead = async (notificationId: string) => {
    await api.patch(`/notifications/${notificationId}/read`, {});
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all', {});
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading notifications…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-6 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-semibold mb-1">Notifications</Text>
          <Text className="text-gray-500 text-sm">
            Updates about jobs, invoices, and system events.
          </Text>
        </View>
        <TouchableOpacity onPress={markAllRead}>
          <Text className="text-xs font-semibold text-black">Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item: NotificationItem) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => markAsRead(item.id)}
            className={`mb-3 rounded-2xl px-4 py-3 border ${
              item.isRead ? 'border-gray-200 bg-white' : 'border-black bg-black'
            }`}
          >
            <Text
              className={`font-semibold text-sm mb-1 ${
                item.isRead ? 'text-black' : 'text-white'
              }`}
            >
              {item.title}
            </Text>
            <Text
              className={`text-xs ${
                item.isRead ? 'text-gray-600' : 'text-gray-100'
              }`}
            >
              {item.message}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

