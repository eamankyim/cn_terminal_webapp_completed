import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { api } from '../../api/http';
import { useTheme } from '../../context/ThemeContext';

export const ChangePasswordScreen: React.FC = () => {
  const { accent } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e?.message ?? 'Unable to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Change password" />
      <View className="flex-1 px-4">
        {message ? (
          <Text className="text-green-600 mb-3 text-sm">{message}</Text>
        ) : null}
        {error ? (
          <Text className="text-red-600 mb-3 text-sm">{error}</Text>
        ) : null}

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            Current password
          </Text>
          <Input
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Enter current password"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            New password
          </Text>
          <Input
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Enter new strong password"
          />
        </View>

        <View className="mb-6">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            Confirm new password
          </Text>
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Re-enter new password"
          />
        </View>

        <TouchableOpacity
          disabled={submitting}
          onPress={onSubmit}
          className="rounded-xl h-[52px] items-center justify-center mt-auto mb-6"
          style={{ backgroundColor: accent }}
        >
          <Text className="text-white font-semibold text-[17px]">
            {submitting ? 'Saving…' : 'Save password'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
