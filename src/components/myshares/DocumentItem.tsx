import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityProps,
} from 'react-native';

interface DocumentItemProps extends AccessibilityProps {
  title: string;
  description: string;
  onPress: () => void;
}

const DocumentItem = ({ title, description, onPress }: DocumentItemProps) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityLabel={`${title}, ${description}`}
      accessibilityRole="button">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
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

export default DocumentItem;
