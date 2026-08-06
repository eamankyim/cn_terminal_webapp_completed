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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomersList" component={CustomersListScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <Stack.Screen name="CustomerCreate" component={CustomerCreateScreen} />
      <Stack.Screen name="CustomerEdit" component={CustomerEditScreen} />
      <Stack.Screen name="ConsignmentsList" component={ConsignmentsListScreen} />
      <Stack.Screen name="ConsignmentDetail" component={ConsignmentDetailScreen} />
      <Stack.Screen name="ConsignmentCreate" component={ConsignmentCreateScreen} />
      <Stack.Screen name="ConsignmentEdit" component={ConsignmentEditScreen} />
    </Stack.Navigator>
  );
};
