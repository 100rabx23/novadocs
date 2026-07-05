import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<void>;
  signup: (email: string, password?: string, displayName?: string) => Promise<void>;
  oauthLogin: (provider: 'google' | 'apple', idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (email: string, token: string, pass: string) => Promise<void>;
  verifyEmail: (userId: string, token: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth rotation on mount
  useEffect(() => {
    const refreshSession = async () => {
      const storedRefreshToken = localStorage.getItem('novadocs_refresh_token');
      if (!storedRefreshToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setAccessToken(data.accessToken);
          localStorage.setItem('novadocs_refresh_token', data.refreshToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem('novadocs_refresh_token');
        }
      } catch (err) {
        console.error('Failed to rotate token:', err);
      } finally {
        setLoading(false);
      }
    };

    refreshSession();
  }, []);

  const login = async (email: string, password?: string, rememberMe?: boolean) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }

    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('novadocs_refresh_token', data.refreshToken);
  };

  const signup = async (email: string, password?: string, displayName?: string) => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Registration failed');
    }

    // Automatically login after signup
    await login(email, password);
  };

  const oauthLogin = async (provider: 'google' | 'apple', idToken: string) => {
    const res = await fetch(`${API_URL}/api/auth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `${provider} authentication failed`);
    }

    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('novadocs_refresh_token', data.refreshToken);
  };

  const logout = async () => {
    const storedRefreshToken = localStorage.getItem('novadocs_refresh_token');
    if (storedRefreshToken) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });
      } catch (err) {
        console.error('Logout error on backend:', err);
      }
    }

    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('novadocs_refresh_token');
  };

  const logoutAllDevices = async () => {
    if (!accessToken) return;

    const res = await fetch(`${API_URL}/api/auth/logout-all`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to logout from all devices');
    }

    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('novadocs_refresh_token');
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Forgot password request failed');
    }

    return res.json();
  };

  const resetPassword = async (email: string, token: string, pass: string) => {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, password: pass }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Password reset failed');
    }
  };

  const verifyEmail = async (userId: string, token: string) => {
    const res = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Email verification failed');
    }

    // Refresh context if user is currently logged in
    if (user && user.id === userId) {
      setUser(prev => prev ? { ...prev, emailVerified: true } : null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        signup,
        oauthLogin,
        logout,
        logoutAllDevices,
        forgotPassword,
        resetPassword,
        verifyEmail,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
