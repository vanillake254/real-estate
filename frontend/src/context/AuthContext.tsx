import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api';

interface User {
  id: string;
  email: string;
  username: string;
  phoneNumber: string;
  referralCode: string;
  roleId: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await api.get('/users/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Auto logout after 3 minutes of inactivity
  useEffect(() => {
    let timeoutId: number | undefined;

    const resetTimer = () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        logout();
      }, 3 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [user]);

  const value: AuthContextType = {
    user,
    setUser,
    isAuthenticated: !!user,
    isLoading,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
