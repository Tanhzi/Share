import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
// Không cần import useAuth hay useNavigation ở đây nữa

import ScannerScreen from '../screens/ScannerScreen';
import MySharesScreen from '../screens/MySharesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SyncScreen from '../screens/SyncScreen';

const Tab = createBottomTabNavigator();
const COLORS = { primary: '#2563EB', inactive: '#94a3b8', bg: '#ffffff', border: '#f1f5f9' };

const TabNavigator = () => {
  // ĐÃ XÓA logic handleAuthGuard

  return (
    <Tab.Navigator
      initialRouteName="Scanner"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 8,
        },
        tabBarIcon: ({ color }) => {
          let iconName = 'circle';
          if (route.name === 'Scanner') iconName = 'radar';
          else if (route.name === 'MyShares') iconName = 'present-to-all';
          else if (route.name === 'Sync') iconName = 'sync'; 
          else if (route.name === 'History') iconName = 'history';
          else if (route.name === 'Profile') iconName = 'person';
          return <Icon name={iconName} size={28} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Scanner" component={ScannerScreen} options={{ tabBarLabel: 'Scanner' }} />
      {/* Đã XÓA listeners={{ tabPress... }} ở tất cả các tab dưới đây */}
      <Tab.Screen name="MyShares" component={MySharesScreen} options={{ tabBarLabel: 'Shares' }} />
      <Tab.Screen name="Sync" component={SyncScreen} options={{ tabBarLabel: 'Sync' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default TabNavigator;