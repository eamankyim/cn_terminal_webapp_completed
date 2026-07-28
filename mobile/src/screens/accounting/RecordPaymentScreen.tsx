import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';

const PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'CARD'] as const;

export const RecordPaymentScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const invoiceId: string = route.params?.invoiceId;

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>('BANK_TRANSFER');
  const [payer, setPayer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (!payer.trim()) {
      setError('Payer name is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/invoices/${invoiceId}/payments`, {
        amount: numericAmount,
        paymentMethod: method,
        payer: payer.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['cashflow-summary'] });
      navigation.goBack();
    } catch (e: any) {
      setError(
        (e?.details?.error as string) ?? e?.message ?? 'Unable to record payment',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 px-4 pt-6">
        <Text className="text-2xl font-semibold mb-2">Record payment</Text>
        <Text className="text-gray-500 mb-4 text-sm">
          Add a payment for this invoice. Amounts are in Ghana cedis (GHS).
        </Text>

        {error ? (
          <Text className="text-red-600 mb-3 text-sm">{error}</Text>
        ) : null}

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            Amount (GHS) *
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            className="border border-gray-300 rounded-lg px-3 py-3 text-base"
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            Payer *
          </Text>
          <TextInput
            value={payer}
            onChangeText={setPayer}
            placeholder="Name of payer"
            className="border border-gray-300 rounded-lg px-3 py-3 text-base"
          />
        </View>

        <View className="mb-6">
          <Text className="text-xs font-medium text-gray-600 mb-2">
            Payment method *
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMethod(m)}
                className={`rounded-lg px-3 py-2 ${
                  method === m ? 'bg-black' : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    method === m ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          disabled={submitting}
          onPress={onSubmit}
          className="bg-black rounded-lg py-3 items-center mt-auto mb-6"
        >
          <Text className="text-white font-semibold text-sm">
            {submitting ? 'Saving…' : 'Save payment'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
