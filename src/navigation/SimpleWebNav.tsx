// Simple state-based navigation for web
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../constants/appColors';
import { setNavigation, navigationRef } from '../utils/SimpleNavigation';

// Import all screens
import ScannerScreen from '../screens/ScannerScreen';
import MySharesScreen from '../screens/MySharesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SyncScreen from '../screens/SyncScreen';
import ShareFormScreen from '../screens/ShareFormScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

type ScreenName = 
  | 'MainApp'
  | 'Scanner'
  | 'MyShares'
  | 'History'
  | 'Profile'
  | 'Sync'
  | 'ShareForm'
  | 'Login'
  | 'Register'
  | 'ForgotPassword'
  | 'ChangePassword';

const TAB_SCREENS: ScreenName[] = ['Scanner', 'MyShares', 'Sync', 'History', 'Profile'];

const SimpleWebNav: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('MainApp');
  const [activeTab, setActiveTab] = useState<ScreenName>('Scanner');

  // Set up navigation callback immediately on first render
  useEffect(() => {
    setNavigation((screen: string) => {
      if (TAB_SCREENS.includes(screen as ScreenName)) {
        setActiveTab(screen as ScreenName);
        setCurrentScreen('MainApp');
      } else {
        setCurrentScreen(screen as ScreenName);
      }
    });
  }, [setCurrentScreen]);

const renderScreen = () => {
  switch (currentScreen) {
    case 'Login':
      return <LoginScreen navigation={navigationRef} />;
    case 'Register':
      return <RegisterScreen navigation={navigationRef} />;
    case 'ForgotPassword':
      return <ForgotPasswordScreen navigation={navigationRef} />;
    case 'ChangePassword':
      return <ChangePasswordScreen navigation={navigationRef} />;
    case 'ShareForm':
      return <ShareFormScreen navigation={navigationRef} />;
    default:
      return renderMainApp();
  }
};

const renderMainApp = () => {
  switch (activeTab) {
    case 'Scanner':
      return <ScannerScreen navigation={navigationRef} />;
    case 'MyShares':
      return <MySharesScreen navigation={navigationRef} />;
    case 'History':
      return <HistoryScreen navigation={navigationRef} />;
    case 'Profile':
      return <ProfileScreen navigation={navigationRef} />;
    case 'Sync':
      return <SyncScreen navigation={navigationRef} />;
    default:
      return <ScannerScreen navigation={navigationRef} />;
  }
};

  return (
    <View style={styles.container}>
      {/* Main content area */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom tab bar - only show on MainApp */}
      {currentScreen === 'MainApp' && (
        <View style={styles.tabBar}>
          <TabButton
            name="Scanner"
            icon="📡"
            label="Scanner"
            isActive={activeTab === 'Scanner'}
            onPress={() => setActiveTab('Scanner')}
          />
          <TabButton
            name="MyShares"
            icon="📁"
            label="Shares"
            isActive={activeTab === 'MyShares'}
            onPress={() => setActiveTab('MyShares')}
          />
          <TabButton
            name="Sync"
            icon="🔄"
            label="Sync"
            isActive={activeTab === 'Sync'}
            onPress={() => setActiveTab('Sync')}
          />
          <TabButton
            name="History"
            icon="🕒"
            label="History"
            isActive={activeTab === 'History'}
            onPress={() => setActiveTab('History')}
          />
          <TabButton
            name="Profile"
            icon="👤"
            label="Profile"
            isActive={activeTab === 'Profile'}
            onPress={() => setActiveTab('Profile')}
          />
        </View>
      )}
    </View>
  );
};

interface TabButtonProps {
  name: string;
  icon: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ name: _name, icon, label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: Platform.OS === 'web' ? 0 : 20,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabButtonActive: {
    backgroundColor: '#eff6ff',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default SimpleWebNav;
