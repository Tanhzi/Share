import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { AUTH_URL } from '../config/env';

const ChangePasswordScreen = ({ navigation }: any) => {
  const { token } = useAuth(); // Lấy token
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = async () => {
    // Validate
    if (!oldPass || !newPass || !confirmPass) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${AUTH_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Gửi token lên server
        },
        body: JSON.stringify({
          oldPassword: oldPass,
          newPassword: newPass,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Password changed successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Failed', data.message || 'Could not change password');
      }
    } catch {
      Alert.alert('Error', 'Network error or server is down');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={oldPass}
            onChangeText={setOldPass}
            placeholder="Enter current password"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPass}
            onChangeText={setNewPass}
            placeholder="Enter new password"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirmPass}
            onChangeText={setConfirmPass}
            placeholder="Re-enter new password"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
          onPress={handleChange}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default ChangePasswordScreen;
