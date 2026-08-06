import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountScreen } from '../screens/main/AccountScreen';
import { InvoicesScreen } from '../screens/accounting/InvoicesScreen';
import { InvoiceDetailScreen } from '../screens/accounting/InvoiceDetailScreen';
import { RecordPaymentScreen } from '../screens/accounting/RecordPaymentScreen';
import { EstimatesScreen } from '../screens/accounting/EstimatesScreen';
import { EstimateDetailScreen } from '../screens/accounting/EstimateDetailScreen';
import { AccountingOverviewScreen } from '../screens/accounting/AccountingOverviewScreen';
import { NotificationsScreen } from '../screens/account/NotificationsScreen';
import { ProfileScreen } from '../screens/account/ProfileScreen';
import { AppearanceScreen } from '../screens/account/AppearanceScreen';
import { ChangePasswordScreen } from '../screens/account/ChangePasswordScreen';
import { ReportsScreen } from '../screens/accounting/ReportsScreen';
import { MyRequestsScreen } from '../screens/accounting/MyRequestsScreen';
import { InvoiceCreateScreen } from '../screens/accounting/InvoiceCreateScreen';
import { EstimateCreateScreen } from '../screens/accounting/EstimateCreateScreen';
import { EstimateEditScreen } from '../screens/accounting/EstimateEditScreen';
import { ExpenseRequestsScreen } from '../screens/accounting/ExpenseRequestsScreen';

export type AccountStackParamList = {
  AccountHome: undefined;
  Notifications: undefined;
  Profile: undefined;
  Appearance: undefined;
  ChangePassword: undefined;
  Invoices: undefined;
  InvoiceDetail: { invoiceId: string };
  InvoiceCreate: undefined;
  RecordPayment: { invoiceId: string };
  Estimates: undefined;
  EstimateDetail: { estimateId: string };
  EstimateCreate: undefined;
  EstimateEdit: { estimateId: string };
  AccountingOverview: undefined;
  Reports: undefined;
  MyRequests: undefined;
  ExpenseRequests: undefined;
};

const Stack = createNativeStackNavigator<AccountStackParamList>();

const noHeader = { headerShown: false as const };

export const AccountStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="AccountHome" component={AccountScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Invoices" component={InvoicesScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen name="InvoiceCreate" component={InvoiceCreateScreen} />
      <Stack.Screen name="RecordPayment" component={RecordPaymentScreen} />
      <Stack.Screen name="Estimates" component={EstimatesScreen} />
      <Stack.Screen name="EstimateDetail" component={EstimateDetailScreen} />
      <Stack.Screen name="EstimateCreate" component={EstimateCreateScreen} />
      <Stack.Screen name="EstimateEdit" component={EstimateEditScreen} />
      <Stack.Screen
        name="AccountingOverview"
        component={AccountingOverviewScreen}
      />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
      <Stack.Screen name="ExpenseRequests" component={ExpenseRequestsScreen} />
    </Stack.Navigator>
  );
};
