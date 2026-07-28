import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/http';

interface Props {
  navigation: {
    goBack: () => void;
  };
}

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage('If this email exists, a reset link has been sent.');
    } catch (e: any) {
      setError(e?.message ?? 'Unable to send reset link');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-semibold text-black mb-2">
          Forgot Password
        </Text>
        <Text className="text-gray-500 mb-6">
          Enter your email address and we&apos;ll send you a password reset
          link.
        </Text>

        {message ? (
          <Text className="text-green-600 mb-3 text-sm">{message}</Text>
        ) : null}
        {error ? (
          <Text className="text-red-600 mb-3 text-sm">{error}</Text>
        ) : null}

        <View className="mb-4">
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

        <TouchableOpacity
          disabled={submitting}
          onPress={onSubmit}
          className="bg-black rounded-lg py-3 items-center mb-4"
        >
          <Text className="text-white font-semibold">
            {submitting ? 'Sending...' : 'Send reset link'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={navigation.goBack}>
          <Text className="text-center text-gray-600 text-sm">Back to login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

