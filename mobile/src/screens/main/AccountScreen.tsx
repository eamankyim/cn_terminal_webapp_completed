import React, { useMemo } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getMoreMenuLinks, MORE_MENU_ICONS } from '../../utils/permissions';

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

function MenuRow({
  label,
  icon,
  onPress,
  showChevron = true,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center py-5 border-b border-gray-200"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={22} color="#000" />
      <Text className="flex-1 text-lg font-bold text-black tracking-tight ml-3 mr-2">
        {label}
      </Text>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={20} color="#999" />
      ) : null}
    </TouchableOpacity>
  );
}

export const AccountScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const links = useMemo(() => getMoreMenuLinks(user), [user]);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: 32,
      }}
    >
      <Text className="text-2xl font-bold text-black tracking-tight mb-1">
        More
      </Text>
      <Text className="text-base text-gray-500 mb-4">
        {user?.name ?? 'User'}
        {user?.email ? ` · ${user.email}` : ''}
      </Text>

      {links.map((item) => (
        <MenuRow
          key={item.key}
          label={item.label}
          icon={MORE_MENU_ICONS[item.key] as keyof typeof Ionicons.glyphMap}
          onPress={() => navigation.navigate(item.screen)}
        />
      ))}

      <MenuRow
        label="Sign out"
        icon={MORE_MENU_ICONS['sign-out'] as keyof typeof Ionicons.glyphMap}
        showChevron={false}
        onPress={() => {
          Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign out',
              style: 'destructive',
              onPress: () => void logout(),
            },
          ]);
        }}
      />
    </ScrollView>
  );
};
