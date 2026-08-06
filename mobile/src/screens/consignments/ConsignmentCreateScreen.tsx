import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Consignment } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';

interface CreateConsignmentResponse {
  consignment: Consignment;
  message: string;
}

export const ConsignmentCreateScreen: React.FC = () => {
  const { accent } = useTheme();
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
      <ScreenHeader title="New consignment" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Consignee name *</Text>
          <Input
            value={consigneeName}
            onChangeText={setConsigneeName}
            placeholder="Full name"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Consignee phone *</Text>
          <Input
            value={consigneePhone}
            onChangeText={setConsigneePhone}
            placeholder="+233..."
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Consignee address *</Text>
          <Input
            value={consigneeAddress}
            onChangeText={setConsigneeAddress}
            placeholder="Full address"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Ghana Card (optional)</Text>
          <Input
            value={ghanaCard}
            onChangeText={setGhanaCard}
            placeholder="Optional"
            editable={!loading}
          />
        </View>
        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">TIN (optional)</Text>
          <Input
            value={tin}
            onChangeText={setTin}
            placeholder="Optional"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="rounded-xl h-[52px] items-center justify-center"
        style={{ backgroundColor: accent }}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-[17px]">Create consignment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
