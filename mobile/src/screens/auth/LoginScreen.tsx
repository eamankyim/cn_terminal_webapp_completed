import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { inputControlStyle } from '../../components/Input';
import { buttonControlStyle } from '../../components/Button';
import { controlHeight } from '../../theme/inputs';
import { ACCENT } from '../../theme/colors';

/** Medium blue CTA — only solid color on the sign-in screen */
const BUTTON_BG = ACCENT.blue;
const BUTTON_TEXT = '#FFFFFF';

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
                paddingBottom: Math.max(insets.bottom, 16) + 48,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brand}>
              <Text style={styles.title}>CN Mobile</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.form}>
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
                  placeholderTextColor="rgba(255, 255, 255, 0.45)"
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
                  placeholderTextColor="rgba(255, 255, 255, 0.45)"
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

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Sign In"
                disabled={submitting}
                onPress={onSubmit}
                style={[styles.button, submitting && styles.buttonDisabled]}
              >
                {submitting ? (
                  <ActivityIndicator color={BUTTON_TEXT} />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

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
    backgroundColor: 'rgba(2, 6, 23, 0.35)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    marginTop: 10,
  },
  form: {
    backgroundColor: 'transparent',
  },
  error: {
    color: '#fca5a5',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  input: {
    ...inputControlStyle,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  forgot: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 24,
  },
  button: {
    ...buttonControlStyle,
    height: controlHeight,
    backgroundColor: BUTTON_BG,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: BUTTON_TEXT,
    fontSize: 20,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  footerStrong: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
