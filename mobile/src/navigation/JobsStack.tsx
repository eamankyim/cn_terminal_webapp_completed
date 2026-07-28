import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JobsListScreen } from '../screens/main/JobsScreen';
import { JobDetailScreen } from '../screens/jobs/JobDetailScreen';
import { JobCommentsScreen } from '../screens/jobs/JobCommentsScreen';
import { JobStatusUpdateScreen } from '../screens/jobs/JobStatusUpdateScreen';
import { JobCreateScreen } from '../screens/jobs/JobCreateScreen';
import { JobEditScreen } from '../screens/jobs/JobEditScreen';
import { EnquiriesListScreen } from '../screens/enquiries/EnquiriesListScreen';
import { EnquiryDetailScreen } from '../screens/enquiries/EnquiryDetailScreen';

export type JobsStackParamList = {
  JobsList: undefined;
  JobDetail: { jobId: string };
  JobComments: { jobId: string };
  JobStatusUpdate: { jobId: string };
  JobCreate: undefined;
  JobEdit: { jobId: string };
  EnquiriesList: undefined;
  EnquiryDetail: { enquiryId: string };
};

const Stack = createNativeStackNavigator<JobsStackParamList>();

export const JobsStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="JobsList"
        component={JobsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{ title: 'Job detail' }}
      />
      <Stack.Screen
        name="JobComments"
        component={JobCommentsScreen}
        options={{ title: 'Comments' }}
      />
      <Stack.Screen
        name="JobStatusUpdate"
        component={JobStatusUpdateScreen}
        options={{ title: 'Update status' }}
      />
      <Stack.Screen
        name="JobCreate"
        component={JobCreateScreen}
        options={{ title: 'New job' }}
      />
      <Stack.Screen
        name="JobEdit"
        component={JobEditScreen}
        options={{ title: 'Edit job' }}
      />
      <Stack.Screen
        name="EnquiriesList"
        component={EnquiriesListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EnquiryDetail"
        component={EnquiryDetailScreen}
        options={{ title: 'Enquiry' }}
      />
    </Stack.Navigator>
  );
};

