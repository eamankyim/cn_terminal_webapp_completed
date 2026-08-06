import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTheme } from '../../context/ThemeContext';
import { ACCENT, type ColorScheme } from '../../theme/colors';

const OPTIONS: { scheme: ColorScheme; label: string; description: string }[] = [
  {
    scheme: 'black',
    label: 'Black',
    description: 'Monochrome — current default look',
  },
  {
    scheme: 'blue',
    label: 'Blue',
    description: 'Blue accents for tabs, buttons, and chrome',
  },
];

export const AppearanceScreen: React.FC = () => {
  const { colorScheme, accent, setColorScheme } = useTheme();

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Appearance" />
      <View className="px-4">
        <Text className="text-sm text-gray-500 mb-6">
          Choose the accent color for buttons, tabs, and interactive controls.
          Body text stays black for readability.
        </Text>

        {OPTIONS.map((opt) => {
          const selected = colorScheme === opt.scheme;
          const swatch = ACCENT[opt.scheme];
          return (
            <TouchableOpacity
              key={opt.scheme}
              onPress={() => void setColorScheme(opt.scheme)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label}
              className="flex-row items-center rounded-xl border px-4 py-4 mb-3"
              style={{
                borderColor: selected ? accent : '#e5e5e5',
                borderWidth: selected ? 2 : 1,
              }}
            >
              <View
                className="w-10 h-10 rounded-full mr-3 border border-gray-200"
                style={{ backgroundColor: swatch }}
              />
              <View className="flex-1 mr-2">
                <Text className="text-base font-semibold text-black">
                  {opt.label}
                </Text>
                <Text className="text-sm text-gray-500 mt-0.5">
                  {opt.description}
                </Text>
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={selected ? accent : '#ccc'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
