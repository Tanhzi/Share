import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface GuestPlaceholderProps {
  title?: string;
  subtitle?: string;
  icon?: string;
}

const COLORS = { primary: '#2563EB', slate400: '#94a3b8', text: '#0f172a' };

const GuestPlaceholder: React.FC<GuestPlaceholderProps> = ({
  title = 'Authentication Required',
  subtitle = 'Please sign in to access this feature.',
  icon = 'lock',
}) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={48} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Sign In / Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.slate400,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default GuestPlaceholder;
