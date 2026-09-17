import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { DataSync } from './src/realtime/DataSync';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/AuthNavigator';
import { JobAssignmentAlertListener } from './src/components/JobAssignmentAlertListener';

function SessionQueries({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  // A fresh cache per account prevents the previous user's data appearing after login.
  const client = React.useMemo(
    () => new QueryClient({
      defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
    }),
    [user?.id, status],
  );
  React.useEffect(() => () => { client.clear(); }, [client]);
  return (
    <QueryClientProvider client={client}>
      <DataSync />
      {children}
    </QueryClientProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  // ThemeProvider must wrap every useTheme() consumer (Button, badges, tabs, screens).
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SessionQueries>
            <StatusBar style="dark" />
            <JobAssignmentAlertListener />
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </SessionQueries>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
