import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/http';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatsRow } from '../../components/StatsRow';
import { useTheme } from '../../context/ThemeContext';

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
  const { accent } = useTheme();
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
    <View className="flex-1 bg-white">
      <ScreenHeader title="Accounting" />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6">
        <StatsRow className="mb-4">
          <View
            className="rounded-xl border border-gray-300 px-4 py-4"
            style={{ backgroundColor: accent }}
          >
            <Text className="text-xs text-white/70 mb-1">Net cashflow</Text>
            <Text
              className="text-lg font-semibold text-white"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              GHS {netCashflow.toFixed(2)}
            </Text>
          </View>
          <View className="rounded-xl border border-gray-300 bg-gray-900 px-4 py-4">
            <Text className="text-xs text-white/70 mb-1">Inflow (30 days)</Text>
            <Text
              className="text-lg font-semibold text-white"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              GHS {totalInflow.toFixed(2)}
            </Text>
          </View>
          <View className="rounded-xl border border-gray-300 px-4 py-4">
            <Text className="text-xs text-gray-500 mb-1">Outflow (30 days)</Text>
            <Text
              className="text-lg font-semibold text-gray-900"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              GHS {totalOutflow.toFixed(2)}
            </Text>
          </View>
        </StatsRow>

        <Text className="text-xs text-gray-500">
          Last 30 days · {startDate} to {endDate}. Full expense/payout lists are
          available via Account → Expense requests.
        </Text>
      </ScrollView>
    </View>
  );
};
