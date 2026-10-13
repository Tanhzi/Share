import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

interface HistoryItemProps {
  title: string;
  description: string;
  onPress: () => void;
}

const HistoryItem = ({ title, description, onPress }: HistoryItemProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default HistoryItem;
