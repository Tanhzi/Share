import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </AuthProvider>
  );
};

export default App;