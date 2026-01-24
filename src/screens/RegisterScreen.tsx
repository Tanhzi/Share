import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth, API_URL } from '../context/AuthContext';

const COLORS = { primary: '#2563EB', slate400: '#94a3b8', slate100: '#f1f5f9', text: '#0f172a' };

const RegisterScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  
  // States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // 1. Validate
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // 2. Gọi API
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Tự động đăng nhập luôn sau khi đăng ký thành công
              login(data.token, data.user);
              navigation.replace('MainApp'); // Vào màn hình chính
            }
          }
        ]);
      } else {
        Alert.alert('Registration Failed', data.message || 'Error creating account');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Cannot connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={28} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join to share files, links, and notes instantly.</Text>

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Icon name="person" size={24} color={COLORS.slate400} style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="e.g. John Doe"
                placeholderTextColor={COLORS.slate400}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Icon name="email" size={24} color={COLORS.slate400} style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="name@example.com"
                placeholderTextColor={COLORS.slate400}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock" size={24} color={COLORS.slate400} style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="••••••••"
                secureTextEntry
                placeholderTextColor={COLORS.slate400}
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock-reset" size={24} color={COLORS.slate400} style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="••••••••"
                secureTextEntry
                placeholderTextColor={COLORS.slate400}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles (Giữ nguyên)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 32 },
  backBtn: { width: 48, height: 48, justifyContent: 'center', marginLeft: -12, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 12 },
  subtitle: { fontSize: 16, color: COLORS.slate400, fontWeight: '500', marginBottom: 40 },
  form: { gap: 24 },
  fieldContainer: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#64748b', marginLeft: 4 },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  icon: { position: 'absolute', left: 20, zIndex: 1 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.slate100, borderRadius: 20, paddingVertical: 18, paddingLeft: 56, fontSize: 16, color: COLORS.text },
  link: { color: COLORS.primary, fontWeight: '900' },
  button: { backgroundColor: COLORS.primary, paddingVertical: 20, borderRadius: 20, alignItems: 'center', marginTop: 16, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  footer: { marginTop: 48, flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: COLORS.slate400, fontWeight: '700' }
});

export default RegisterScreen;