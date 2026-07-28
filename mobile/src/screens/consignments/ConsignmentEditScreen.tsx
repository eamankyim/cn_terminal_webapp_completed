import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Consignment } from '../../types/api';

interface ConsignmentDetailResponse {
  consignment: Consignment;
}

export const ConsignmentEditScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const consignmentId: string = route.params?.consignmentId;
  const queryClient = useQueryClient();

  const [consigneeName, setConsigneeName] = useState('');
  const [consigneePhone, setConsigneePhone] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [ghanaCard, setGhanaCard] = useState('');
  const [tin, setTin] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['consignment', consignmentId],
    queryFn: () =>
      api.get<ConsignmentDetailResponse>(`/consignments/${consignmentId}`),
  });

  useEffect(() => {
    if (data?.consignment) {
      const c = data.consignment;
      setConsigneeName(c.consigneeName ?? '');
      setConsigneePhone(c.consigneePhone ?? '');
      setConsigneeAddress(c.consigneeAddress ?? '');
      setGhanaCard(c.ghanaCard ?? '');
      setTin(c.tin ?? '');
    }
  }, [data?.consignment]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      consigneeName?: string;
      consigneePhone?: string;
      consigneeAddress?: string;
      ghanaCard?: string;
      tin?: string;
    }) =>
      api.put<{ consignment: Consignment }>(`/consignments/${consignmentId}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['consignment', consignmentId] });
      const customerId = data?.consignment?.customerId ?? data?.consignment?.customer?.id;
      if (customerId) {
        void queryClient.invalidateQueries({ queryKey: ['consignments', customerId] });
        void queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      }
      Alert.alert('Success', 'Consignment updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ?? err?.message ?? 'Failed to update consignment.',
      );
    },
  });

  const handleSubmit = () => {
    const name = consigneeName.trim();
    const phone = consigneePhone.trim();
    const address = consigneeAddress.trim();
    if (!name || !phone || !address) {
      Alert.alert(
        'Validation',
        'Consignee name, phone, and address are required.',
      );
      return;
    }
    updateMutation.mutate({
      consigneeName: name,
      consigneePhone: phone,
      consigneeAddress: address,
      ...(ghanaCard.trim() ? { ghanaCard: ghanaCard.trim() } : {}),
      ...(tin.trim() ? { tin: tin.trim() } : {}),
    });
  };

  const loading = updateMutation.isPending;

  if (isLoading || !data?.consignment) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-lg font-semibold mb-4">Edit consignment</Text>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Consignee name *</Text>
          <TextInput
            value={consigneeName}
            onChangeText={setConsigneeName}
            placeholder="Full name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Consignee phone *</Text>
          <TextInput
            value={consigneePhone}
            onChangeText={setConsigneePhone}
            placeholder="+233..."
            keyboardType="phone-pad"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Consignee address *</Text>
          <TextInput
            value={consigneeAddress}
            onChangeText={setConsigneeAddress}
            placeholder="Full address"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Ghana Card (optional)</Text>
          <TextInput
            value={ghanaCard}
            onChangeText={setGhanaCard}
            placeholder="Optional"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">TIN (optional)</Text>
          <TextInput
            value={tin}
            onChangeText={setTin}
            placeholder="Optional"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-black rounded-lg py-3 items-center"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-sm">Save changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
