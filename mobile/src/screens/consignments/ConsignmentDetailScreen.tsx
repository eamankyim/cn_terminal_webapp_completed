import { Button } from '../../components/Button';
import { Workflow, showError, confirmAction } from '../../components/Workflow';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import { EntityDocuments } from '../../components/EntityDocuments';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import type { Consignment } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';

interface ConsignmentDetailResponse {
  consignment: Consignment;
}

export const ConsignmentDetailScreen: React.FC = () => {
  const { accent } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const consignmentId: string = route.params?.consignmentId;

  const { hasPermission } = useAuth();
  const client = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['consignment', consignmentId],
    queryFn: () =>
      api.get<ConsignmentDetailResponse>(`/consignments/${consignmentId}`),
  });

  const remove = useMutation({ mutationFn: () => {
    if (!hasPermission(PERMISSIONS.CUSTOMER_DELETE)) throw new Error('Delete access required.');
    return api.delete(`/consignments/${consignmentId}`);
  }, onSuccess: () => { void client.invalidateQueries(); navigation.goBack(); }, onError: showError });
  if (error) return <Workflow title="Consignment" error={error} retry={() => void refetch()} />;
  if (isLoading || !data?.consignment) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading…</Text>
      </View>
    );
  }

  const c = data.consignment;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Consignment" />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-base font-semibold">
            {c.consigneeName ?? 'Consignment'}
          </Text>
          <StatusBadge label={c.status} />
        </View>

        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1">Tracking ID</Text>
          <Text className="text-sm text-gray-800">{c.trackingId}</Text>
        </View>
        {c.consigneePhone ? (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Phone</Text>
            <Text className="text-sm text-gray-800">{c.consigneePhone}</Text>
          </View>
        ) : null}
        {c.consigneeAddress ? (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Address</Text>
            <Text className="text-sm text-gray-800">{c.consigneeAddress}</Text>
          </View>
        ) : null}
        {c.ghanaCard ? (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Ghana Card</Text>
            <Text className="text-sm text-gray-800">{c.ghanaCard}</Text>
          </View>
        ) : null}
        {c.tin ? (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">TIN</Text>
            <Text className="text-sm text-gray-800">{c.tin}</Text>
          </View>
        ) : null}
        {c.customer ? (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Customer</Text>
            <Text className="text-sm text-gray-800">{c.customer.name}</Text>
          </View>
        ) : null}

        {hasPermission(PERMISSIONS.CUSTOMER_EDIT) && <TouchableOpacity
          onPress={() =>
            navigation.navigate('ConsignmentEdit', { consignmentId: c.id })
          }
          className="mt-4 rounded-xl h-[52px] items-center justify-center"
          style={{ backgroundColor: accent }}
        >
          <Text className="text-white font-semibold text-[17px]">Edit consignment</Text>
        </TouchableOpacity>}
        <EntityDocuments entityType="consignment" entityId={consignmentId} />
        {hasPermission(PERMISSIONS.CUSTOMER_DELETE) && <Button title="Delete consignment" variant="ghost" loading={remove.isPending} onPress={() => confirmAction('Delete consignment?', () => remove.mutate())} />}
      </ScrollView>
    </View>
  );
};
