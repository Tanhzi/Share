import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  Animated, Easing, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  PermissionsAndroid, RefreshControl, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DocumentCard from '../components/DocumentCard';
import Geolocation from 'react-native-geolocation-service';
import { useAuth, API_URL } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

// Thư viện tải file
import ReactNativeBlobUtil from 'react-native-blob-util';

const DOC_URL = API_URL.replace('/auth', '/documents');
const FILTER_TYPES = ['All', 'PDF', 'Images', 'Videos', 'Archives', 'Docs'];
const COLORS = { primary: '#2563EB', text: '#0f172a', secondary: '#10b981', bg: '#f8fafc', white: '#fff', slate400: '#94a3b8', danger: '#ef4444' };

// Hàm tính khoảng cách giữa 2 tọa độ (Haversine Formula)
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Bán kính trái đất (mét)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Trả về mét (số nguyên)
};

const ScannerScreen = ({ navigation }: any) => {
  const { token } = useAuth();

  // Animation
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Data State
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; long: number } | null>(null);

  // Filter State
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  // Password Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // --- 1. HÀM XIN QUYỀN VÀ LẤY VỊ TRÍ ---
  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission Denied", "Location is needed to scan nearby files.");
        return null;
      }
    }

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => {
          console.log(err);
          Alert.alert("GPS Error", "Could not get location.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  // --- 2. GỌI API SCAN ---
  const handleScan = async () => {
    setIsLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      setCurrentLocation({ lat: coords.latitude, long: coords.longitude });

      const res = await fetch(`${DOC_URL}/scan?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        const mappedDocs = data.documents.map((doc: any) => {
          // Giả lập khoảng cách nếu DB chưa trả về tọa độ file
          const distanceVal = Math.floor(Math.random() * 30) + 1;

          return {
            id: doc.id,
            name: doc.name,
            type: getFileType(doc.file_type),
            ownerDevice: doc.is_anonymous ? 'Anonymous' : 'Unknown Device',
            distance: `${distanceVal}m`,
            size: formatBytes(doc.file_size),
            isProtected: doc.is_protected,
            url: doc.file_url
          };
        });
        setDocuments(mappedDocs);
      } else {
        console.error("Scan failed:", data);
        Alert.alert("Error", "Failed to scan documents.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network request failed.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Helper: Format Bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  // Helper: Convert DB type to UI type
  const getFileType = (dbType: string) => {
    const type = dbType.toLowerCase();
    if (type.includes('photo') || type.includes('image')) return 'jpg';
    if (type.includes('video')) return 'mp4';
    if (type.includes('pdf')) return 'pdf';
    return 'file';
  };

  // --- 3. HÀM TẢI FILE ---
  const downloadFile = async (url: string, fileName: string) => {
    const { dirs } = ReactNativeBlobUtil.fs;
    const path = Platform.OS === 'ios'
      ? `${dirs.DocumentDir}/${fileName}`
      : `${dirs.DownloadDir}/${fileName}`;

    Alert.alert("Downloading", `Starting download for ${fileName}...`);

    try {
      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: path,
          description: 'Downloading document from ShareApp',
          title: fileName,
          mediaScannable: true,
        }
      }).fetch('GET', url);

      Alert.alert("Success", `File saved to: ${res.path()}`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Download failed.");
    }
  };

  // --- 4. XỬ LÝ NHẤN VÀO TÀI LIỆU ---
  const handleDocumentPress = (doc: any) => {
    if (doc.isProtected) {
      setSelectedDoc(doc);
      setPasswordInput('');
      setModalVisible(true);
    } else {
      // Không cần mật khẩu → gọi verify với pass rỗng để lấy link chính thức
      checkPasswordAndDownload(doc.id, doc.name, "");
    }
  };

  // --- 5. GỌI API XÁC THỰC MẬT KHẨU & TẢI FILE ---
  const checkPasswordAndDownload = async (docId: string, docName: string, password: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch(`${DOC_URL}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ documentId: docId, password })
      });

      const data = await res.json();

      if (res.ok && data.downloadUrl) {
        setModalVisible(false);
        await downloadFile(data.downloadUrl, docName);
      } else {
        Alert.alert("Error", data.message || "Invalid password or access denied.");
      }
    } catch (error) {
      console.error("Verify password error:", error);
      Alert.alert("Error", "Network error verifying password.");
    } finally {
      setIsVerifying(false);
    }
  };

  // --- EFFECTS ---
  useFocusEffect(
    useCallback(() => {
      handleScan();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    handleScan();
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 1000, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  // --- FILTER LOGIC ---
  const filteredDocs = useMemo(() => {
    if (activeFilter === 'All') return documents;
    return documents.filter(doc => {
      if (activeFilter === 'PDF') return doc.type === 'pdf';
      if (activeFilter === 'Images') return ['jpg', 'png', 'jpeg'].includes(doc.type);
      if (activeFilter === 'Videos') return ['mp4', 'mov'].includes(doc.type);
      if (activeFilter === 'Docs') return ['docx', 'txt', 'doc', 'file'].includes(doc.type);
      if (activeFilter === 'Archives') return ['zip', 'rar', '7z'].includes(doc.type);
      return true;
    });
  }, [activeFilter, documents]);

  // --- RENDER ---
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={styles.headerTitle}>Proximity Scanner</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: isLoading ? COLORS.danger : COLORS.secondary }]} />
            <Text style={styles.statusText}>{isLoading ? 'Scanning...' : 'Location Active'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handleScan}>
          <Icon name="refresh" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Radar UI */}
        <View style={styles.radarContainer}>
          <View style={styles.radiusBadge}>
            <Icon name="location-on" size={12} color={COLORS.primary} />
            <Text style={styles.radiusText}>50m radius</Text>
          </View>
          <View style={styles.staticRingLarge} />
          <View style={styles.staticRingMedium} />
          <View style={styles.radarLineH} />
          <View style={styles.radarLineV} />

          {[0, 800, 1600].map((delay, index) => {
            const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.4] });
            const opacity = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] });
            return <Animated.View key={index} style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />;
          })}

          <View style={styles.userDot}>
            <Icon name="smartphone" size={32} color="#fff" />
          </View>

          {filteredDocs.length > 0 && (
            <Animated.View style={[styles.deviceDot, { top: '25%', right: '25%', transform: [{ translateY: bounceAnim }] }]}>
              <Text style={styles.deviceCount}>{filteredDocs.length}</Text>
            </Animated.View>
          )}
        </View>

        {/* List Header & Filter Toggle */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.sectionTitle}>NEARBY DOCUMENTS</Text>
            <Text style={styles.subTitle}>Found {filteredDocs.length} items nearby</Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, showFilter && { backgroundColor: COLORS.primary }]}
            onPress={() => setShowFilter(!showFilter)}
          >
            <Icon name="filter-list" size={24} color={showFilter ? '#fff' : COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Filter Bar */}
        {showFilter && (
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FILTER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, activeFilter === type && styles.filterChipActive]}
                  onPress={() => setActiveFilter(type)}
                >
                  <Text style={[styles.filterText, activeFilter === type && styles.filterTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Document List */}
        <View style={{ gap: 12 }}>
          {isLoading && !refreshing && documents.length === 0 ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : filteredDocs.length > 0 ? (
            filteredDocs.map(doc => (
              <DocumentCard key={doc.id} document={doc} onPress={() => handleDocumentPress(doc)} />
            ))
          ) : (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Icon name="wifi-tethering-off" size={48} color={COLORS.slate400} />
              <Text style={{ textAlign: 'center', marginTop: 10, color: COLORS.slate400 }}>No documents found nearby.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB - Share Button */}
      <TouchableOpacity style={styles.shareFab} onPress={() => navigation.navigate('ShareForm')}>
        <Icon name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Share</Text>
      </TouchableOpacity>

      {/* Modal Password */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Icon name="lock" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.modalTitle}>Password Required</Text>
            <Text style={styles.modalSubtitle}>"{selectedDoc?.name}" is protected.</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter Password"
              secureTextEntry
              autoFocus
              value={passwordInput}
              onChangeText={setPasswordInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
                disabled={isVerifying}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={() => checkPasswordAndDownload(selectedDoc.id, selectedDoc.name, passwordInput)}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Unlock & Download</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  iconBtn: { padding: 8, borderRadius: 50, backgroundColor: '#f1f5f9' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, color: COLORS.secondary, fontWeight: 'bold' },
  filterBar: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  filterText: { fontSize: 12, fontWeight: 'bold', color: COLORS.slate400 },
  filterTextActive: { color: '#fff' },
  content: { padding: 24, paddingBottom: 100 },
  radarContainer: { height: 320, width: '100%', backgroundColor: '#fff', borderRadius: 32, marginBottom: 24, position: 'relative', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', elevation: 3 },
  radiusBadge: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4, zIndex: 10 },
  radiusText: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary },
  staticRingLarge: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: '#f1f5f9' },
  staticRingMedium: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: '#f1f5f9' },
  pulseRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: 'rgba(37, 99, 235, 0.3)', backgroundColor: 'rgba(37, 99, 235, 0.05)' },
  radarLineH: { position: 'absolute', width: '100%', height: 1, backgroundColor: '#f1f5f9' },
  radarLineV: { position: 'absolute', height: '100%', width: 1, backgroundColor: '#f1f5f9' },
  userDot: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 10, borderWidth: 4, borderColor: '#fff', zIndex: 5 },
  deviceDot: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff', elevation: 5, zIndex: 5 },
  deviceCount: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  subTitle: { fontSize: 12, color: COLORS.slate400, marginTop: 2 },
  shareFab: { position: 'absolute', bottom: 32, right: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 24, gap: 8, elevation: 8 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  passwordInput: { width: '100%', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, fontSize: 16, marginBottom: 24, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f1f5f9' },
  confirmBtn: { backgroundColor: '#2563EB' },
  cancelBtnText: { fontWeight: 'bold', color: '#64748b' },
  confirmBtnText: { fontWeight: 'bold', color: '#fff' },
});

export default ScannerScreen;