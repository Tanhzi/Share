import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'http://10.0.2.2:5000/api/auth';

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
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userInfo');

        if (storedToken && storedUser) {
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

  const login = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    try {
      await AsyncStorage.setItem('userToken', newToken);
      await AsyncStorage.setItem('userInfo', JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to save auth data', e);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
    } catch (e) {
      console.error('Failed to remove auth data', e);
    }
  };

  // ✅ ĐÃ DI CHUYỂN RA NGOÀI: updateUser ở cùng cấp với login/logout
  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to update user storage', e);
    }
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
      }}
    >
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