import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/http';
import type { User } from '../../types/api';

export const ProfileScreen: React.FC = () => {
  const { user, refreshMe } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get<{ user: User }>('/auth/profile');
        setName(res.user.name);
        setEmail(res.user.email);
        setPhone((res.user as any).phone ?? '');
      } catch {
        // ignore initial profile errors
      }
    };
    void loadProfile();
  }, []);

  const onSave = async () => {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.put('/auth/profile', { name, email, phone });
      setMessage('Profile updated.');
      await refreshMe();
    } catch (e: any) {
      setError(e?.message ?? 'Unable to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 px-4 pt-6">
        <Text className="text-2xl font-semibold mb-4">Profile</Text>

        {message ? (
          <Text className="text-green-600 mb-3 text-sm">{message}</Text>
        ) : null}
        {error ? (
          <Text className="text-red-600 mb-3 text-sm">{error}</Text>
        ) : null}

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            className="border border-gray-300 rounded-lg px-3 py-3 text-base"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            className="border border-gray-300 rounded-lg px-3 py-3 text-base"
          />
        </View>

        <View className="mb-6">
          <Text className="text-xs font-medium text-gray-600 mb-1">Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Phone number"
            className="border border-gray-300 rounded-lg px-3 py-3 text-base"
          />
        </View>

        <TouchableOpacity
          disabled={submitting}
          onPress={onSave}
          className="bg-black rounded-lg py-3 items-center mt-auto mb-6"
        >
          <Text className="text-white font-semibold text-sm">
            {submitting ? 'Saving…' : 'Save changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

