import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView, 
  Switch, 
  Image, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  Platform 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth, API_URL } from '../context/AuthContext';
import GuestPlaceholder from '../components/GuestPlaceholder';
import { CommonActions } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker'; // Thư viện chọn ảnh

const COLORS = { 
  primary: '#2563EB', 
  text: '#0f172a', 
  slate400: '#94a3b8', 
  bg: '#f8fafc', 
  white: '#fff',
  danger: '#f43f5e'
};

const ProfileScreen = ({ navigation }: any) => {
  const { isLoggedIn, logout, user, token, updateUser } = useAuth();

  // State quản lý UI
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  
  // State quản lý Loading
  const [isLoading, setIsLoading] = useState(false); // Loading khi lưu tên
  const [isUploadingImage, setIsUploadingImage] = useState(false); // Loading khi up ảnh

  // Đồng bộ tên user vào state tạm khi mới vào màn hình
  useEffect(() => {
    if (user) {
      setTempName(user.full_name);
    }
  }, [user]);

  // Nếu chưa đăng nhập -> Hiện màn hình Guest
  if (!isLoggedIn || !user) {
    return <GuestPlaceholder title="User Profile" subtitle="Sign in to view settings." icon="account-circle" />;
  }

  // --- 1. CHỨC NĂNG ĐĂNG XUẤT ---
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: 'destructive',
        onPress: () => {
          logout();
          // Reset stack để không thể back lại
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
        }
      }
    ]);
  };

  // --- 2. CHỨC NĂNG CẬP NHẬT TÊN (API PUT /profile) ---
  const saveProfile = async () => {
    if (!tempName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          full_name: tempName,
          // Giữ nguyên avatar cũ, chỉ đổi tên
          avatar_url: user.avatar_url 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await updateUser(data.user); // Cập nhật Context
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", data.message || "Update failed");
      }
    } catch (error) {
      Alert.alert("Error", "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. CHỨC NĂNG ĐỔI AVATAR (API POST /upload-avatar) ---
  const handleChangeAvatar = async () => {
    // a. Mở thư viện ảnh
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8, // Nén nhẹ để upload nhanh hơn
      selectionLimit: 1,
    });

    if (result.didCancel || !result.assets) return;

    const asset = result.assets[0];
    setIsUploadingImage(true);

    try {
      // b. Tạo FormData chứa file
      const formData = new FormData();
      formData.append('avatar', {
        uri: Platform.OS === 'ios' ? asset.uri?.replace('file://', '') : asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `avatar-${Date.now()}.jpg`,
      } as any);

      // c. Gửi lên Node.js Backend
      const response = await fetch(`${API_URL}/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // Token xác thực
          'Content-Type': 'multipart/form-data', // Bắt buộc khi gửi file
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // d. Upload thành công -> Backend trả về URL ảnh mới
        // Cập nhật ngay vào Context để UI hiển thị ảnh mới
        const newUser = { ...user, avatar_url: data.avatar_url };
        await updateUser(newUser);
        
        Alert.alert("Success", "Avatar updated successfully!");
      } else {
        throw new Error(data.message || "Upload failed");
      }

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        {isEditing ? (
           <TouchableOpacity onPress={saveProfile} disabled={isLoading}>
             {isLoading ? (
               <ActivityIndicator size="small" color={COLORS.primary} />
             ) : (
               <Text style={styles.saveText}>Save</Text>
             )}
           </TouchableOpacity>
        ) : (
           <TouchableOpacity onPress={() => setIsEditing(true)}>
             <Icon name="edit" size={24} color={COLORS.primary} />
           </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* AVATAR SECTION */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={handleChangeAvatar}
            disabled={isUploadingImage || isEditing} // Khóa khi đang upload
          >
            {isUploadingImage ? (
              <View style={[styles.avatar, styles.loadingAvatar]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <Image 
                source={{ uri: user.avatar_url || 'https://via.placeholder.com/150' }} 
                style={styles.avatar} 
              />
            )}
            
            <View style={styles.editBadge}>
              <Icon name="camera-alt" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          {/* NAME & EMAIL SECTION */}
          {isEditing ? (
            <TextInput 
               style={styles.nameInput} 
               value={tempName} 
               onChangeText={setTempName} 
               autoFocus 
               selectTextOnFocus
            />
          ) : (
            <Text style={styles.name}>{user.full_name}</Text>
          )}
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {/* MENU SECTION */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>SECURITY</Text>
           <View style={styles.menuGroup}>
             <TouchableOpacity 
               style={styles.menuItem}
               onPress={() => navigation.navigate('ChangePassword')}
             >
                <View style={styles.menuLeft}>
                  <Icon name="lock" size={24} color={COLORS.slate400} />
                  <Text style={styles.menuText}>Change Password</Text>
                </View>
                <Icon name="chevron-right" size={24} color={COLORS.slate400} />
             </TouchableOpacity>

             <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <Icon name="fingerprint" size={24} color={COLORS.slate400} />
                  <Text style={styles.menuText}>Biometric Login</Text>
                </View>
                <Switch value={true} trackColor={{ false: '#e2e8f0', true: COLORS.primary }} />
             </View>
           </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Icon name="logout" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 2.4.0 (Build 302)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  // Header
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  saveText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  
  content: { padding: 24 },
  
  // Profile Header
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff', backgroundColor: '#e2e8f0' },
  loadingAvatar: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' },
  editBadge: { 
    position: 'absolute', bottom: 0, right: 0, 
    backgroundColor: COLORS.primary, padding: 8, borderRadius: 50, 
    borderWidth: 4, borderColor: '#fff' 
  },
  
  name: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  nameInput: { 
    fontSize: 24, fontWeight: '900', color: COLORS.text, 
    borderBottomWidth: 1, borderBottomColor: COLORS.primary, 
    minWidth: 200, textAlign: 'center', paddingBottom: 4 
  },
  email: { fontSize: 16, color: COLORS.slate400, marginTop: 4 },
  
  // Menu Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.slate400, marginBottom: 12, letterSpacing: 1 },
  menuGroup: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  menuItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  
  // Buttons
  logoutBtn: { 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, 
    padding: 16, borderRadius: 16, backgroundColor: '#fff1f2', marginBottom: 24 
  },
  logoutText: { color: COLORS.danger, fontWeight: '900', letterSpacing: 1 },
  
  footer: { alignItems: 'center', marginBottom: 20 },
  versionText: { fontSize: 12, fontWeight: 'bold', color: COLORS.slate400, textTransform: 'uppercase' },
});

export default ProfileScreen;