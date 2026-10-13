// Mock for @react-navigation/elements
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

export const HeaderBackButton = ({ onPress, color }: any) => (
  <TouchableOpacity onPress={onPress} style={{ padding: 8 }}>
    <Text style={{ fontSize: 24, color: color || '#000' }}>←</Text>
  </TouchableOpacity>
);

export const Card = ({ children, style }: any) => (
  <View style={{ flex: 1, ...style }}>{children}</View>
);

export const Header = ({ left, right, title }: any) => (
  <View style={{ 
    height: 56, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  }}>
    <View>{left}</View>
    {title && <Text style={{ fontSize: 18, fontWeight: '600' }}>{title}</Text>}
    <View>{right}</View>
  </View>
);

export const Stack = ({ children }: any) => <View style={{ flex: 1 }}>{children}</View>;
export const DefaultHeader = () => null;
export const DefaultTitle = () => null;
export const getHeaderHeight = () => 56;

export default {
  HeaderBackButton,
  Card,
  Header,
  Stack,
  DefaultHeader,
  DefaultTitle,
  getHeaderHeight,
};
