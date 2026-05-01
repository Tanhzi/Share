import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import DocumentCard from '../components/DocumentCard';
import { useAuth } from '../context/AuthContext';
import { DOCUMENT_URL } from '../config/env';
import { useFocusEffect } from '@react-navigation/native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { PasswordModal } from '../components/PasswordModal';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiGet, apiPost } from '../api/client';

const DOC_URL = DOCUMENT_URL;
const FILTER_TYPES = ['All', 'PDF', 'Images', 'Videos', 'Archives', 'Docs'];
const COLORS = {
  primary: '#2563EB',
  text: '#0f172a',
  secondary: '#10b981',
  bg: '#f8fafc',
  white: '#fff',
  slate400: '#94a3b8',
  danger: '#ef4444',
};

const getScanNetworkErrorMessage = () => {
  return 'Không thể kết nối server. Kiểm tra backend và API_URL.';
};

const ScannerScreen = ({ navigation }: any) => {
  const { token } = useAuth();
  const { isConnected } = useNetworkStatus();

  // Animation
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Data State
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter State
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  // Password Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Helper: Format Bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper: Convert DB type to UI type
  const getFileType = (dbType: string) => {
    const type = dbType.toLowerCase();
    if (type.includes('photo') || type.includes('image')) return 'jpg';
    if (type.includes('video')) return 'mp4';
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('link')) return 'link';
    return 'file';
  };

  // Helper: Check if document is a link type
  const isLinkDocument = (doc: any) => doc.type === 'link';

  // Helper: Normalize URL
  const normalizeUrl = (url: string) => {
    if (!url) return url;
    if (!url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }
    try {
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch {
      return null;
    }
  };

  const getCurrentLocation = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'Location is needed to scan nearby documents.'
        );
        return null;
      }
    }

    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          console.error('GPS Error:', error);
          Alert.alert('GPS Error', 'Could not get your current location.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }, []);

  // --- 1. GỌI API SCAN ---
  const handleScan = useCallback(async () => {
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your network connection and try again.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        return;
      }

      const scanEndpoint = token ? '/scan' : '/scan-public';
      const scanUrl = `${DOC_URL}${scanEndpoint}?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=50`;

      const res = await apiGet(scanUrl, token ?? undefined) as any;
      const data = res as { documents?: any[] };

      if (Array.isArray(data?.documents)) {
        const mappedDocs = data.documents.map((doc: any) => {
          const distanceVal = Math.floor(Math.random() * 30) + 1;
          return {
            id: doc.id,
            name: doc.name,
            type: getFileType(doc.file_type),
            ownerDevice: doc.is_anonymous ? 'Anonymous' : 'Unknown Device',
            distance: `${distanceVal}m`,
            size: formatBytes(doc.file_size),
            isProtected: doc.is_protected,
            url: doc.file_url,
          };
        });
        setDocuments(mappedDocs);
      } else {
        console.error('Scan failed:', data);
        Alert.alert('Error', 'Failed to scan documents.');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      Alert.alert('Error', getScanNetworkErrorMessage());
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [token, isConnected, getCurrentLocation]);

  // --- 2. TẢI FILE ---
  const downloadFile = async (url: string, fileName: string) => {
    const { dirs } = ReactNativeBlobUtil.fs;
    const path =
      Platform.OS === 'ios'
        ? `${dirs.DocumentDir}/${fileName}`
        : `${dirs.DownloadDir}/${fileName}`;

    Alert.alert('Downloading', `Starting download for ${fileName}...`);

    try {
      await ReactNativeBlobUtil.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: path,
          description: 'Downloading document from ShareApp',
          title: fileName,
          mediaScannable: true,
        },
      }).fetch('GET', url);
      Alert.alert('Success', `File saved to: ${path}`);
    } catch {
      Alert.alert('Error', 'Download failed.');
    }
  };

  // --- 3. XỬ LÝ NHẤN VÀO TÀI LIỆU ---
  const handleDocumentPress = async (doc: any) => {
    if (isLinkDocument(doc)) {
      if (!doc.url) {
        Alert.alert('Error', 'No URL available for this link');
        return;
      }
      if (doc.isProtected) {
        setSelectedDoc(doc);
        setModalVisible(true);
        return;
      }
      const normalizedUrl = normalizeUrl(doc.url);
      if (!normalizedUrl) {
        Alert.alert('Error', `Invalid URL format: ${doc.url}`);
        return;
      }
      try {
        const supported = await Linking.canOpenURL(normalizedUrl);
        if (supported) {
          await Linking.openURL(normalizedUrl);
        } else {
          Alert.alert('Error', `Cannot open this URL: ${normalizedUrl}`);
        }
      } catch {
        Alert.alert('Error', `Failed to open link: ${normalizedUrl}`);
      }
      return;
    }

    if (doc.isProtected) {
      setSelectedDoc(doc);
      setModalVisible(true);
    } else {
      checkPasswordAndDownload(doc.id, doc.name, '');
    }
  };

  // --- 4. XÁC THỰC MẬT KHẨU & TẢI FILE ---
  const checkPasswordAndDownload = async (
    docId: string,
    docName: string,
    password: string
  ) => {
    setIsVerifying(true);
    try {
      const verifyEndpoint = token
        ? '/verify-password'
        : '/verify-password-public';

      const data = await apiPost(
        `${DOC_URL}${verifyEndpoint}`,
        { documentId: docId, password },
        token ?? undefined
      ) as { downloadUrl?: string; message?: string };

      if (data && data.downloadUrl) {
        setModalVisible(false);
        if (selectedDoc && isLinkDocument(selectedDoc)) {
          const normalizedUrl = normalizeUrl(data.downloadUrl);
          if (normalizedUrl) {
            await Linking.openURL(normalizedUrl);
          }
        } else {
          await downloadFile(data.downloadUrl, docName);
        }
      } else {
        Alert.alert('Error', data?.message || 'Server error');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message === 'Invalid password'
          ? 'Invalid password'
          : error.message === 'Document not found'
          ? 'Document not found'
          : 'Network error verifying password.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // --- EFFECTS ---
  useFocusEffect(
    useCallback(() => {
      handleScan();
    }, [handleScan])
  );

  const onRefresh = () => {
    setRefreshing(true);
    handleScan();
  };

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );

    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    bounceLoop.start();

    return () => {
      pulseLoop.stop();
      bounceLoop.stop();
    };
  }, [bounceAnim, pulseAnim]);

  // --- FILTER LOGIC ---
  const filteredDocs = useMemo(() => {
    if (activeFilter === 'All') return documents;
    return documents.filter(doc => {
      if (activeFilter === 'PDF') return doc.type === 'pdf';
      if (activeFilter === 'Images')
        return ['jpg', 'png', 'jpeg'].includes(doc.type);
      if (activeFilter === 'Videos') return ['mp4', 'mov'].includes(doc.type);
      if (activeFilter === 'Docs')
        return ['docx', 'txt', 'doc', 'file'].includes(doc.type);
      if (activeFilter === 'Archives')
        return ['zip', 'rar', '7z'].includes(doc.type);
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
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isLoading
                    ? COLORS.danger
                    : isConnected
                    ? COLORS.secondary
                    : COLORS.danger,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {isLoading ? 'Scanning...' : isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handleScan}>
          <Icon name="refresh" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
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
            const scale = pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1.4],
            });
            const opacity = pulseAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.6, 0.3, 0],
            });
            return (
              <Animated.View
                key={index}
                style={[styles.pulseRing, { transform: [{ scale }], opacity }]}
              />
            );
          })}

          <View style={styles.userDot}>
            <Icon name="smartphone" size={32} color="#fff" />
          </View>

          {filteredDocs.length > 0 && (
            <Animated.View
              style={[
                styles.deviceDot,
                {
                  top: '25%',
                  right: '25%',
                  transform: [{ translateY: bounceAnim }],
                },
              ]}>
              <Text style={styles.deviceCount}>{filteredDocs.length}</Text>
            </Animated.View>
          )}
        </View>

        {/* List Header & Filter Toggle */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.sectionTitle}>NEARBY DOCUMENTS</Text>
            <Text style={styles.subTitle}>
              Found {filteredDocs.length} items nearby
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              showFilter && { backgroundColor: COLORS.primary },
            ]}
            onPress={() => setShowFilter(!showFilter)}>
            <Icon
              name="filter-list"
              size={24}
              color={showFilter ? '#fff' : COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {/* Filter Bar */}
        {showFilter && (
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FILTER_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    activeFilter === type && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveFilter(type)}>
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === type && styles.filterTextActive,
                    ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Document List */}
        <View style={{ gap: 12 }}>
          {isLoading && !refreshing && documents.length === 0 ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: 20 }}
            />
          ) : filteredDocs.length > 0 ? (
            filteredDocs.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onPress={() => handleDocumentPress(doc)}
              />
            ))
          ) : (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Icon
                name="wifi-tethering-off"
                size={48}
                color={COLORS.slate400}
              />
              <Text
                style={{
                  textAlign: 'center',
                  marginTop: 10,
                  color: COLORS.slate400,
                }}>
                No documents found nearby.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB - Share Button */}
      <TouchableOpacity
        style={styles.shareFab}
        onPress={() => navigation.navigate('ShareForm')}>
        <Icon name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Share</Text>
      </TouchableOpacity>

      {/* Modal Password */}
      <PasswordModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onVerify={pwd => {
          if (selectedDoc) {
            checkPasswordAndDownload(selectedDoc.id, selectedDoc.name, pwd);
          }
        }}
        isLoading={isVerifying}
        docName={selectedDoc?.name}
        isLink={selectedDoc ? isLinkDocument(selectedDoc) : false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  iconBtn: { padding: 8, borderRadius: 50, backgroundColor: '#f1f5f9' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, color: COLORS.secondary, fontWeight: 'bold' },
  filterBar: { marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  filterText: { fontSize: 12, fontWeight: 'bold', color: COLORS.slate400 },
  filterTextActive: { color: '#fff' },
  content: { padding: 24, paddingBottom: 100 },
  radarContainer: {
    height: 320,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    marginBottom: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
  },
  radiusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    zIndex: 10,
  },
  radiusText: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary },
  staticRingLarge: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  staticRingMedium: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  radarLineH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  radarLineV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#f1f5f9',
  },
  userDot: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    borderWidth: 4,
    borderColor: '#fff',
    zIndex: 5,
  },
  deviceDot: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    zIndex: 5,
  },
  deviceCount: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  subTitle: { fontSize: 12, color: COLORS.slate400, marginTop: 2 },
  shareFab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    elevation: 8,
  },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default ScannerScreen;
