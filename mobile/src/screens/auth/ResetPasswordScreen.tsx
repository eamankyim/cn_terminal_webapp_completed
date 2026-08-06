import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { api } from '../../api/http';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  route: {
    params?: {
      token?: string;
    };
  };
  navigation: {
    navigate: (screen: string) => void;
  };
}

export const ResetPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const { accent } = useTheme();
  const initialToken = route.params?.token ?? '';
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.post('/auth/reset-password', { token, password });
      setMessage('Password reset successfully. You can now log in.');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1000);
    } catch (e: any) {
      setError(e?.message ?? 'Unable to reset password');
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
          Reset Password
        </Text>
        <Text className="text-gray-500 mb-6">
          Enter your reset token and a new strong password.
        </Text>

        {message ? (
          <Text className="text-green-600 mb-3 text-sm">{message}</Text>
        ) : null}
        {error ? (
          <Text className="text-red-600 mb-3 text-sm">{error}</Text>
        ) : null}

        <View className="mb-4">
          <Text className="text-xs font-medium text-gray-600 mb-1">Token</Text>
          <Input
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            placeholder="Paste reset token"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            New password
          </Text>
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter new password"
          />
        </View>

        <View className="mb-6">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            Confirm password
          </Text>
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Re-enter password"
          />
        </View>

        <TouchableOpacity
          disabled={submitting}
          onPress={onSubmit}
          className="rounded-xl h-[52px] items-center justify-center mb-4"
        style={{ backgroundColor: accent }}>
          <Text className="text-white font-semibold text-[17px]">
            {submitting ? 'Resetting...' : 'Reset password'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

