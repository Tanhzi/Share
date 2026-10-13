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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DocumentCard from '../components/DocumentCard';
import { useAuth } from '../context/AuthContext';
import { DOCUMENT_URL } from '../config/env';
import { useFocusEffect } from '@react-navigation/native';
import { PasswordModal } from '../components/PasswordModal';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiGet, apiPost } from '../api/client';
import { showAlert } from '../utils/alert';

const DOC_URL = DOCUMENT_URL;
const FILTER_TYPES = ['All', 'Protected', 'Public', 'Video', 'Image', 'File', 'Text', 'Link'];
const SCAN_CACHE_KEY = 'sharedocu_scan_cache';
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
  return 'Cannot connect to server. Check backend and API_URL.';
};

const loadCachedDocs = (): any[] => {
  try {
    const cached = localStorage.getItem(SCAN_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
};

const saveCachedDocs = (docs: any[]) => {
  try {
    localStorage.setItem(SCAN_CACHE_KEY, JSON.stringify(docs));
  } catch {}
};

const ScannerScreen = ({ navigation }: any) => {
  const { token } = useAuth();
  const { isConnected, executeWithRetry } = useNetworkStatus();

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const [documents, setDocuments] = useState<any[]>(loadCachedDocs);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [activeFilter, setActiveFilter] = useState('All');

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getFileType = (dbType: string) => {
    const type = (dbType || '').toLowerCase();
    if (type.includes('photo') || type.includes('image') || type === 'jpg' || type === 'jpeg' || type === 'png') return 'jpg';
    if (type.includes('video') || type === 'mp4' || type === 'mov') return 'mp4';
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('link')) return 'link';
    if (type.includes('text') || type === 'txt') return 'file';
    return 'file';
  };

  const isLinkDocument = (doc: any) => doc.type === 'link';

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
  }> => {
    const tryGetPosition = (timeout: number): Promise<GeolocationPosition> =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout,
          maximumAge: 120000,
        });
      });

    for (const timeout of [2000, 5000]) {
      try {
        const pos = await tryGetPosition(timeout);
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      } catch {
        // Try next timeout
      }
    }

    // GPS fallback: không lấy được vị trí -> chặn quét thay vì quét quanh (0,0)
    throw new Error(
      'Unable to get your location. Please allow GPS permission and try again.'
    );
  }, []);

  const handleScan = useCallback(async () => {
    if (!isConnected) {
      showAlert('No Internet', 'Please check your network connection and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const coords = await getCurrentLocation();

      const scanEndpoint = token ? '/scan' : '/scan-public';
      const scanUrl = `${DOC_URL}${scanEndpoint}?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=50`;

      const res = await executeWithRetry(async () => {
        return await apiGet(scanUrl, token ?? undefined) as any;
      });

      const data = res as { documents?: any[] };

      if (Array.isArray(data?.documents)) {
        const mappedDocs = data.documents.map((doc: any) => {
          // Khoảng cách thật từ server (nếu RPC trả về), không bịa số ngẫu nhiên
          const rawDistance = doc.distance ?? doc.dist_m;
          const distance =
            rawDistance === null || rawDistance === undefined || rawDistance === ''
              ? null
              : typeof rawDistance === 'number'
                ? `${Math.round(rawDistance)}m`
                : String(rawDistance);
          return {
            id: doc.id,
            name: doc.name,
            type: getFileType(doc.file_type),
            ownerDevice: doc.is_anonymous || !doc.owner_name ? 'Anonymous' : doc.owner_name,
            distance,
            size: formatBytes(doc.file_size),
            isProtected: doc.is_protected,
            url: doc.file_url,
          };
        });
        setDocuments(mappedDocs);
        saveCachedDocs(mappedDocs);
      } else {
        // Server trả payload không hợp lệ -> báo lỗi thay vì im lặng (T3)
        console.error('Scan failed:', data);
        showAlert('Scan failed', getScanNetworkErrorMessage());
      }
    } catch (error: any) {
      console.error('Scan failed:', error?.message || error);
      showAlert(
        'Scan failed',
        error?.message || 'Unable to get your location or reach the server.'
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [token, isConnected, getCurrentLocation, executeWithRetry]);

  const downloadFile = (url: string, fileName: string, onProgress: (pct: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';

      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
          onProgress(100);
          resolve();
        } else {
          reject(new Error(`Download failed: HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during download'));
      xhr.onabort = () => reject(new Error('Download aborted'));
      xhr.send();
    });
  };

  const handleDocumentPress = async (doc: any) => {
    if (isLinkDocument(doc)) {
      if (!doc.url) {
        showAlert('Error', 'No URL available for this link');
        return;
      }
      if (doc.isProtected) {
        setSelectedDoc(doc);
        setModalVisible(true);
        return;
      }
      const normalizedUrl = normalizeUrl(doc.url);
      if (!normalizedUrl) {
        showAlert('Error', `Invalid URL format: ${doc.url}`);
        return;
      }
      try {
        window.open(normalizedUrl, '_blank');
      } catch {
        showAlert('Error', `Failed to open link: ${normalizedUrl}`);
      }
      return;
    }

    if (doc.isProtected) {
      setSelectedDoc(doc);
      setModalVisible(true);
    } else {
      checkPasswordAndDownload(doc.id, doc.name, '', isLinkDocument(doc));
    }
  };

  const checkPasswordAndDownload = async (
    docId: string,
    docName: string,
    password: string,
    isLink: boolean
  ): Promise<boolean> => {
    setIsVerifying(true);
    try {
      const verifyEndpoint = token
        ? '/verify-password'
        : '/verify-password-public';

      const data = await executeWithRetry(async () => {
        return await apiPost(
          `${DOC_URL}${verifyEndpoint}`,
          { documentId: docId, password },
          token ?? undefined
        ) as { downloadUrl?: string; message?: string };
      });

      if (data && data.downloadUrl) {
        setModalVisible(false);
        setSelectedDoc(null);
        if (isLink) {
          const normalizedUrl = normalizeUrl(data.downloadUrl);
          if (normalizedUrl) {
            window.open(normalizedUrl, '_blank');
          }
        } else {
          setDownloadingId(docId);
          setDownloadProgress(0);
          try {
            await downloadFile(data.downloadUrl, docName, (pct) => {
              setDownloadProgress(pct);
            });
          } finally {
            setDownloadingId(null);
            setDownloadProgress(0);
          }
        }
        return true;
      } else {
        showAlert('Error', data?.message || 'Server error');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.message?.toLowerCase() || '';
      const status = error.status;
      let text = 'Network error verifying password.';
      if (status === 401 || errorMessage.includes('incorrect password') || errorMessage.includes('invalid password')) {
        text = 'Incorrect password';
      } else if (status === 404 || errorMessage.includes('document not found')) {
        text = 'Document not found';
      } else if (status === 410 || errorMessage.includes('expired')) {
        text = 'Document has expired';
      } else if (errorMessage.includes('password is required')) {
        text = 'Password is required';
      }
      showAlert('Error', text);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

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

  const filteredDocs = useMemo(() => {
    if (activeFilter === 'All') return documents;
    return documents.filter(doc => {
      if (activeFilter === 'Protected') return doc.isProtected;
      if (activeFilter === 'Public') return !doc.isProtected;
      if (activeFilter === 'Video') return doc.type === 'mp4';
      if (activeFilter === 'Image') return ['jpg', 'png', 'jpeg'].includes(doc.type);
      if (activeFilter === 'File') return ['pdf', 'docx', 'zip', 'file'].includes(doc.type);
      if (activeFilter === 'Text') return doc.type === 'txt' || doc.type === 'file';
      if (activeFilter === 'Link') return doc.type === 'link';
      return true;
    });
  }, [activeFilter, documents]);

  return (
    <SafeAreaView style={styles.container}>
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

        <View style={styles.listHeader}>
          <View>
            <Text style={styles.sectionTitle}>NEARBY DOCUMENTS</Text>
            <Text style={styles.subTitle}>
              Found {filteredDocs.length} items nearby
            </Text>
          </View>
        </View>

        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FILTER_TYPES.map(type => {
              const isActive = activeFilter === type;
              const iconMap: Record<string, string> = {
                All: 'tune',
                Protected: 'lock',
                Public: 'public',
                Video: 'videocam',
                Image: 'image',
                File: 'folder',
                Text: 'notes',
                Link: 'link',
              };
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveFilter(type)}>
                  <Icon
                    name={iconMap[type] || 'label'}
                    size={14}
                    color={isActive ? '#fff' : COLORS.slate400}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      isActive && styles.filterTextActive,
                    ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

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
                downloading={downloadingId === doc.id}
                downloadProgress={downloadProgress}
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

      <TouchableOpacity
        style={styles.shareFab}
        onPress={() => navigation.navigate('ShareForm')}>
        <Icon name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Share</Text>
      </TouchableOpacity>

      <PasswordModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedDoc(null);
        }}
        onVerify={async pwd => {
          if (!selectedDoc) return false;
          const doc = selectedDoc;
          return await checkPasswordAndDownload(doc.id, doc.name, pwd, isLinkDocument(doc));
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
  filterBar: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
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
