import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import {
  saveToSecureStorage,
  getFromSecureStorage,
  removeFromSecureStorage,
} from '../utils/secureStorage';

const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const DEFAULT_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User, expiresInMs?: number) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  isTokenExpired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await getFromSecureStorage('userToken');
        const storedUser = await getFromSecureStorage('userInfo');
        const storedExpiry = await getFromSecureStorage(TOKEN_EXPIRY_KEY);

        if (storedToken && storedUser) {
          if (storedExpiry) {
            const expiryTime = parseInt(storedExpiry, 10);
            if (Date.now() > expiryTime) {
              await removeFromSecureStorage('userToken');
              await removeFromSecureStorage('userInfo');
              await removeFromSecureStorage(TOKEN_EXPIRY_KEY);
              setIsLoading(false);
              return;
            }
          }
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const login = async (
    newToken: string,
    newUser: User,
    expiresInMs?: number
  ) => {
    setToken(newToken);
    setUser(newUser);
    try {
      await saveToSecureStorage('userToken', newToken);
      await saveToSecureStorage('userInfo', JSON.stringify(newUser));
      const expiryTime = Date.now() + (expiresInMs || DEFAULT_TOKEN_EXPIRY_MS);
      await saveToSecureStorage(TOKEN_EXPIRY_KEY, String(expiryTime));
    } catch (e) {
      console.error('Failed to save auth data', e);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    try {
      await removeFromSecureStorage('userToken');
      await removeFromSecureStorage('userInfo');
      await removeFromSecureStorage(TOKEN_EXPIRY_KEY);
    } catch (e) {
      console.error('Failed to remove auth data', e);
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    try {
      await saveToSecureStorage('userInfo', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to update user storage', e);
    }
  };

  const isTokenExpired = (): boolean => {
    if (!token) return true;
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!token,
        token,
        user,
        isLoading,
        login,
        logout,
        updateUser,
        isTokenExpired,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
