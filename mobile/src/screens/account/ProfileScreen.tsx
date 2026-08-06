import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/http';
import type { User } from '../../types/api';

export const ProfileScreen: React.FC = () => {
  const { user, refreshMe } = useAuth();
  const { accent } = useTheme();
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
      <ScreenHeader title="Profile" />
      <View className="flex-1 px-4">
        {message ? (
          <Text className="text-green-600 mb-3 text-sm">{message}</Text>
        ) : null}
        {error ? (
          <Text className="text-red-600 mb-3 text-sm">{error}</Text>
        ) : null}

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">Name</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Full name"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">Email</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
        </View>

        <View className="mb-6">
          <Text className="text-xs font-medium text-gray-600 mb-1">Phone</Text>
          <Input
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Phone number"
          />
        </View>

        <TouchableOpacity
          disabled={submitting}
          onPress={onSave}
          className="rounded-xl h-[52px] items-center justify-center mt-auto mb-6"
          style={{ backgroundColor: accent }}
        >
          <Text className="text-white font-semibold text-[17px]">
            {submitting ? 'Saving…' : 'Save changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
