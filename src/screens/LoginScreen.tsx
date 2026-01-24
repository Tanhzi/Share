import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth, API_URL } from '../context/AuthContext'; // Import API_URL

const COLORS = { primary: '#2563EB', slate400: '#94a3b8', slate100: '#f1f5f9', white: '#fff', text: '#0f172a' };

const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Thêm trạng thái loading

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Connecting to:', `${API_URL}/login`);
      
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Đăng nhập thành công
        console.log('Login Success:', data);
        login(data.token, data.user);
        
        // Điều hướng
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace('MainApp');
        }
      } else {
        // Đăng nhập thất bại (sai pass, không tìm thấy user...)
        Alert.alert('Login Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Network Error', 'Cannot connect to server. Please check your internet or server URL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Nút Back (giữ nguyên) */}
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        )}

        {/* Logo Section (giữ nguyên) */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Icon name="all-inclusive" size={60} color="#fff" />
          </View>
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue sharing documents</Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Icon name="email" size={24} color={COLORS.slate400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={COLORS.slate400}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Icon name="lock" size={24} color={COLORS.slate400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.slate400}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
               <Icon name={showPassword ? "visibility" : "visibility-off"} size={24} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <View style={styles.rowBetween}>
            <View style={{flex: 1}} /> 
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.buttonPrimary, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Social & Register Links (giữ nguyên) */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New user? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles giữ nguyên như file cũ
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 32, flexGrow: 1, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 10, left: 20, zIndex: 10 },
  logoContainer: { alignItems: 'center', marginBottom: 48, marginTop: 20 },
  logoBox: { width: 96, height: 96, backgroundColor: COLORS.primary, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  headerTextContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 12 },
  subtitle: { fontSize: 16, color: COLORS.slate400, fontWeight: '500', textAlign: 'center' },
  form: { width: '100%' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, position: 'relative' },
  inputIcon: { position: 'absolute', left: 20, zIndex: 1 },
  eyeIcon: { position: 'absolute', right: 20, zIndex: 1, padding: 5 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.slate100, borderRadius: 20, paddingVertical: 18, paddingLeft: 56, paddingRight: 56, fontSize: 16, color: COLORS.text },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  forgotText: { fontSize: 14, fontWeight: '900', color: COLORS.primary },
  buttonPrimary: { backgroundColor: COLORS.primary, paddingVertical: 20, borderRadius: 20, alignItems: 'center', marginTop: 24, elevation: 5, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 40, gap: 16 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.slate100 },
  orText: { fontSize: 10, fontWeight: '900', color: COLORS.slate400, letterSpacing: 1 },
  footer: { marginTop: 48, flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  footerText: { color: COLORS.slate400, fontWeight: '700' },
  linkText: { color: COLORS.primary, fontWeight: '900' }
});

export default LoginScreen;