import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  Image, Switch, TextInput, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth, API_URL } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

// const { width: screenWidth } = Dimensions.get('window');

// Màu sắc hiện đại hơn
const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1e40af',
  success: '#10b981',
  bg: '#f8fafc',
  white: '#fff',
  text: '#0f172a',
  subText: '#64748b',
  border: '#e2e8f0',
  danger: '#ef4444',
  cardBg: '#ffffff'
};

const SYNC_URL = API_URL.replace('/auth', '/sync');

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const SyncScreen = () => {
  const { token, user } = useAuth(); // Lấy thêm user của chính mình để hiển thị avatar đôi

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data State
  const [isLinked, setIsLinked] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);

  const [emailToLink, setEmailToLink] = useState('');

  // Settings State
  const [isAutoDownload, setIsAutoDownload] = useState(true);
  const [isAutoView, setIsAutoView] = useState(false);

  // --- 1. FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      const statusRes = await fetch(`${SYNC_URL}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!statusRes.ok) { setIsLinked(false); return; }

      const statusData = await statusRes.json();

      if (statusData.isLinked) {
        setIsLinked(true);
        setPartner(statusData.partner);
        setIsAutoDownload(statusData.autoDownload);
        setIsAutoView(statusData.autoView);
      } else {
        setIsLinked(false);
        setPartner(null);

        const reqRes = await fetch(`${SYNC_URL}/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setIncomingRequests(reqData.incoming || []);
          setOutgoingRequests(reqData.outgoing || []);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => { fetchData(); }, [fetchData])
  );

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // --- 2. ACTIONS ---

  const handleLinkAccount = async () => {
    if (!emailToLink.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid email.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${SYNC_URL}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: emailToLink })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Sent!", "Invitation sent.");
        setEmailToLink('');
        fetchData();
      } else {
        Alert.alert("Error", data.message || "Failed");
      }
    } catch { Alert.alert("Error", "Network error"); }
    finally { setIsLoading(false); }
  };

  // Hủy lời mời (Logic Mới)
  const handleCancelRequest = async (connectionId: string) => {
    Alert.alert("Cancel Request", "Do you want to revoke this invitation?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel", style: 'destructive', onPress: async () => {
          setIsLoading(true);
          try {
            await fetch(`${SYNC_URL}/cancel`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ connectionId })
            });
            fetchData();
          } catch { Alert.alert("Error", "Failed to cancel"); }
          finally { setIsLoading(false); }
        }
      }
    ]);
  };

  const handleRespond = async (connectionId: string, action: 'accept' | 'reject') => {
    setIsLoading(true);
    try {
      await fetch(`${SYNC_URL}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ connectionId, action })
      });
      fetchData();
    } catch { Alert.alert("Error", "Failed"); }
    finally { setIsLoading(false); }
  };

  const toggleSettings = async (type: 'download' | 'view', value: boolean) => {
    if (type === 'download') setIsAutoDownload(value);
    if (type === 'view') setIsAutoView(value);
    try {
      await fetch(`${SYNC_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          autoDownload: type === 'download' ? value : isAutoDownload,
          autoView: type === 'view' ? value : isAutoView
        })
      });
    } catch (err) { console.error("Settings error:", err); }
  };

  const handleUnlink = () => {
    Alert.alert("Disconnect", "Stop sharing files with this partner?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect", style: 'destructive', onPress: async () => {
          setIsLoading(true);
          try {
            await fetch(`${SYNC_URL}/unlink`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            setIsLinked(false); setPartner(null); fetchData();
          } catch (err) { console.error("Unlink error:", err); } finally { setIsLoading(false); }
        }
      }
    ]);
  };

  if (isLoading && !refreshing && !isLinked && incomingRequests.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sync Center</Text>
          <Text style={styles.headerSubtitle}>MANAGE CONNECTIONS</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
          <Icon name="refresh" size={24} color={COLORS.subText} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {isLinked && partner ? (
          /* =================================================== */
          /* GIAO DIỆN ĐÃ KẾT NỐI (IMPROVED)          */
          /* =================================================== */
          <>
            {/* 1. Connection Visualizer */}
            <View style={styles.connectedCard}>
              <View style={styles.connectionLine} />
              <View style={styles.avatarRow}>
                {/* My Avatar */}
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: user?.avatar_url || 'https://via.placeholder.com/150' }} style={styles.bigAvatar} />
                  <Text style={styles.avatarLabel}>You</Text>
                </View>

                {/* Status Badge Center */}
                <View style={styles.statusBadge}>
                  <Icon name="check-circle" size={20} color={COLORS.success} />
                  <Text style={styles.statusText}>Synced</Text>
                </View>

                {/* Partner Avatar */}
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: partner.avatar || 'https://via.placeholder.com/150' }} style={styles.bigAvatar} />
                  <Text style={styles.avatarLabel} numberOfLines={1}>{partner.name.split(' ')[0]}</Text>
                </View>
              </View>

              <View style={styles.partnerDetail}>
                <Text style={styles.partnerEmail}>{partner.email}</Text>
                <Text style={styles.sinceText}>Connected secure channel</Text>
              </View>
            </View>

            {/* 2. Quick Actions */}
            <Text style={styles.sectionHeader}>QUICK ACTIONS</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                  <Icon name="send" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.actionText}>Send File</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                  <Icon name="history" size={24} color="#9333ea" />
                </View>
                <Text style={styles.actionText}>History</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Sync Settings */}
            <Text style={styles.sectionHeader}>SYNC PREFERENCES</Text>
            <View style={styles.settingsBox}>
              <View style={styles.settingItem}>
                <View>
                  <Text style={styles.settingTitle}>Auto Download</Text>
                  <Text style={styles.settingSub}>Save received files automatically</Text>
                </View>
                <Switch
                  value={isAutoDownload}
                  onValueChange={(v) => toggleSettings('download', v)}
                  trackColor={{ false: COLORS.border, true: COLORS.success }}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingItem}>
                <View>
                  <Text style={styles.settingTitle}>Instant Preview</Text>
                  <Text style={styles.settingSub}>Open files immediately upon receipt</Text>
                </View>
                <Switch
                  value={isAutoView}
                  onValueChange={(v) => toggleSettings('view', v)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                />
              </View>
            </View>

            {/* 4. Danger Zone */}
            <TouchableOpacity onPress={handleUnlink} style={styles.disconnectBtn}>
              <Icon name="link-off" size={20} color={COLORS.danger} />
              <Text style={styles.disconnectText}>Disconnect Partner</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* =================================================== */
          /* GIAO DIỆN CHƯA KẾT NỐI                 */
          /* =================================================== */
          <View>

            {/* A. Incoming Requests */}
            {incomingRequests.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Incoming Requests</Text>
                {incomingRequests.map((req) => (
                  <View key={req.id} style={styles.requestCard}>
                    <Image source={{ uri: req.requester.avatar_url || 'https://via.placeholder.com/150' }} style={styles.smallAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.reqName}>{req.requester.full_name}</Text>
                      <Text style={styles.reqEmail}>{req.requester.email}</Text>
                    </View>
                    <View style={styles.row}>
                      <TouchableOpacity onPress={() => handleRespond(req.id, 'reject')} style={[styles.smBtn, { backgroundColor: '#fee2e2' }]}>
                        <Icon name="close" size={20} color={COLORS.danger} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRespond(req.id, 'accept')} style={[styles.smBtn, { backgroundColor: '#dcfce7', marginLeft: 8 }]}>
                        <Icon name="check" size={20} color={COLORS.success} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* B. Outgoing Requests (ĐÃ CẬP NHẬT: THÊM NÚT HUỶ) */}
            {outgoingRequests.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Sent Requests</Text>
                {outgoingRequests.map((req) => (
                  <View key={req.id} style={styles.pendingCard}>
                    <View style={styles.pendingContent}>
                      <ActivityIndicator size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pendingLabel}>Waiting for:</Text>
                        <Text style={styles.pendingEmail} numberOfLines={1}>{req.receiver.email}</Text>
                        <Text style={styles.reqTime}>{formatRelativeTime(req.created_at)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelRequest(req.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel invitation"
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* C. Add Partner Form */}
            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.iconCircle}>
                  <Icon name="qr-code-scanner" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>Pair Devices</Text>
                <Text style={styles.emptyDesc}>Enter your partner's email to start syncing files instantly and securely.</Text>

                <View style={styles.inputBox}>
                  <Icon name="mail-outline" size={20} color={COLORS.subText} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor={COLORS.subText}
                    value={emailToLink}
                    onChangeText={setEmailToLink}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleLinkAccount}>
                  <Text style={styles.primaryBtnText}>Send Invitation</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: COLORS.subText, letterSpacing: 1, marginTop: 2 },
  iconBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  content: { padding: 20 },

  // --- UI CONNECTED ---
  connectedCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  avatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10, marginBottom: 16, position: 'relative' },
  connectionLine: { position: 'absolute', top: 40, left: 50, right: 50, height: 2, backgroundColor: '#e2e8f0', zIndex: -1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#e2e8f0' },
  avatarWrapper: { alignItems: 'center' },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: COLORS.white, backgroundColor: '#f1f5f9' },
  avatarLabel: { marginTop: 8, fontWeight: '700', color: COLORS.text, fontSize: 14 },
  statusBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: COLORS.white },
  statusText: { color: COLORS.success, fontWeight: '800', fontSize: 12 },
  partnerDetail: { alignItems: 'center' },
  partnerEmail: { fontSize: 14, color: COLORS.subText, fontWeight: '500' },
  sinceText: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  sectionHeader: { fontSize: 11, fontWeight: '800', color: COLORS.subText, marginBottom: 12, letterSpacing: 1 },

  actionRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  actionBtn: { flex: 1, backgroundColor: COLORS.white, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  actionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionText: { fontWeight: '700', color: COLORS.text, fontSize: 13 },

  settingsBox: { backgroundColor: COLORS.white, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 32 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  settingTitle: { fontWeight: '700', color: COLORS.text, fontSize: 15 },
  settingSub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 16 },

  disconnectBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, backgroundColor: '#fef2f2', borderRadius: 16 },
  disconnectText: { color: COLORS.danger, fontWeight: '700' },

  // --- UI REQUESTS ---
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  smallAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9' },
  reqName: { fontWeight: '700', color: COLORS.text },
  reqEmail: { fontSize: 12, color: COLORS.subText },
  smBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden'
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // ← Cho phép co lại khi cần
    marginRight: 8 // ← Tạo khoảng cách với nút Cancel
  },
  pendingLabel: {
    fontSize: 12,
    color: COLORS.subText
  },
  pendingEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
    maxWidth: '90%', // ← Giới hạn chiều rộng

  },
  reqTime: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 2
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    minWidth: 60, // ← Đảm bảo nút luôn có kích thước tối thiểu
    alignItems: 'center'
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger
  },
  // --- UI EMPTY STATE ---
  emptyState: { backgroundColor: COLORS.white, padding: 32, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginTop: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptyDesc: { textAlign: 'center', color: COLORS.subText, marginBottom: 24, lineHeight: 20 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 16, width: '100%', height: 56, marginBottom: 16 },
  input: { flex: 1, color: COLORS.text, fontWeight: '600' },
  primaryBtn: { width: '100%', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center' }
});

export default SyncScreen;