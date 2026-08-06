import React, { useEffect, useState } from 'react';
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
      invitationId?: string;
    };
  };
  navigation: {
    navigate: (screen: string) => void;
  };
}

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
}

export const AcceptInvitationScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { accent } = useTheme();
  const invitationId = route.params?.invitationId ?? '';
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ invitation: InvitationDetails }>(
          `/invitations/${invitationId}/validate`,
        );
        setInvitation(res.invitation);
      } catch (e: any) {
        setError(e?.message ?? 'Invitation is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };
    if (invitationId) void load();
  }, [invitationId]);

  const onSubmit = async () => {
    if (!invitationId) {
      setError('Missing invitation id');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/invitations/${invitationId}/accept`, {
        name,
        password,
        confirmPassword,
      });
      navigation.navigate('Login');
    } catch (e: any) {
      setError(e?.message ?? 'Unable to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600">Loading invitation...</Text>
      </View>
    );
  }

  if (!invitation) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-red-600 text-center">
          {error ?? 'Invitation not found.'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-semibold text-black mb-2">
          Accept Invitation
        </Text>
        <Text className="text-gray-500 mb-4">
          Complete your account for <Text className="font-semibold">{invitation.email}</Text>.
        </Text>

        {error ? (
          <Text className="text-red-600 mb-3 text-sm">{error}</Text>
        ) : null}

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">Name</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            Email (read only)
          </Text>
          <Input
            value={invitation.email}
            editable={false}
            className="border-gray-200 bg-gray-50 text-gray-600"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            Password
          </Text>
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Create a strong password"
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
            {submitting ? 'Creating account...' : 'Create account'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

