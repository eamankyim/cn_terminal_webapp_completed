import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import type { Enquiry } from '../../types/api';

interface EnquiryDetailResponse {
  enquiry: Enquiry;
}

export const EnquiryDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const enquiryId: string = route.params?.enquiryId;

  const { data, isLoading } = useQuery({
    queryKey: ['enquiry', enquiryId],
    queryFn: () =>
      api.get<EnquiryDetailResponse>(`/enquiries/${enquiryId}`),
  });

  if (isLoading || !data?.enquiry) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading enquiry…</Text>
      </View>
    );
  }

  const e = data.enquiry;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Enquiry" />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-base font-semibold">
            {e.customer?.name ?? 'Enquiry'}
          </Text>
          <StatusBadge label={e.status} />
        </View>

        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1">Customer</Text>
          <Text className="text-sm text-gray-800">{e.customer?.name}</Text>
          {e.customer?.email ? (
            <Text className="text-sm text-gray-600">{e.customer.email}</Text>
          ) : null}
          {e.customer?.phone ? (
            <Text className="text-sm text-gray-600">{e.customer.phone}</Text>
          ) : null}
          {e.customer?.address ? (
            <Text className="text-sm text-gray-600">{e.customer.address}</Text>
          ) : null}
        </View>

        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1">Port</Text>
          <Text className="text-sm text-gray-800">{e.port}</Text>
        </View>

        {e.commercialInvoice ? (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Commercial invoice</Text>
            <Text className="text-sm text-gray-800">{e.commercialInvoice}</Text>
          </View>
        ) : null}

        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1">Submitted</Text>
          <Text className="text-sm text-gray-800">
            {e.submittedDate ?? e.createdAt}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};
