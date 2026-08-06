import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { useAuth } from '../context/AuthContext';
import {
  MoreMenuProvider,
  useMoreMenu,
} from '../context/MoreMenuContext';
import { useTheme } from '../context/ThemeContext';
import { JobsStack } from './JobsStack';
import { CustomersStack } from './CustomersStack';
import { AccountStack } from './AccountStack';
import {
  UI_PERMISSIONS,
  canAccessDashboard,
  hasPermission,
} from '../utils/permissions';

type TabParamList = {
  Dashboard: undefined;
  Jobs: undefined;
  Customers: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function getDefaultTabForRole(
  role?: string | null,
  opts?: { showDashboard: boolean; showJobs: boolean; showCustomers: boolean },
): keyof TabParamList {
  const showDashboard = opts?.showDashboard ?? true;
  const showJobs = opts?.showJobs ?? true;
  const showCustomers = opts?.showCustomers ?? true;

  const pickFallback = (): keyof TabParamList => {
    if (showJobs) return 'Jobs';
    if (showCustomers) return 'Customers';
    if (showDashboard) return 'Dashboard';
    return 'Account';
  };

  if (!role) return pickFallback();

  const normalized = role.toUpperCase();
  if (normalized === 'ACCOUNTANT') {
    return showDashboard ? 'Dashboard' : pickFallback();
  }
  if (
    normalized === 'ENQUIRY_OFFICER' ||
    normalized === 'ENTRY_OFFICER' ||
    normalized === 'DRIVER'
  ) {
    return showJobs ? 'Jobs' : pickFallback();
  }
  if (showDashboard) return 'Dashboard';
  return pickFallback();
}

const MainTabsNavigator: React.FC = () => {
  const { user } = useAuth();
  const moreMenu = useMoreMenu();
  const { accent } = useTheme();

  // Ref avoids Hermes/listener closure issues with free bindings on tabPress.
  const openMoreMenuRef = useRef(moreMenu.openMoreMenu);
  openMoreMenuRef.current = moreMenu.openMoreMenu;

  const showDashboard = canAccessDashboard(user);
  const showJobs = hasPermission(user, UI_PERMISSIONS.JOBS);
  const showCustomers = hasPermission(user, UI_PERMISSIONS.CLIENTS);

  const initialRouteName = getDefaultTabForRole(user?.role, {
    showDashboard,
    showJobs,
    showCustomers,
  });

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarStyle: {
          borderTopColor: '#e5e5e5',
          backgroundColor: '#fff',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'grid-outline';
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home-sharp' : 'home-outline';
          } else if (route.name === 'Jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Customers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'menu' : 'menu-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {showDashboard ? (
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Home' }}
        />
      ) : null}
      {showJobs ? (
        <Tab.Screen
          name="Jobs"
          component={JobsStack}
          options={{ headerShown: false, title: 'Jobs' }}
        />
      ) : null}
      {showCustomers ? (
        <Tab.Screen
          name="Customers"
          component={CustomersStack}
          options={{ headerShown: false, title: 'Clients' }}
        />
      ) : null}
      <Tab.Screen
        name="Account"
        component={AccountStack}
        options={{ headerShown: false, title: 'Menu' }}
        listeners={{
          tabPress: (e) => {
            // Present the More menu sheet instead of switching to the tab.
            e.preventDefault();
            openMoreMenuRef.current();
          },
        }}
      />
    </Tab.Navigator>
  );
};

export const MainTabs: React.FC = () => {
  return (
    <MoreMenuProvider>
      <MainTabsNavigator />
    </MoreMenuProvider>
  );
};
