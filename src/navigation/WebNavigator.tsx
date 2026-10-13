// Web-specific navigator using React Navigation with web support
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import TabNavigator from './TabNavigator';
import ShareFormScreen from '../screens/ShareFormScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Stack = createStackNavigator();

// Web linking configuration
const linking = {
  enabled: true,
  prefixes: [
    'http://localhost:3000',
    'https://sharedocu-web.vercel.app',
  ],
  config: {
    screens: {
      MainApp: '',
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ShareForm: 'share',
      ChangePassword: 'change-password',
    },
  },
};

const WebNavigator = () => {
  return (
    <NavigationContainer linking={linking} fallback={null}>
      <Stack.Navigator
        initialRouteName="MainApp"
        screenOptions={{
          headerShown: false,
          animation: 'none', // Disable animation on web for better performance
        }}
      >
        {/* Main Tab Navigator */}
        <Stack.Screen name="MainApp" component={TabNavigator} />
        
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        
        {/* Modal Screens */}
        <Stack.Screen 
          name="ShareForm" 
          component={ShareFormScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default WebNavigator;
