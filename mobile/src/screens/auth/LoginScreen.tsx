import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';

interface Props {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'Unable to log in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../../assets/sign-in-background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.scrim} pointerEvents="none" />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: insets.top + 24,
                paddingBottom: Math.max(insets.bottom, 16) + 24,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brand}>
              <Image
                source={require('../../../assets/cn_logo.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="CN Terminal"
              />
              <Text style={styles.title}>CN Terminal</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.formPanel}>
              {error ? (
                <Text style={styles.error}>{error}</Text>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                accessibilityRole="button"
                accessibilityLabel="Forgot Password"
              >
                <Text style={styles.forgot}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                title={submitting ? 'Signing in...' : 'Sign In'}
                loading={submitting}
                onPress={onSubmit}
              />

              <Text style={styles.footer}>
                Need an account?{' '}
                <Text style={styles.footerStrong}>Contact Administrator</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  flex: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 15,
    marginTop: 6,
  },
  formPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 16,
    padding: 20,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  forgot: {
    color: '#4b5563',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 18,
  },
  footer: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
  },
  footerStrong: {
    fontWeight: '700',
    color: '#000000',
  },
});
