import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { useAuth } from '../context/AuthContext';
import { JobsStack } from './JobsStack';
import { CustomersStack } from './CustomersStack';
import { AccountStack } from './AccountStack';

type TabParamList = {
  Dashboard: undefined;
  Jobs: undefined;
  Customers: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function getDefaultTabForRole(role?: string | null): keyof TabParamList {
  if (!role) return 'Dashboard';

  const normalized = role.toUpperCase();
  if (normalized === 'ACCOUNTANT') return 'Account';
  if (normalized === 'ENQUIRY_OFFICER' || normalized === 'ENTRY_OFFICER') {
    return 'Jobs';
  }
  if (normalized === 'DRIVER') return 'Jobs';
  return 'Dashboard';
}

export const MainTabs: React.FC = () => {
  const { user } = useAuth();
  const initialRouteName = getDefaultTabForRole(user?.role);

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          borderTopColor: '#e5e5e5',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'grid-outline';
          if (route.name === 'Dashboard') iconName = 'grid-outline';
          if (route.name === 'Jobs') iconName = 'cube-outline';
          if (route.name === 'Customers') iconName = 'people-outline';
          if (route.name === 'Account') iconName = 'person-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="Jobs"
        component={JobsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

