import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import type { Invitation } from '../../types/api';

interface InvitationsResponse {
  invitations: Invitation[];
}

const ROLES = [
  'ADMIN',
  'IT_CONSULTANT',
  'ACCOUNTANT',
  'ENQUIRY_OFFICER',
  'ENTRY_OFFICER',
  'TRANSPORT_COORDINATOR',
  'RELEASE_OFFICER',
  'STAFF',
  'DRIVER',
];

export const InvitesScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STAFF');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => api.get<InvitationsResponse>('/invitations'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { email: string; role: string }) =>
      api.post<{ invitation: Invitation; inviteLink: string; message: string }>(
        '/invitations',
        payload
      ),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setModalVisible(false);
      setEmail('');
      setRole('STAFF');
      Alert.alert(
        'Invitation sent',
        data.inviteLink
          ? `Link: ${data.inviteLink}`
          : 'The user will receive an email with the invite link.',
      );
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        (err?.details?.error as string) ?? err?.message ?? 'Failed to send invitation.',
      );
    },
  });

  const invitations = data?.invitations ?? [];

  const handleSendInvite = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Enter an email address.');
      return;
    }
    createMutation.mutate({ email: trimmed, role });
  };

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading invitations…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-4 pb-2 flex-row justify-end">
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="rounded-lg bg-black px-3 py-2"
        >
          <Text className="text-white text-sm font-medium">Send invite</Text>
        </TouchableOpacity>
      </View>
      <Text className="px-4 text-lg font-semibold mb-2">Invitations</Text>

      <FlatList
        data={invitations}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-semibold text-base">{item.email}</Text>
              <Text className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {item.status}
              </Text>
            </View>
            <Text className="text-xs text-gray-500">
              Role: {item.role} · {item.invitedAt?.slice(0, 10)}
            </Text>
            {item.invitedByUser ? (
              <Text className="text-xs text-gray-500 mt-0.5">
                By {item.invitedByUser.name}
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center py-8">
            No invitations yet. Send one to invite a team member.
          </Text>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center bg-black/50 px-4">
          <View className="bg-white rounded-2xl p-4">
            <Text className="text-lg font-semibold mb-4">Send invitation</Text>
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">Email *</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="user@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="border border-gray-300 rounded-lg px-3 py-2 text-base"
              />
            </View>
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-1">Role</Text>
              <View className="flex-row flex-wrap gap-2">
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    className={`rounded-lg px-3 py-2 ${
                      role === r ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        role === r ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2 items-center"
              >
                <Text className="text-gray-800 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendInvite}
                disabled={createMutation.isPending}
                className="flex-1 bg-black rounded-lg py-2 items-center"
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-medium">Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
