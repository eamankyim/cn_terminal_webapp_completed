import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { AcceptInvitationScreen } from '../screens/auth/AcceptInvitationScreen';
import { SetupScreen } from '../screens/auth/SetupScreen';
import { useAuth } from '../context/AuthContext';
import { MainTabs } from './MainTabs';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Setup: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  AcceptInvitation: { invitationId?: string } | undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const RootNavigator: React.FC = () => {
  const { status } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'checking' ? (
        <Stack.Screen name="Splash" component={SplashScreen} />
      ) : status === 'unauthenticated' ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Setup" component={SetupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen as React.ComponentType}
          />
          <Stack.Screen
            name="AcceptInvitation"
            component={AcceptInvitationScreen as React.ComponentType}
          />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};

