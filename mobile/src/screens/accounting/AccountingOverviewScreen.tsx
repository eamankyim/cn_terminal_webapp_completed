import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';

interface CashflowSummaryResponse {
  summary: {
    totalInflow?: number;
    totalOutflow?: number;
    totalInflows?: number;
    totalOutflows?: number;
    netCashflow: number;
  };
}

export const AccountingOverviewScreen: React.FC = () => {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const { data, isLoading } = useQuery({
    queryKey: ['cashflow-summary', startDate, endDate],
    queryFn: () =>
      api.get<CashflowSummaryResponse>(
        `/cashflow/summary?startDate=${startDate}&endDate=${endDate}`,
      ),
  });

  if (isLoading || !data?.summary) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-600 mt-3">Loading accounting summary…</Text>
      </View>
    );
  }

  const totalInflow = data.summary.totalInflow ?? data.summary.totalInflows ?? 0;
  const totalOutflow = data.summary.totalOutflow ?? data.summary.totalOutflows ?? 0;
  const { netCashflow } = data.summary;

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-4 py-6">
      <Text className="text-2xl font-semibold mb-4">Accounting overview</Text>

      <View className="flex-row mb-4">
        <View className="flex-1 rounded-2xl bg-black px-4 py-4 mr-2">
          <Text className="text-xs text-white/70 mb-1">Net cashflow</Text>
          <Text className="text-lg font-semibold text-white">
            GHS {netCashflow.toFixed(2)}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl bg-gray-900 px-4 py-4 ml-2">
          <Text className="text-xs text-white/70 mb-1">Inflow (30 days)</Text>
          <Text className="text-lg font-semibold text-white">
            GHS {totalInflow.toFixed(2)}
          </Text>
        </View>
      </View>

      <View className="rounded-2xl border border-gray-200 px-4 py-4">
        <Text className="text-xs text-gray-500 mb-1">Outflow (30 days)</Text>
        <Text className="text-lg font-semibold text-gray-900 mb-1">
          GHS {totalOutflow.toFixed(2)}
        </Text>
        <Text className="text-xs text-gray-500">
          Last 30 days · {startDate} to {endDate}. Full expense/payout lists
          are available via Account → Expense requests.
        </Text>
      </View>
    </ScrollView>
  );
};

