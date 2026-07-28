import React from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';

interface RoleWithPermissions {
  role: string;
  name: string;
  displayName?: string;
  description?: string;
  /** Backend returns permission names as strings */
  permissions: string[];
  permissionCount?: number;
  userCount?: number;
}

interface RolesResponse {
  success?: boolean;
  roles: RoleWithPermissions[];
  totalRoles?: number;
}

export const RolesPermissionsScreen: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<RolesResponse>('/roles'),
  });

  const roles = data?.roles ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading roles…</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-4 py-6">
      <Text className="text-2xl font-semibold mb-4">Roles & permissions</Text>
      <FlatList
        data={roles}
        scrollEnabled={false}
        keyExtractor={(item) => item.role}
        renderItem={({ item }) => {
          const perms = item.permissions ?? [];
          return (
            <View className="mb-4 rounded-2xl border border-gray-200 px-4 py-3">
              <Text className="font-semibold text-sm mb-1">
                {item.displayName ?? item.name}
              </Text>
              <Text className="text-xs text-gray-500 mb-2">
                {item.role} · {perms.length} permissions
                {item.userCount != null ? ` · ${item.userCount} users` : ''}
              </Text>
              {perms.slice(0, 4).map((perm) => (
                <Text key={perm} className="text-xs text-gray-700 mb-0.5">
                  • {perm}
                </Text>
              ))}
              {perms.length > 4 ? (
                <Text className="text-xs text-gray-500 mt-1">
                  + {perms.length - 4} more…
                </Text>
              ) : null}
            </View>
          );
        }}
      />
    </ScrollView>
  );
};
