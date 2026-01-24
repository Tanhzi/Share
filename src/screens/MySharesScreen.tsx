import React, { useState, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, 
  FlatList, TextInput, Modal, Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import GuestPlaceholder from '../components/GuestPlaceholder';

// 1. Mock Data mở rộng thêm trường isProtected (có mật khẩu)
const INITIAL_SHARES = [
  { id: '1', name: 'Project_Alpha_Backup.zip', type: 'zip', size: '120MB', distance: '2m', ownerDevice: 'Pixel 6', isProtected: true, date: '2023-10-01' },
  { id: '2', name: 'Teaser_Video_Final.mp4', type: 'video', size: '450MB', distance: '5m', ownerDevice: 'iPhone 13', isProtected: false, date: '2023-10-02' },
  { id: '3', name: 'Contract_Signed.pdf', type: 'pdf', size: '2MB', distance: '10m', ownerDevice: 'MacBook Pro', isProtected: true, date: '2023-10-05' },
  { id: '4', name: 'Holiday_Photos', type: 'image', size: '24MB', distance: '1m', ownerDevice: 'Samsung S22', isProtected: false, date: '2023-10-06' },
  { id: '5', name: 'Design_System_Link', type: 'link', size: 'Link', distance: 'Web', ownerDevice: 'iPad Air', isProtected: false, date: '2023-10-07' },
];

const COLORS = { primary: '#2563EB', bg: '#f8fafc', white: '#fff', text: '#0f172a', slate400: '#94a3b8', danger: '#ef4444' };

const MySharesScreen = ({ navigation }: any) => {
  const { isLoggedIn } = useAuth();
  
  // State quản lý dữ liệu và UI
  const [shares, setShares] = useState(INITIAL_SHARES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // State cho Modal Menu 3 chấm
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Logic lọc dữ liệu tự động
  const filteredShares = useMemo(() => {
    return shares.filter(item => {
      // 1. Lọc theo tên (Search)
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Lọc theo Tabs (Filter)
      let matchesFilter = true;
      if (activeFilter === 'Protected') matchesFilter = item.isProtected;
      else if (activeFilter === 'Public') matchesFilter = !item.isProtected;
      else if (activeFilter === 'Files') matchesFilter = item.type !== 'link';
      else if (activeFilter === 'Links') matchesFilter = item.type === 'link';
      
      return matchesSearch && matchesFilter;
    });
  }, [shares, searchQuery, activeFilter]);

  // Thống kê số lượng
  const stats = useMemo(() => {
    const protectedCount = shares.filter(i => i.isProtected).length;
    const publicCount = shares.filter(i => !i.isProtected).length;
    return { protectedCount, publicCount };
  }, [shares]);

  // Xử lý mở Menu 3 chấm
  const handleOpenMenu = (item: any) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // Xử lý Xóa tài liệu
  const handleDelete = () => {
    Alert.alert("Delete Share", `Are you sure you want to stop sharing "${selectedItem?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: 'destructive', onPress: () => {
          setShares(prev => prev.filter(i => i.id !== selectedItem.id));
          setModalVisible(false);
      }}
    ]);
  };

  if (!isLoggedIn) {
    return <GuestPlaceholder title="Your Shares" subtitle="Sign in to manage your shared files." icon="folder-shared" />;
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <View style={[styles.fileIcon, item.type === 'zip' ? styles.bgBlue : styles.bgPurple]}>
            <Icon name={item.type === 'zip' ? 'folder-zip' : item.type === 'link' ? 'link' : 'insert-drive-file'} size={28} color={item.type === 'zip' ? '#3b82f6' : '#a855f7'} />
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Shares</Text>
        <View style={styles.headerIcons}>
          {/* Nút + chuyển sang trang ShareForm */}
          <TouchableOpacity 
            style={[styles.iconBtn, styles.addBtn]}
            onPress={() => navigation.navigate('ShareForm')}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={24} color={COLORS.slate400} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search documents..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.slate400}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color={COLORS.slate400} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredShares}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            <>
              {/* Stats Cards: Protected vs Public */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <View style={[styles.statIcon, { backgroundColor: '#fffbeb' }]}>
                      <Icon name="lock" size={16} color="#f59e0b" />
                    </View>
                    <Text style={styles.statLabel}>PROTECTED</Text>
                  </View>
                  <Text style={styles.statValue}>{stats.protectedCount}</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                      <Icon name="public" size={16} color="#3b82f6" />
                    </View>
                    <Text style={styles.statLabel}>PUBLIC</Text>
                  </View>
                  <Text style={styles.statValue}>{stats.publicCount}</Text>
                </View>
              </View>

              {/* Filter Tabs */}
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
              <Icon name="search-off" size={48} color={COLORS.slate400} />
              <Text style={styles.emptyText}>No documents found</Text>
            </View>
          }
        />
      </View>

      {/* Modal Action Sheet (Menu 3 chấm) */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => { setModalVisible(false); /* Logic Edit */ }}>
              <Icon name="edit" size={24} color={COLORS.text} />
              <Text style={styles.modalOptionText}>Edit Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={() => { setModalVisible(false); /* Logic Copy Link */ }}>
              <Icon name="content-copy" size={24} color={COLORS.text} />
              <Text style={styles.modalOptionText}>Copy Link</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.modalOption} onPress={handleDelete}>
              <Icon name="delete" size={24} color={COLORS.danger} />
              <Text style={[styles.modalOptionText, { color: COLORS.danger }]}>Stop Sharing</Text>
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
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  addBtn: { backgroundColor: COLORS.primary, elevation: 4 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    margin: 24, paddingHorizontal: 16, borderRadius: 16, height: 50, borderWidth: 1, borderColor: '#e2e8f0'
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.text },
  
  statsContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 24 },
  statCard: { 
    flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 20, 
    borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.slate400 },
  statValue: { fontSize: 24, fontWeight: '900', color: COLORS.text },

  filterScroll: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  filterChip: { 
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100, 
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8
  },
  filterChipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  filterText: { fontSize: 14, fontWeight: 'bold', color: COLORS.slate400 },
  filterTextActive: { color: '#fff' },

  sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.slate400, letterSpacing: 1, marginHorizontal: 24, marginBottom: 16, marginTop: 8 },
  
  card: { 
    backgroundColor: '#fff', padding: 16, borderRadius: 24, marginHorizontal: 24, marginBottom: 12,
    borderWidth: 1, borderColor: '#f1f5f9', elevation: 2
  },
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

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 250 },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 24, color: COLORS.text, textAlign: 'center' },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16 },
  modalOptionText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
});

export default MySharesScreen;