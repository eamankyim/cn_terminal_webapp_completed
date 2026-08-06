import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import type { Invoice } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PERMISSIONS } from '../../utils/permissions';

interface InvoiceDetailResponse {
  invoice: Invoice & {
    payments?: { id: string; amount: number; date: string }[];
  };
}

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const InvoiceDetailScreen: React.FC<Props> = ({ navigation }) => {
  const { accent } = useTheme();
  const route = useRoute<any>();
  const invoiceId: string = route.params?.invoiceId;
  const { hasPermission } = useAuth();
  const canRecordPayment = hasPermission(PERMISSIONS.INVOICE_EDIT);

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () =>
      api.get<InvoiceDetailResponse>(`/invoices/${invoiceId}`),
  });

  if (isLoading || !data?.invoice) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading invoice…</Text>
      </View>
    );
  }

  const invoice = data.invoice;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Invoice" />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6">
        <Text className="text-base font-semibold mb-1">
          #{invoice.invoiceNumber}
        </Text>
        <Text className="text-xs text-gray-500 mb-3">
          {invoice.customer?.name ?? 'Customer'}
        </Text>

        <View className="flex-row items-center mb-4">
          <StatusBadge label={invoice.status} className="mr-2" />
          <Text className="text-sm font-semibold">
            GHS {invoice.amount.toFixed(2)}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-xs text-gray-500 mb-1">Dates</Text>
          <Text className="text-xs text-gray-700">
            Issued: {invoice.issueDate} · Due: {invoice.dueDate}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2">Payments</Text>
          {invoice.payments && invoice.payments.length > 0 ? (
            invoice.payments.map((p) => (
              <View
                key={p.id}
                className="mb-2 rounded-xl border border-gray-200 px-3 py-2"
              >
                <Text className="text-xs text-gray-500 mb-0.5">
                  {p.date}
                </Text>
                <Text className="text-sm font-semibold">
                  GHS {p.amount.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-xs text-gray-500">
              No payments recorded yet.
            </Text>
          )}
        </View>

        {canRecordPayment ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('RecordPayment', { invoiceId })}
            className="rounded-xl h-[52px] items-center justify-center"
            style={{ backgroundColor: accent }}
          >
            <Text className="text-white font-semibold text-[17px]">Record payment</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};
