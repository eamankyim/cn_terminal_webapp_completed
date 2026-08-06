import React, { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DetailBottomSheet } from './DetailBottomSheet';
import { useAuth } from '../context/AuthContext';
import { getMoreMenuLinks, MORE_MENU_ICONS } from '../utils/permissions';
import type { AccountStackParamList } from '../navigation/AccountStack';

type MenuDestination = keyof AccountStackParamList;

type MenuRow =
  | {
      kind: 'link';
      key: string;
      label: string;
      screen: MenuDestination;
      icon: keyof typeof Ionicons.glyphMap;
    }
  | {
      kind: 'action';
      key: string;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      onPress: () => void;
    };

interface MoreMenuSheetProps {
  visible: boolean;
  onClose: () => void;
}

function MenuLinkRow({
  label,
  icon,
  onPress,
  isLast,
  showChevron = true,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isLast?: boolean;
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center py-5 ${isLast ? '' : 'border-b border-gray-200'}`}
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

export const MoreMenuSheet: React.FC<MoreMenuSheetProps> = ({
  visible,
  onClose,
}) => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const rows = useMemo((): MenuRow[] => {
    const items: MenuRow[] = getMoreMenuLinks(user).map((link) => ({
      kind: 'link' as const,
      key: link.key,
      label: link.label,
      screen: link.screen as MenuDestination,
      icon: MORE_MENU_ICONS[link.key] as keyof typeof Ionicons.glyphMap,
    }));

    items.push({
      kind: 'action',
      key: 'sign-out',
      label: 'Sign out',
      icon: MORE_MENU_ICONS['sign-out'] as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        Alert.alert('Sign out', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign out',
            style: 'destructive',
            onPress: () => {
              onClose();
              void logout();
            },
          },
        ]);
      },
    });

    return items;
  }, [logout, onClose, user]);

  const goTo = (screen: MenuDestination) => {
    onClose();
    // Let the sheet dismiss before pushing the stack screen.
    setTimeout(() => {
      // @ts-expect-error nested Account stack screen
      navigation.navigate('Account', { screen });
    }, 80);
  };

  return (
    <DetailBottomSheet visible={visible} onClose={onClose} heightRatio={0.88}>
      <View className="flex-1 px-5">
        <Text className="text-2xl font-bold text-black tracking-tight pb-2 pt-1">
          More
        </Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {rows.map((row, index) => {
            const isLast = index === rows.length - 1;
            if (row.kind === 'action') {
              return (
                <MenuLinkRow
                  key={row.key}
                  label={row.label}
                  icon={row.icon}
                  isLast={isLast}
                  showChevron={false}
                  onPress={row.onPress}
                />
              );
            }
            return (
              <MenuLinkRow
                key={row.key}
                label={row.label}
                icon={row.icon}
                isLast={isLast}
                onPress={() => goTo(row.screen)}
              />
            );
          })}
        </ScrollView>
      </View>
    </DetailBottomSheet>
  );
};
