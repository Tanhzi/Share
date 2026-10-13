import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SimpleWebNav from './src/navigation/SimpleWebNav';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <ToastProvider>
          <SimpleWebNav />
        </ToastProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
};

export default App;
