import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth, type AuthUser } from './api.js';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { user } = await auth.me();
        setUser(user);
      } catch {
        // DEV BYPASS: auto-login so login screen is skipped during development
        try {
          const { user } = await auth.login('dev@hyble.com', 'password123');
          setUser(user);
        } catch {
          // If auto-login also fails, use a stub user so login screen is never shown
          setUser({ id: 'dev-bypass', email: 'dev@hyble.com', created_at: new Date().toISOString() });
        }
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const login = async (email: string, password: string) => {
    const { user } = await auth.login(email, password);
    setUser(user);
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
