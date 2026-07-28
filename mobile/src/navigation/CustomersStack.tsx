import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomersListScreen } from '../screens/main/CustomersScreen';
import { CustomerDetailScreen } from '../screens/customers/CustomerDetailScreen';
import { CustomerCreateScreen } from '../screens/customers/CustomerCreateScreen';
import { CustomerEditScreen } from '../screens/customers/CustomerEditScreen';
import { ConsignmentsListScreen } from '../screens/consignments/ConsignmentsListScreen';
import { ConsignmentDetailScreen } from '../screens/consignments/ConsignmentDetailScreen';
import { ConsignmentCreateScreen } from '../screens/consignments/ConsignmentCreateScreen';
import { ConsignmentEditScreen } from '../screens/consignments/ConsignmentEditScreen';

export type CustomersStackParamList = {
  CustomersList: undefined;
  CustomerDetail: { customerId: string };
  CustomerCreate: undefined;
  CustomerEdit: { customerId: string };
  ConsignmentsList: { customerId: string };
  ConsignmentDetail: { consignmentId: string };
  ConsignmentCreate: { customerId: string };
  ConsignmentEdit: { consignmentId: string };
};

const Stack = createNativeStackNavigator<CustomersStackParamList>();

export const CustomersStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CustomersList"
        component={CustomersListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{ title: 'Customer' }}
      />
      <Stack.Screen
        name="CustomerCreate"
        component={CustomerCreateScreen}
        options={{ title: 'New customer' }}
      />
      <Stack.Screen
        name="CustomerEdit"
        component={CustomerEditScreen}
        options={{ title: 'Edit customer' }}
      />
      <Stack.Screen
        name="ConsignmentsList"
        component={ConsignmentsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConsignmentDetail"
        component={ConsignmentDetailScreen}
        options={{ title: 'Consignment' }}
      />
      <Stack.Screen
        name="ConsignmentCreate"
        component={ConsignmentCreateScreen}
        options={{ title: 'New consignment' }}
      />
      <Stack.Screen
        name="ConsignmentEdit"
        component={ConsignmentEditScreen}
        options={{ title: 'Edit consignment' }}
      />
    </Stack.Navigator>
  );
};

