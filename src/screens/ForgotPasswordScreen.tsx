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
import { AUTH_URL } from '../config/env';

const ForgotPasswordScreen = ({ navigation }: any) => {
  // Trạng thái bước: 1 = Nhập Email, 2 = Nhập Code & Pass mới
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');

  // Các biến cho Bước 2
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- BƯỚC 1: Gửi yêu cầu lấy mã ---
  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập email.');
      return;
    }

    setIsLoading(true);
    try {
      // Gọi API Backend
      const response = await fetch(`${AUTH_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // BE luôn trả 200 với message chung để không lộ email có tồn tại hay không (B10)
        Alert.alert(
          'Đã gửi yêu cầu',
          data.message || 'Nếu email đã đăng ký trong hệ thống, mã xác nhận đã được gửi đến email của bạn.'
        );
        setStep(2); // Chuyển sang giao diện nhập mã
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể gửi mã.');
      }
    } catch {
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến server.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- BƯỚC 2: Xác nhận mã và đổi mật khẩu ---
  const handleResetPassword = async () => {
    if (!code || !newPass) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã xác nhận và mật khẩu mới.');
      return;
    }

    if (newPass.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      // Gọi API Backend reset-password
      const response = await fetch(`${AUTH_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          newPassword: newPass,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Thành công',
          'Mật khẩu đã được đặt lại! Vui lòng đăng nhập.',
          [
            {
              text: 'Đăng nhập ngay',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Thất bại',
          data.message || 'Mã xác nhận không đúng hoặc đã hết hạn.'
        );
      }
    } catch {
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}>
        <Icon name="arrow-back-ios" size={24} color="#0f172a" />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Icon thay đổi theo bước */}
        <View style={styles.iconCircle}>
          <Icon
            name={step === 1 ? 'lock-reset' : 'vpn-key'}
            size={48}
            color="#2563EB"
          />
        </View>

        <Text style={styles.title}>
          {step === 1 ? 'Quên Mật Khẩu?' : 'Đặt Lại Mật Khẩu'}
        </Text>

        <Text style={styles.subTitle}>
          {step === 1
            ? 'Nhập email của bạn để nhận mã xác nhận 6 số.'
            : `Nhập mã 6 số đã gửi tới ${email} và mật khẩu mới.`}
        </Text>

        {/* --- FORM NHẬP LIỆU --- */}
        {step === 1 ? (
          // Giao diện Bước 1: Chỉ nhập Email
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Icon
                name="email"
                size={24}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập địa chỉ email"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>
        ) : (
          // Giao diện Bước 2: Nhập Mã OTP + Pass Mới
          <View style={styles.inputContainer}>
            {/* Ô nhập mã OTP */}
            <View style={[styles.inputWrapper, { marginBottom: 16 }]}>
              <Icon
                name="dialpad"
                size={24}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Mã xác nhận (6 số)"
                placeholderTextColor="#94a3b8"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            {/* Ô nhập mật khẩu mới */}
            <View style={styles.inputWrapper}>
              <Icon
                name="lock"
                size={24}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu mới"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={newPass}
                onChangeText={setNewPass}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.sendBtn}
          onPress={step === 1 ? handleSendCode : handleResetPassword}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>
              {step === 1 ? 'Gửi Mã Xác Nhận' : 'Đổi Mật Khẩu'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Nút quay lại đăng nhập */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Quay lại Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  backBtn: { marginBottom: 24 },
  content: { alignItems: 'center', flex: 1 },
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
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 12,
  },
  subTitle: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 15,
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputContainer: { width: '100%', marginBottom: 32 },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 1 },
  input: {
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    paddingVertical: 16,
    paddingLeft: 52,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  sendBtn: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
  },
  sendText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  footer: { marginTop: 24 },
  link: { color: '#2563EB', fontWeight: '900', fontSize: 16 },
});

export default ForgotPasswordScreen;
