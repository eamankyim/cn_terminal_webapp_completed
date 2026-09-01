import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/AuthNavigator';
import { JobAssignmentAlertListener } from './src/components/JobAssignmentAlertListener';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

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
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <JobAssignmentAlertListener />
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
