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
import { ChangePasswordScreen } from '../screens/account/ChangePasswordScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { RolesPermissionsScreen } from '../screens/admin/RolesPermissionsScreen';
import { ConfigurationsScreen } from '../screens/admin/ConfigurationsScreen';
import { ReportsScreen } from '../screens/accounting/ReportsScreen';
import { MyRequestsScreen } from '../screens/accounting/MyRequestsScreen';
import { InvoiceCreateScreen } from '../screens/accounting/InvoiceCreateScreen';
import { EstimateCreateScreen } from '../screens/accounting/EstimateCreateScreen';
import { EstimateEditScreen } from '../screens/accounting/EstimateEditScreen';
import { ExpenseRequestsScreen } from '../screens/accounting/ExpenseRequestsScreen';
import { InvitesScreen } from '../screens/admin/InvitesScreen';

export type AccountStackParamList = {
  AccountHome: undefined;
  Notifications: undefined;
  Profile: undefined;
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
  AdminUsers: undefined;
  RolesPermissions: undefined;
  Configurations: undefined;
  Invites: undefined;
};

const Stack = createNativeStackNavigator<AccountStackParamList>();

export const AccountStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AccountHome"
        component={AccountScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />
      <Stack.Screen name="Invoices" component={InvoicesScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen
        name="InvoiceCreate"
        component={InvoiceCreateScreen}
        options={{ title: 'Create invoice' }}
      />
      <Stack.Screen
        name="RecordPayment"
        component={RecordPaymentScreen}
        options={{ title: 'Record payment' }}
      />
      <Stack.Screen name="Estimates" component={EstimatesScreen} />
      <Stack.Screen name="EstimateDetail" component={EstimateDetailScreen} />
      <Stack.Screen
        name="EstimateCreate"
        component={EstimateCreateScreen}
        options={{ title: 'New estimate' }}
      />
      <Stack.Screen
        name="EstimateEdit"
        component={EstimateEditScreen}
        options={{ title: 'Edit estimate' }}
      />
      <Stack.Screen
        name="AccountingOverview"
        component={AccountingOverviewScreen}
        options={{ title: 'Accounting overview' }}
      />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{ title: 'My expense requests' }}
      />
      <Stack.Screen
        name="ExpenseRequests"
        component={ExpenseRequestsScreen}
        options={{ title: 'Expense requests' }}
      />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen
        name="RolesPermissions"
        component={RolesPermissionsScreen}
        options={{ title: 'Roles & permissions' }}
      />
      <Stack.Screen
        name="Configurations"
        component={ConfigurationsScreen}
        options={{ title: 'Configuration' }}
      />
      <Stack.Screen
        name="Invites"
        component={InvitesScreen}
        options={{ title: 'Invitations' }}
      />
    </Stack.Navigator>
  );
};

