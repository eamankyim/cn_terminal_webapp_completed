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
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Customer } from '../../types/api';

interface CreateCustomerResponse {
  customer: Customer;
}

export const CustomerCreateScreen: React.FC = () => {
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
      email: string;
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
    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedAddress) {
      Alert.alert('Validation', 'Name, email, phone, and address are required.');
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
      email: trimmedEmail,
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-lg font-semibold mb-4">New customer</Text>

        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Company or full name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            autoCapitalize="words"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Email *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Phone *</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+233..."
            keyboardType="phone-pad"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Address *</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Full address"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Contact person</Text>
          <TextInput
            value={contactPerson}
            onChangeText={setContactPerson}
            placeholder="Optional"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-4">
          <Text className="text-sm text-gray-600 mb-1">Ghana Card *</Text>
          <TextInput
            value={ghanaCard}
            onChangeText={setGhanaCard}
            placeholder="Required if no TIN"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            editable={!loading}
          />
        </View>
        <View className="mb-6">
          <Text className="text-sm text-gray-600 mb-1">TIN *</Text>
          <TextInput
            value={tin}
            onChangeText={setTin}
            placeholder="Required if no Ghana Card"
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
            <Text className="text-white font-semibold text-sm">Create customer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
