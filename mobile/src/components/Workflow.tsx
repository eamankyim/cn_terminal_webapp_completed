import React from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { ScreenHeader } from './ScreenHeader';
import { Button } from './Button';
import { Input, InputProps } from './Input';

export function Workflow({ title, children, loading, error, retry }: {
  title: string; children?: React.ReactNode; loading?: boolean; error?: Error | null; retry?: () => void;
}) {
  return <View className="flex-1 bg-white"><ScreenHeader title={title} />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}>
      {loading ? <ActivityIndicator /> : error ? <><Text className="text-red-700">{error.message}</Text>{retry && <Button title="Retry" onPress={retry} />}</> : children}
    </ScrollView>
  </View>;
}
export function Field({ label, ...props }: InputProps & { label: string }) {
  return <View><Text className="text-sm text-gray-600 mb-1">{label}</Text><Input {...props} /></View>;
}
export function confirmAction(title: string, action: () => void) {
  Alert.alert(title, 'This change will also be reflected on the web.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: action },
  ]);
}
export const showError = (error: Error) => Alert.alert('Unable to save', error.message);
export const options = (values: string[]) => values.map(value => ({ value, label: value.replace(/_/g, ' ') }));
