import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/http';
import { API_BASE_URL } from '../../config/env';
import type { InitCheckResponse } from '../../types/api';

interface Props {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export const SetupScreen: React.FC<Props> = ({ navigation }) => {
  const [checking, setChecking] = useState(true);
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await api.get<InitCheckResponse>('/init/check');
      setInitialized(res.initialized);
      if (res.initialized) {
        navigation.navigate('Login');
      }
    } catch (e: any) {
      setInitialized(null);
      const message =
        e?.message === 'Network request failed'
          ? `Cannot reach the server at ${API_BASE_URL}. Check EXPO_PUBLIC_API_URL and that your device can reach the backend.`
          : (e?.message ?? 'Unable to check initialization state');
      setError(message);
    } finally {
      setChecking(false);
    }
  }, [navigation]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/init/super-admin', {
        name,
        email,
        password,
      });
      navigation.navigate('Login');
    } catch (e: any) {
      setError(e?.message ?? 'Unable to create super admin');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <ActivityIndicator color="#000000" size="large" />
        <Text className="text-gray-600 mt-4">Checking system status…</Text>
      </View>
    );
  }

  // Failed to reach /init/check — show error instead of spinning forever
  if (error && initialized === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-xl font-semibold text-black mb-2 text-center">
          Cannot reach server
        </Text>
        <Text className="text-red-600 mb-6 text-sm text-center">{error}</Text>
        <TouchableOpacity
          onPress={() => void checkStatus()}
          className="bg-black rounded-lg py-3 px-8 items-center mb-3 w-full"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          className="border border-gray-300 rounded-lg py-3 px-8 items-center w-full"
        >
          <Text className="text-black font-semibold">Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (initialized) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-semibold text-black mb-2">
          Initial Setup
        </Text>
        <Text className="text-gray-500 mb-4">
          Create the first super administrator account.
        </Text>

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
          <Text className="text-xs font-medium text-gray-600 mb-1">
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Create a strong password"
            className="border border-gray-300 rounded-lg px-3 py-3 text-base"
          />
        </View>

        <TouchableOpacity
          disabled={submitting}
          onPress={onSubmit}
          className="bg-black rounded-lg py-3 items-center mb-4"
        >
          <Text className="text-white font-semibold">
            {submitting ? 'Creating account...' : 'Create super admin'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
