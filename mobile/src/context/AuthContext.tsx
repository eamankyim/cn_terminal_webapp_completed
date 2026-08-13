import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Alert } from 'react-native';
import {
  api,
  clearAuth,
  clearSessionExpiredFlag,
  getStoredToken,
  getStoredUser,
  saveAuth,
  setSessionExpiredHandler,
} from '../api/http';
import type { AuthLoginResponse, User, UserRole } from '../types/api';
import {
  hasPermission as checkPermission,
  hasRole as checkRole,
} from '../utils/permissions';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    try {
      const storedToken = await getStoredToken();
      const storedUser = await getStoredUser<User>();

      if (!storedToken || !storedUser) {
        setStatus('unauthenticated');
        return;
      }

      setToken(storedToken);
      setUser(storedUser);

      // Refresh profile and permissions from the server
      const me = await api.get<{ user: User }>('/auth/me');
      setUser(me.user);
      await saveAuth(storedToken, me.user);
      setStatus('authenticated');
    } catch {
      await clearAuth();
      setUser(null);
      setToken(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthLoginResponse, { email: string; password: string }>(
      '/auth/login',
      { email, password },
    );
    clearSessionExpiredFlag();
    setToken(data.token);
    await saveAuth(data.token, data.user);
    // Refresh /auth/me so permissions match server (login payload may omit them)
    try {
      const me = await api.get<{ user: User }>('/auth/me');
      setUser(me.user);
      await saveAuth(data.token, me.user);
    } catch {
      setUser(data.user);
    }
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    clearSessionExpiredFlag();
    await clearAuth();
    setUser(null);
    setToken(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      Alert.alert(
        'Session expired',
        'Your session has expired or is no longer valid. Please log out and sign in again.',
        [
          {
            text: 'Log out & sign in',
            onPress: () => {
              void logout();
            },
          },
        ],
        { cancelable: false },
      );
    });
    return () => setSessionExpiredHandler(null);
  }, [logout]);

  const refreshMe = useCallback(async () => {
    const me = await api.get<{ user: User }>('/auth/me');
    setUser(me.user);
    if (token) {
      await saveAuth(token, me.user);
    }
  }, [token]);

  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => checkRole(user, role),
    [user],
  );

  const hasPermission = useCallback(
    (permission: string) => checkPermission(user, permission),
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        token,
        login,
        logout,
        refreshMe,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
