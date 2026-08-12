import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JobsListScreen } from '../screens/main/JobsScreen';
import { JobDetailScreen } from '../screens/jobs/JobDetailScreen';
import { JobCommentsScreen } from '../screens/jobs/JobCommentsScreen';
import { JobStatusUpdateScreen } from '../screens/jobs/JobStatusUpdateScreen';
import { JobCreateScreen } from '../screens/jobs/JobCreateScreen';
import { JobEditScreen } from '../screens/jobs/JobEditScreen';
import { JobReassignScreen } from '../screens/jobs/JobReassignScreen';
import { EnquiriesListScreen } from '../screens/enquiries/EnquiriesListScreen';
import { EnquiryDetailScreen } from '../screens/enquiries/EnquiryDetailScreen';
import type { JobsStackParamList } from './types';

export type { JobsStackParamList } from './types';

const Stack = createNativeStackNavigator<JobsStackParamList>();

const noHeader = { headerShown: false as const };

export const JobsStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="JobsList" component={JobsListScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="JobComments" component={JobCommentsScreen} />
      <Stack.Screen name="JobStatusUpdate" component={JobStatusUpdateScreen} />
      <Stack.Screen name="JobCreate" component={JobCreateScreen} />
      <Stack.Screen name="JobEdit" component={JobEditScreen} />
      <Stack.Screen name="JobReassign" component={JobReassignScreen} />
      <Stack.Screen name="EnquiriesList" component={EnquiriesListScreen} />
      <Stack.Screen name="EnquiryDetail" component={EnquiryDetailScreen} />
    </Stack.Navigator>
  );
};
