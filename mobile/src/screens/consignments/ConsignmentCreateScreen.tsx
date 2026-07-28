import React, { useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Consignment } from '../../types/api';

interface CreateConsignmentResponse {
  consignment: Consignment;
  message: string;
}

export const ConsignmentCreateScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const customerId: string = route.params?.customerId;
  const queryClient = useQueryClient();

  const [consigneeName, setConsigneeName] = useState('');
  const [consigneePhone, setConsigneePhone] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [ghanaCard, setGhanaCard] = useState('');
  const [tin, setTin] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: {
      customerId: string;
      consigneeName: string;
      consigneePhone: string;
      consigneeAddress: string;
      ghanaCard?: string;
      tin?: string;
    }) =>
      api.post<CreateConsignmentResponse>('/consignments', payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['consignments', customerId] });
      void queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      Alert.alert('Success', 'Consignment created successfully.', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('ConsignmentDetail', {
              consignmentId: data.consignment.id,
            }),
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ?? err?.message ?? 'Failed to create consignment.',
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
    if (!ghanaCard.trim() && !tin.trim()) {
      Alert.alert(
        'Validation',
        'Provide Ghana Card or TIN for the consignee.',
      );
      return;
    }
    createMutation.mutate({
      customerId,
      consigneeName: name,
      consigneePhone: phone,
      consigneeAddress: address,
      ...(ghanaCard.trim() ? { ghanaCard: ghanaCard.trim() } : {}),
      ...(tin.trim() ? { tin: tin.trim() } : {}),
    });
  };

  const loading = createMutation.isPending;

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
        <Text className="text-lg font-semibold mb-4">New consignment</Text>

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
            <Text className="text-white font-semibold text-sm">Create consignment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
