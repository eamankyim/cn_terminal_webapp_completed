import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Include safe-area top inset (default true). */
  safeTop?: boolean;
}

/** Consistent inner-page header with optional back chevron. */
export const ScreenHeader: React.FC<Props> = ({
  title,
  subtitle,
  showBack = true,
  onBack,
  right,
  safeTop = true,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      className="px-4 pb-3"
      style={{ paddingTop: safeTop ? Math.max(insets.top, 8) : 8 }}
    >
      <View className="flex-row items-center justify-between min-h-[44px]">
        <View className="w-10 items-start">
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={28} color="#000" />
            </TouchableOpacity>
          ) : (
            <View className="w-7" />
          )}
        </View>
        <View className="flex-1 items-center px-2">
          <Text className="text-lg font-bold text-black text-center" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-sm text-gray-500 text-center mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View className="w-10 items-end">{right ?? <View className="w-7" />}</View>
      </View>
    </View>
  );
};
