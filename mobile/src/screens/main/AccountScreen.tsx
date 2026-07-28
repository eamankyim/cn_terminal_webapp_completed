import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const AccountScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-4 py-6">
      <Text className="text-2xl font-semibold mb-4">Account</Text>

      <View className="rounded-2xl bg-black px-4 py-5 mb-6">
        <Text className="text-white text-sm mb-1">Signed in as</Text>
        <Text className="text-white text-lg font-semibold">
          {user?.name ?? 'User'}
        </Text>
        <Text className="text-gray-300 text-xs mt-1">{user?.email}</Text>
      </View>

      <View className="space-y-3">
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          className="rounded-2xl border border-gray-200 px-4 py-3"
        >
          <Text className="font-semibold text-sm mb-1">Notifications</Text>
          <Text className="text-xs text-gray-500">
            View alerts about jobs, invoices, and system changes.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          className="rounded-2xl border border-gray-200 px-4 py-3"
        >
          <Text className="font-semibold text-sm mb-1">Profile</Text>
          <Text className="text-xs text-gray-500">
            Update your personal details and contact information.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('ChangePassword')}
          className="rounded-2xl border border-gray-200 px-4 py-3"
        >
          <Text className="font-semibold text-sm mb-1">Change password</Text>
          <Text className="text-xs text-gray-500">
            Update your CN Terminal account password.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Invoices')}
          className="rounded-2xl border border-gray-200 px-4 py-3"
        >
          <Text className="font-semibold text-sm mb-1">Invoices</Text>
          <Text className="text-xs text-gray-500">
            View and manage customer invoices and payments.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Estimates')}
          className="rounded-2xl border border-gray-200 px-4 py-3"
        >
          <Text className="font-semibold text-sm mb-1">Estimates</Text>
          <Text className="text-xs text-gray-500">
            Review and send estimates for upcoming jobs.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('AccountingOverview')}
          className="rounded-2xl border border-gray-200 px-4 py-3"
        >
          <Text className="font-semibold text-sm mb-1">
            Accounting overview
          </Text>
          <Text className="text-xs text-gray-500">
            High-level cashflow, expenses, and payouts summary.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Reports')}
          className="rounded-2xl border border-gray-200 px-4 py-3"
        >
          <Text className="font-semibold text-sm mb-1">Reports</Text>
          <Text className="text-xs text-gray-500">
            Summary and job status reports for the last 30 days.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('MyRequests')}
          className="rounded-2xl border border-gray-200 px-4 py-3"
        >
          <Text className="font-semibold text-sm mb-1">My expense requests</Text>
          <Text className="text-xs text-gray-500">
            Submit and track your expense requests.
          </Text>
        </TouchableOpacity>

        {(user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ExpenseRequests')}
            className="rounded-2xl border border-gray-200 px-4 py-3"
          >
            <Text className="font-semibold text-sm mb-1">Expense requests</Text>
            <Text className="text-xs text-gray-500">
              Review and approve or reject expense requests.
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => {
            Alert.alert('Sign out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
            ]);
          }}
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 mt-4"
        >
          <Text className="font-semibold text-sm text-red-700">Sign out</Text>
        </TouchableOpacity>

        {(user?.role === 'ADMIN' || user?.role === 'IT_CONSULTANT') && (
          <>
            <View className="mt-4 mb-1">
              <Text className="text-xs font-semibold text-gray-500">
                Admin
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('AdminUsers')}
              className="rounded-2xl border border-gray-200 px-4 py-3"
            >
              <Text className="font-semibold text-sm mb-1">Users</Text>
              <Text className="text-xs text-gray-500">
                View all users, their roles, and status.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('RolesPermissions')}
              className="rounded-2xl border border-gray-200 px-4 py-3"
            >
              <Text className="font-semibold text-sm mb-1">
                Roles & permissions
              </Text>
              <Text className="text-xs text-gray-500">
                Inspect how access is configured across the system.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Configurations')}
              className="rounded-2xl border border-gray-200 px-4 py-3"
            >
              <Text className="font-semibold text-sm mb-1">Configuration</Text>
              <Text className="text-xs text-gray-500">
                View grouped tax, service, and system settings.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Invites')}
              className="rounded-2xl border border-gray-200 px-4 py-3"
            >
              <Text className="font-semibold text-sm mb-1">Invitations</Text>
              <Text className="text-xs text-gray-500">
                Send invites and view pending invitations.
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

