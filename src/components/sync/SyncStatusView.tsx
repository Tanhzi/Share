import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SyncStatusViewProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const SyncStatusView = ({
  isConnected: _isConnected,
  onConnect: _onConnect,
  onDisconnect: _onDisconnect,
}: SyncStatusViewProps) => {
  return (
    <View style={styles.container}>
      <Text>Sync Status View</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default SyncStatusView;
