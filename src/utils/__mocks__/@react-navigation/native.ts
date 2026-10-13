// Simple mock for @react-navigation/native for web
import React from 'react';
import { View } from 'react-native';
import { navigationMock } from './SimpleNavigation';

// Mock NavigationContainer
export const NavigationContainer: React.FC<{ children?: React.ReactNode; linking?: any }> = ({ children }) => {
  return React.createElement(View as any, null, children);
};

// Mock useNavigation - returns our global navigation object
export const useNavigation = () => {
  return navigationMock;
};

// Mock useFocusEffect - execute callback immediately on web
export const useFocusEffect = (callback: () => void) => {
  React.useEffect(() => {
    callback();
  }, [callback]);
};

// Mock useParams
export const useParams = () => ({});

// Mock useRoute
export const useRoute = () => ({
  params: {},
});

// Mock useScrollToTop
export const useScrollToTop = () => {};

// Mock useLinkTo
export const useLinkTo = () => ({});

// Mock createNavigationContainerRef
export const createNavigationContainerRef = () => null;

// Mock CommonActions
export const CommonActions = {
  navigate: (name: string) => ({ type: 'NAVIGATE', payload: { name } }),
  goBack: () => ({ type: 'GO_BACK' }),
};

// Default export
export default {
  NavigationContainer,
  useNavigation,
  useParams,
  useRoute,
  useFocusEffect,
  useScrollToTop,
  useLinkTo,
  createNavigationContainerRef,
  CommonActions,
};