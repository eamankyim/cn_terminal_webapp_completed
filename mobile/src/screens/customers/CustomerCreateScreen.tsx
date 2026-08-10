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
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Customer } from '../../types/api';
import { useTheme } from '../../context/ThemeContext';

interface CreateCustomerResponse {
  customer: Customer;
}

export const CustomerCreateScreen: React.FC = () => {
  const { accent } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [ghanaCard, setGhanaCard] = useState('');
  const [tin, setTin] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      email?: string | null;
      phone: string;
      address: string;
      contactPerson?: string;
      ghanaCard?: string;
      tin?: string;
    }) =>
      api.post<CreateCustomerResponse>('/customers', payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      Alert.alert('Success', 'Customer created successfully.', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('CustomerDetail', {
              customerId: data.customer.id,
            }),
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ?? err?.message ?? 'Failed to create customer.',
      );
    },
  });

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    if (!trimmedName || !trimmedPhone || !trimmedAddress) {
      Alert.alert('Validation', 'Name, phone, and address are required.');
      return;
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert('Validation', 'Please enter a valid email address.');
      return;
    }
    if (!ghanaCard.trim() && !tin.trim()) {
      Alert.alert(
        'Validation',
        'Provide Ghana Card or TIN so jobs can be created for this customer.',
      );
      return;
    }
    createMutation.mutate({
      name: trimmedName,
      email: trimmedEmail || null,
      phone: trimmedPhone,
      address: trimmedAddress,
      ...(contactPerson.trim() ? { contactPerson: contactPerson.trim() } : {}),
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
      <ScreenHeader title="New customer" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Name *</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Company or full name"
            autoCapitalize="words"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Email</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com (optional)"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Phone *</Text>
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="+233..."
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Address *</Text>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="Full address"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Contact person</Text>
          <Input
            value={contactPerson}
            onChangeText={setContactPerson}
            placeholder="Optional"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Ghana Card *</Text>
          <Input
            value={ghanaCard}
            onChangeText={setGhanaCard}
            placeholder="Required if no TIN"
            editable={!loading}
          />
        </View>
        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">TIN *</Text>
          <Input
            value={tin}
            onChangeText={setTin}
            placeholder="Required if no Ghana Card"
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
            <Text className="text-white font-semibold text-[17px]">Create customer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
