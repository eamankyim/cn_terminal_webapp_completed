import React from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';

interface ConfigurationItem {
  key: string;
  value: string;
  category: string;
  description?: string;
}

interface ConfigurationsResponse {
  data: Record<string, ConfigurationItem[]>;
}

export const ConfigurationsScreen: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['configurations'],
    queryFn: () => api.get<ConfigurationsResponse>('/configurations'),
  });

  if (isLoading || !data?.data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading configurations…</Text>
      </View>
    );
  }

  const groups = Object.entries(data.data);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-4 py-6">
      <Text className="text-2xl font-semibold mb-4">Configuration</Text>
      {groups.map(([groupName, items]) => (
        <View key={groupName} className="mb-5">
          <Text className="text-sm font-semibold mb-2">{groupName}</Text>
          <FlatList
            data={items}
            scrollEnabled={false}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <View className="mb-2 rounded-2xl border border-gray-200 px-4 py-3">
                <Text className="font-semibold text-xs mb-0.5">
                  {item.key}
                </Text>
                <Text className="text-xs text-gray-700 mb-0.5">
                  Value: {item.value}
                </Text>
                {item.description ? (
                  <Text className="text-xs text-gray-500">
                    {item.description}
                  </Text>
                ) : null}
              </View>
            )}
          />
        </View>
      ))}
    </ScrollView>
  );
};

