import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { controlHeight } from '../theme/inputs';
import { useTheme } from '../context/ThemeContext';

export interface SelectOption<T extends string | null = string> {
  value: T;
  label: string;
  subtitle?: string;
}

type SingleProps<T extends string | null> = {
  multi?: false;
  value: T | null;
  onChange: (value: T) => void;
};

type MultiProps<T extends string | null> = {
  multi: true;
  value: T[];
  onChange: (value: T[]) => void;
};

type Props<T extends string | null = string> = {
  label?: string;
  placeholder?: string;
  options: SelectOption<T>[];
  disabled?: boolean;
  emptyMessage?: string;
  helpText?: string;
} & (SingleProps<T> | MultiProps<T>);

export function SelectField<T extends string | null = string>(props: Props<T>) {
  const {
    label,
    placeholder = 'Select…',
    options,
    disabled,
    emptyMessage = 'No options available',
    helpText,
    multi,
  } = props;
  const insets = useSafeAreaInsets();
  const { accent } = useTheme();
  const [open, setOpen] = useState(false);

  const displayLabel = useMemo(() => {
    if (multi) {
      const selected = options.filter((o) =>
        (props.value as T[]).includes(o.value),
      );
      if (selected.length === 0) return null;
      return selected.map((s) => s.label).join(', ');
    }
    return options.find((o) => o.value === props.value)?.label ?? null;
  }, [multi, options, props.value]);

  const isSelected = (value: T) => {
    if (multi) return (props.value as T[]).includes(value);
    return props.value === value;
  };

  const toggleOption = (value: T) => {
    if (multi) {
      const current = props.value as T[];
      if (current.includes(value)) {
        props.onChange(current.filter((v) => v !== value));
      } else {
        props.onChange([...current, value]);
      }
      return;
    }
    props.onChange(value);
    setOpen(false);
  };

  return (
    <View>
      {label ? (
        <Text className="text-sm text-gray-600 mb-1">{label}</Text>
      ) : null}
      <TouchableOpacity
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
        className="flex-row items-center justify-between border border-gray-300 rounded-xl px-4"
        style={{
          minHeight: controlHeight,
          opacity: disabled ? 0.5 : 1,
          paddingVertical: 10,
        }}
      >
        <Text
          className={`text-base flex-1 mr-2 ${
            displayLabel ? 'text-black' : 'text-gray-400'
          }`}
          numberOfLines={2}
        >
          {displayLabel ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#666" />
      </TouchableOpacity>
      {helpText ? (
        <Text className="text-xs text-gray-500 mt-1">{helpText}</Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl max-h-[75%]"
            style={{ paddingBottom: insets.bottom + 12 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-10 h-1 rounded-full bg-gray-300 self-center mt-3 mb-3" />
            <View className="px-5 mb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-black flex-1">
                  {(label ?? 'Select').replace(/\s*\*$/, '')}
                </Text>
                {multi ? (
                  <TouchableOpacity onPress={() => setOpen(false)}>
                    <Text
                      className="text-base font-semibold"
                      style={{ color: accent }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {multi ? (
                <Text className="text-sm text-gray-500 mt-1">
                  Select one or more options
                </Text>
              ) : null}
            </View>

            {options.length === 0 ? (
              <View className="px-5 py-10 items-center">
                <Text className="text-base text-gray-500">{emptyMessage}</Text>
              </View>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item, index) =>
                  `${String(item.value)}-${index}`
                }
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const selected = isSelected(item.value);
                  return (
                    <TouchableOpacity
                      onPress={() => toggleOption(item.value)}
                      className="flex-row items-center px-5 py-4 border-b border-gray-100"
                      accessibilityRole={multi ? 'checkbox' : 'button'}
                      accessibilityState={{ checked: selected }}
                    >
                      {multi ? (
                        <View
                          className="w-6 h-6 rounded-full border-2 items-center justify-center mr-3"
                          style={{
                            borderColor: selected ? accent : '#D1D5DB',
                            backgroundColor: selected ? accent : 'transparent',
                          }}
                        >
                          {selected ? (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          ) : null}
                        </View>
                      ) : null}
                      <View className="flex-1 mr-3">
                        <Text
                          className={`text-base ${
                            selected ? 'font-semibold text-black' : 'text-black'
                          }`}
                        >
                          {item.label}
                        </Text>
                        {item.subtitle ? (
                          <Text className="text-sm text-gray-500 mt-0.5">
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </View>
                      {!multi && selected ? (
                        <Ionicons name="checkmark" size={22} color={accent} />
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
