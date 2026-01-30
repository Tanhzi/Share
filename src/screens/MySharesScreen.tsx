import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, 
  FlatList, TextInput, Modal, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth, API_URL } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import GuestPlaceholder from '../components/GuestPlaceholder';

const COLORS = { primary: '#2563EB', bg: '#f8fafc', white: '#fff', text: '#0f172a', slate400: '#94a3b8', danger: '#ef4444' };
const DOC_URL = API_URL.replace('/auth', '/documents');

const MySharesScreen = ({ navigation }: any) => {
  const { isLoggedIn, token } = useAuth();
  
  const [shares, setShares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);

  // --- HÀM HELPER FORMAT ---
  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return 'Link/Text';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // --- 1. GỌI API LẤY DỮ LIỆU ---
  const fetchMyShares = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${DOC_URL}/my-documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Map dữ liệu từ Supabase (snake_case) sang UI (camelCase)
      const mappedData = data.documents.map((doc: any) => {
        console.log("Mapping document:", doc);
        console.log("Document ID types:", {
          id: doc.id,
          typeof_id: typeof doc.id,
          _id: doc._id,
          typeof__id: typeof doc._id
        });
        
        // Use the first available ID field
        const documentId = doc.id || doc._id;
        
        if (!documentId) {
          console.error("Document has no ID field:", doc);
        }
        
        return {
          id: documentId,
          name: doc.name,
          type: getFileTypeIcon(doc.file_type),
          size: formatBytes(doc.file_size),
          date: formatDate(doc.created_at),
          isProtected: doc.is_protected,
          originalType: doc.file_type // Lưu type gốc để filter
        };
      });
      console.log("Mapped data:", mappedData);
      setShares(mappedData);
    } catch (error) {
      console.error('Fetch My Shares Error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const getFileTypeIcon = (type: string) => {
    if (!type) return 'file';
    if (type.includes('Photo') || type.includes('Image')) return 'image';
    if (type.includes('Video')) return 'video';
    if (type === 'Links') return 'link';
    if (type.includes('zip') || type.includes('rar')) return 'zip';
    if (type.includes('pdf')) return 'pdf';
    return 'file';
  };

  // Tự động load khi vào màn hình
  useFocusEffect(useCallback(() => {
    if (isLoggedIn) {
      setIsLoading(true);
      fetchMyShares();
    }
  }, [isLoggedIn, fetchMyShares]));

  // --- 3. GỌI API CẬP NHẬT MẬT KHẨU ---
  const handleUpdatePassword = async () => {
    if (!selectedItem) {
      console.error("No selected item");
      Alert.alert("Error", "No document selected.");
      return;
    }
    
    if (!selectedItem.id) {
      console.error("Selected item has no ID:", selectedItem);
      console.error("Selected item keys:", Object.keys(selectedItem));
      console.error("Selected item properties:", JSON.stringify(selectedItem, null, 2));
      Alert.alert("Error", "Invalid document ID.");
      return;
    }
    
    const requestData = {
      password: newPassword,
      isProtected: isPasswordEnabled
    };
    
    console.log("Sending password update:", {
      itemId: selectedItem.id,
      itemIdType: typeof selectedItem.id,
      isPasswordEnabled,
      hasPassword: !!newPassword,
      fullSelectedItem: selectedItem
    });
    
    try {
      const res = await fetch(`${DOC_URL}/my-documents/${selectedItem.id}/password`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (res.ok) {
        // Update local state
        setShares(prev => prev.map(item => 
          item.id === selectedItem.id 
            ? { ...item, isProtected: isPasswordEnabled }
            : item
        ));
        setPasswordModalVisible(false);
        setNewPassword('');
        Alert.alert("Success", "Password protection updated successfully.");
      } else {
        const errorData = await res.json();
        console.error('Update Password Error:', errorData);
        Alert.alert("Error", errorData.message || "Could not update password protection.");
      }
    } catch (e) { 
      console.error('Network Error:', e);
      Alert.alert("Error", "Network error. Please try again."); 
    }
  };

  const handleOpenPasswordModal = (item: any) => {
    console.log("Opening password modal for item:", item);
    // Check if we received an event instead of item data
    if (item && item.nativeEvent) {
      console.error("Received event instead of item data!");
      return;
    }
    setSelectedItem(item);
    setIsPasswordEnabled(item.isProtected);
    setNewPassword('');
    setModalVisible(false);
    setPasswordModalVisible(true);
  };
  const handleDelete = async () => {
    if (!selectedItem) return;
    
    Alert.alert("Delete Share", `Stop sharing "${selectedItem.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${DOC_URL}/my-documents/${selectedItem.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
              setShares(prev => prev.filter(i => i.id !== selectedItem.id));
              setModalVisible(false);
              Alert.alert("Deleted", "File has been removed.");
            } else {
              Alert.alert("Error", "Could not delete file.");
            }
          } catch (e) { Alert.alert("Error", "Network error."); }
      }}
    ]);
  };

  // Logic lọc dữ liệu
  const filteredShares = useMemo(() => {
    return shares.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesFilter = true;
      
      if (activeFilter === 'Protected') matchesFilter = item.isProtected;
      else if (activeFilter === 'Public') matchesFilter = !item.isProtected;
      else if (activeFilter === 'Files') matchesFilter = item.type !== 'link';
      else if (activeFilter === 'Links') matchesFilter = item.type === 'link';
      
      return matchesSearch && matchesFilter;
    });
  }, [shares, searchQuery, activeFilter]);

  const stats = useMemo(() => ({
    protectedCount: shares.filter(i => i.isProtected).length,
    publicCount: shares.filter(i => !i.isProtected).length
  }), [shares]);

  const handleOpenMenu = (item: any) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  if (!isLoggedIn) return <GuestPlaceholder title="Your Shares" subtitle="Sign in to manage files." icon="folder-shared" />;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <View style={[styles.fileIcon, item.type === 'zip' ? styles.bgBlue : styles.bgPurple]}>
            <Icon 
              name={item.type === 'zip' ? 'folder-zip' : item.type === 'link' ? 'link' : item.type === 'image' ? 'image' : 'insert-drive-file'} 
              size={28} 
              color={item.type === 'zip' ? '#3b82f6' : '#a855f7'} 
            />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.fileDetail}>{item.size} • {item.date}</Text>
            <View style={styles.deviceInfo}>
                <Icon name={item.isProtected ? "lock" : "public"} size={12} color={item.isProtected ? "#f59e0b" : COLORS.slate400} />
                <Text style={[styles.deviceName, item.isProtected && {color: '#d97706'}]}>
                  {item.isProtected ? 'Password Protected' : 'Public Access'}
                </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleOpenMenu(item)} style={styles.moreBtn}>
          <Icon name="more-vert" size={24} color={COLORS.slate400} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Shares</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconBtn, styles.addBtn]} onPress={() => navigation.navigate('ShareForm')}>
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={24} color={COLORS.slate400} />
          <TextInput 
            style={styles.searchInput} placeholder="Search documents..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.slate400}
          />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Icon name="close" size={20} color={COLORS.slate400} /></TouchableOpacity>}
        </View>

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 20}} />
        ) : (
          <FlatList
            data={filteredShares}
            keyExtractor={item => item.id || `temp-${Math.random()}`}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyShares(); }} />}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListHeaderComponent={
              <>
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <View style={[styles.statIcon, { backgroundColor: '#fffbeb' }]}><Icon name="lock" size={16} color="#f59e0b" /></View>
                      <Text style={styles.statLabel}>PROTECTED</Text>
                    </View>
                    <Text style={styles.statValue}>{stats.protectedCount}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}><Icon name="public" size={16} color="#3b82f6" /></View>
                      <Text style={styles.statLabel}>PUBLIC</Text>
                    </View>
                    <Text style={styles.statValue}>{stats.publicCount}</Text>
                  </View>
                </View>

                <FlatList
                  horizontal
                  data={['All', 'Protected', 'Public', 'Files', 'Links']}
                  keyExtractor={item => item}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterScroll}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
                      onPress={() => setActiveFilter(item)}
                    >
                      <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <Text style={styles.sectionTitle}>DOCUMENTS ({filteredShares.length})</Text>
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="folder-open" size={48} color={COLORS.slate400} />
                <Text style={styles.emptyText}>No documents shared yet.</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => handleOpenPasswordModal(selectedItem)}>
              <Icon name="lock" size={24} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>Edit Password Protection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleDelete}>
              <Icon name="delete" size={24} color={COLORS.danger} />
              <Text style={[styles.modalOptionText, { color: COLORS.danger }]}>Stop Sharing & Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={passwordModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPasswordModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Password Protection</Text>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => setIsPasswordEnabled(!isPasswordEnabled)}
            >
              <Icon name={isPasswordEnabled ? "check-box" : "check-box-outline-blank"} size={24} color={COLORS.primary} />
              <Text style={styles.modalOptionText}>Enable Password Protection</Text>
            </TouchableOpacity>
            
            {isPasswordEnabled && (
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholderTextColor={COLORS.slate400}
                />
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.saveButton, { opacity: (!isPasswordEnabled || (isPasswordEnabled && newPassword.trim())) ? 1 : 0.5 }]}
              onPress={handleUpdatePassword}
              disabled={isPasswordEnabled && !newPassword.trim()}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  addBtn: { backgroundColor: COLORS.primary, elevation: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 24, paddingHorizontal: 16, borderRadius: 16, height: 50, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.text },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.slate400 },
  statValue: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  filterScroll: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  filterText: { fontSize: 14, fontWeight: 'bold', color: COLORS.slate400 },
  filterTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.slate400, letterSpacing: 1, marginHorizontal: 24, marginBottom: 16, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 24, marginHorizontal: 24, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flexDirection: 'row', gap: 16, flex: 1 },
  fileIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  bgBlue: { backgroundColor: '#eff6ff' },
  bgPurple: { backgroundColor: '#faf5ff' },
  fileName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  fileDetail: { fontSize: 12, color: COLORS.slate400, marginTop: 2 },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  deviceName: { fontSize: 10, fontWeight: 'bold', color: COLORS.slate400 },
  moreBtn: { padding: 4 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { marginTop: 12, color: COLORS.slate400, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 200 },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 24, color: COLORS.text, textAlign: 'center' },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16 },
  modalOptionText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  passwordInputContainer: { marginBottom: 20 },
  passwordInput: { 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 16,
    backgroundColor: '#f8fafc'
  },
  saveButton: { 
    backgroundColor: COLORS.primary, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 20
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});

export default MySharesScreen;