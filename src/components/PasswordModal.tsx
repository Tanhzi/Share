import React, { useState, useEffect } from 'react';
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
  Alert,
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

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 3600000; // 1 hour

export const PasswordModal: React.FC<PasswordModalProps> = ({
  visible,
  onClose,
  onVerify,
  isLoading,
  docName,
  isLink = false,
}) => {
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (visible) {
      const now = Date.now();
      if (lastAttemptTime && (now - lastAttemptTime) > LOCKOUT_TIME_MS) {
        setAttempts(0);
        setIsLocked(false);
      }
    }
  }, [visible, lastAttemptTime]);

  const handleVerify = () => {
    if (isLocked) {
      const remainingTime = Math.ceil((LOCKOUT_TIME_MS - (Date.now() - lastAttemptTime)) / 60000);
      Alert.alert(
        'Too Many Attempts',
        `Please try again in ${remainingTime} minute(s).`
      );
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    onVerify(password);
    setAttempts(prev => prev + 1);
    setLastAttemptTime(Date.now());
  };

  const handleCancel = () => {
    setPassword('');
    onClose();
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
      
      {isLocked ? (
        <View style={styles.lockedContainer}>
          <Icon name="lock-outline" size={48} color="#ef4444" />
          <Text style={styles.lockedText}>
            Too many failed attempts. Please try again later.
          </Text>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter Password"
            secureTextEntry
            autoFocus
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
          {attempts > 0 && (
            <Text style={styles.attemptText}>
              {attempts} attempt{attempts !== 1 ? 's' : ''} (max: {MAX_ATTEMPTS})
            </Text>
          )}
        </>
      )}
      
      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.modalBtn, styles.cancelBtn]}
          onPress={handleCancel}
          disabled={isLoading || isLocked}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalBtn, styles.confirmBtn]}
          onPress={handleVerify}
          disabled={isLoading || isLocked}>
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
  lockedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  lockedText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
  },
  passwordInput: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  attemptText: {
    fontSize: 12,
    color: '#f59e0b',
    marginBottom: 12,
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
