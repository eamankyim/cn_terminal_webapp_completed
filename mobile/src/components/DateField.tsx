import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { controlHeight } from '../theme/inputs';
import { useTheme } from '../context/ThemeContext';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Format as YYYY-MM-DD for API payloads. */
export function toDateOnlyIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD (or ISO datetime) into a local Date at noon. */
export function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const datePart = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplay(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

interface Props {
  label?: string;
  value: string | null;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  minimumDate?: Date;
}

/** Date-only calendar field (YYYY-MM-DD). */
export const DateField: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  helpText,
  disabled,
  minimumDate,
}) => {
  const insets = useSafeAreaInsets();
  const { accent } = useTheme();
  const selected = parseDateOnly(value);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(selected ?? new Date());

  const openPicker = () => {
    if (disabled) return;
    setDraft(selected ?? new Date());
    setOpen(true);
  };

  const commit = (date: Date) => {
    onChange(toDateOnlyIso(date));
  };

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setOpen(false);
    if (event.type === 'set' && date) {
      commit(date);
    }
  };

  const onIosChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDraft(date);
  };

  return (
    <View>
      {label ? (
        <Text className="text-sm text-gray-600 mb-1">{label}</Text>
      ) : null}
      <TouchableOpacity
        onPress={openPicker}
        disabled={disabled}
        activeOpacity={0.7}
        className="flex-row items-center justify-between border border-gray-300 rounded-xl px-4"
        style={{ height: controlHeight, opacity: disabled ? 0.5 : 1 }}
      >
        <Text
          className={`text-base flex-1 mr-2 ${
            selected ? 'text-black' : 'text-gray-400'
          }`}
        >
          {selected ? formatDisplay(selected) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>
      {helpText ? (
        <Text className="text-xs text-gray-500 mt-1">{helpText}</Text>
      ) : null}

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          onChange={onAndroidChange}
          minimumDate={minimumDate}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
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
              className="bg-white rounded-t-3xl"
              style={{ paddingBottom: insets.bottom + 12 }}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="w-10 h-1 rounded-full bg-gray-300 self-center mt-3 mb-2" />
              <View className="flex-row items-center justify-between px-5 mb-2">
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <Text className="text-base text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-black">
                  {(label ?? 'Date').replace(/\s*\*$/, '')}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    commit(draft);
                    setOpen(false);
                  }}
                >
                  <Text
                    className="text-base font-semibold"
                    style={{ color: accent }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                onChange={onIosChange}
                minimumDate={minimumDate}
                style={{ alignSelf: 'center' }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
};
