import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (password: string) => void;
  isLoading: boolean;
  docName?: string;
  isLink?: boolean;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  visible,
  onClose,
  onVerify,
  isLoading,
  docName,
  isLink = false,
}) => {
  const [password, setPassword] = useState('');

  const handleVerify = () => {
    onVerify(password);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconCircle}>
            <Icon name="lock" size={32} color="#f59e0b" />
          </View>
          <Text style={styles.modalTitle}>Password Required</Text>
          <Text style={styles.modalSubtitle}>
            {docName ? `"${docName}" is ` : 'This document '}is protected.
          </Text>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter Password"
            secureTextEntry
            autoFocus
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn]}
              onPress={onClose}
              disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.confirmBtn]}
              onPress={handleVerify}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>
                  {isLink ? 'Unlock & Open Link' : 'Unlock & Download'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  passwordInput: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: '#f1f5f9' },
  confirmBtn: { backgroundColor: '#2563EB' },
  cancelBtnText: { fontWeight: 'bold', color: '#64748b' },
  confirmBtnText: { fontWeight: 'bold', color: '#fff' },
});
