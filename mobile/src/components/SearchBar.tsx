import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { controlHeight, inputs } from '../theme/inputs';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

/** Shared search field matching the Jobs list control styling. */
export const SearchBar: React.FC<Props> = ({
  value,
  onChangeText,
  placeholder = 'Search…',
  className,
}) => {
  return (
    <View
      className={`flex-row items-center border border-gray-300 rounded-xl px-4 ${className ?? ''}`}
      style={{ height: controlHeight }}
    >
      <Ionicons name="search" size={20} color="#888" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 ml-2 text-base text-black py-0"
        style={{ fontSize: inputs.fontSize }}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={20} color="#999" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
