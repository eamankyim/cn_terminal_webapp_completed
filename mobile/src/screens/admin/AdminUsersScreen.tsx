import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { User } from '../../types/api';

interface UsersResponse {
  users: User[];
}

export const AdminUsersScreen: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<UsersResponse>('/auth/users'),
  });

  const users = data?.users ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading users…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-4 pt-6">
      <Text className="text-2xl font-semibold mb-4">Users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-gray-200 px-4 py-3">
            <Text className="font-semibold text-sm mb-0.5">{item.name}</Text>
            <Text className="text-xs text-gray-500 mb-0.5">
              {item.email}
            </Text>
            <Text className="text-xs text-gray-500">
              Role: {item.role} · {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

