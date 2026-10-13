import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';

const App = () => {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
};

export default App;
