import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Screens & Context
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import TabNavigator from './TabNavigator';
import ShareFormScreen from '../screens/ShareFormScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isLoading } = useAuth(); // Chỉ cần check loading, không cần check isLoggedIn để điều hướng

  // 1. Màn hình chờ (Splash) khi đang đọc dữ liệu từ máy
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        // 2. SỬA LẠI LOGIC: Luôn luôn bắt đầu từ MainApp (chứa Scanner)
        // Bất kể đã đăng nhập hay chưa
        initialRouteName="MainApp" 
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        
        {/* MainApp: Chứa TabBar (Scanner, MyShares, Sync...) */}
        {/* Bên trong TabNavigator, Scanner được đặt là tab đầu tiên nên sẽ hiện ra trước */}
        <Stack.Screen name="MainApp" component={TabNavigator} />
        
        {/* Các màn hình Auth (Chỉ hiện khi người dùng chủ động bấm vào nút Sign In) */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        
        {/* Các màn hình chức năng khác */}
        <Stack.Screen name="ShareForm" component={ShareFormScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;