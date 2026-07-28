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
import type { Invoice } from '../../types/api';

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
  const route = useRoute<any>();
  const invoiceId: string = route.params?.invoiceId;

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
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-4 py-6">
      <Text className="text-2xl font-semibold mb-1">
        Invoice #{invoice.invoiceNumber}
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        {invoice.customer?.name ?? 'Customer'}
      </Text>

      <View className="flex-row items-center mb-4">
        <Text className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 mr-2">
          {invoice.status}
        </Text>
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

      <TouchableOpacity
        onPress={() => navigation.navigate('RecordPayment', { invoiceId })}
        className="bg-black rounded-lg py-3 items-center"
      >
        <Text className="text-white font-semibold text-sm">Record payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

