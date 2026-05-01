import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SyncStatusViewProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const SyncStatusView = ({
  isConnected,
  onConnect,
  onDisconnect,
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
