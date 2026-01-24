import React, { useState, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, FlatList, 
  StyleSheet, SafeAreaView, StatusBar, Modal, Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import GuestPlaceholder from '../components/GuestPlaceholder';

const INITIAL_HISTORY = [
  { id: '1', name: 'Project_Assets_v2.zip', to: 'Alice', size: '124 MB', time: '2 min ago', type: 'sent', icon: 'folder-zip', group: 'Today' },
  { id: '2', name: 'Vacation_2023.jpg', from: 'Bob', size: '4.2 MB', time: '1 hr ago', type: 'saved', icon: 'image', group: 'Today' },
  { id: '3', name: 'design-system.io', to: 'Team', size: 'Link', time: '10:30 AM', type: 'clicked', icon: 'link', group: 'Yesterday' },
  { id: '4', name: 'Meeting_Record.mp4', from: 'Dave', size: '850 MB', time: 'Yesterday', type: 'saved', icon: 'movie', group: 'Yesterday' },
];

const COLORS = { primary: '#2563EB', bg: '#fff', slate100: '#f1f5f9', slate400: '#94a3b8', text: '#0f172a', danger: '#ef4444' };

const HistoryScreen = ({ navigation }: any) => {
  const { isLoggedIn } = useAuth();
  
  // States
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Clear All Function
  const handleClearAll = () => {
    if (history.length === 0) return;
    Alert.alert("Clear History", "Are you sure you want to delete all history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => setHistory([]) }
    ]);
  };

  // Delete Single Item
  const handleDeleteItem = () => {
    setHistory(prev => prev.filter(i => i.id !== selectedItem.id));
    setModalVisible(false);
  };

  // Filter Logic
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (activeFilter === 'Sent') matchesFilter = item.type === 'sent';
      else if (activeFilter === 'Received') matchesFilter = item.type === 'saved';
      else if (activeFilter === 'Links') matchesFilter = item.type === 'clicked';
      
      return matchesSearch && matchesFilter;
    });
  }, [history, searchQuery, activeFilter]);

  if (!isLoggedIn) {
    return <GuestPlaceholder title="Transfer History" subtitle="Sign in to view history." icon="history" />;
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => { setSelectedItem(item); setModalVisible(true); }}
    >
      <View style={[styles.iconBox, { backgroundColor: '#eef2ff' }]}>
        <Icon name={item.icon} size={28} color="#6366f1" />
        <View style={styles.statusBadge}>
          <Icon name={item.type === 'saved' ? 'arrow-downward' : item.type === 'sent' ? 'arrow-upward' : 'touch-app'} size={12} color={item.type === 'saved' ? '#10b981' : COLORS.primary} />
        </View>
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.rowBetween}>
          <Text numberOfLines={1} style={styles.itemName}>{item.name}</Text>
          <View style={[styles.typeTag, { backgroundColor: item.type === 'sent' ? '#dbeafe' : '#f1f5f9' }]}>
            <Text style={[styles.typeText, { color: item.type === 'sent' ? COLORS.primary : COLORS.slate400 }]}>{item.type}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.to ? `To ${item.to}` : item.from ? `From ${item.from}` : 'Link visited'}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{item.size}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{item.time}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={{padding: 8}} onPress={() => { setSelectedItem(item); setModalVisible(true); }}>
        <Icon name="more-vert" size={24} color={COLORS.slate400} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="chevron-left" size={32} color={COLORS.slate400} /></TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity onPress={handleClearAll} disabled={history.length === 0}>
          <Text style={[styles.clearText, history.length === 0 && {color: COLORS.slate400}]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color={COLORS.slate400} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search history..." 
          placeholderTextColor={COLORS.slate400} 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
           <TouchableOpacity onPress={() => setSearchQuery('')} style={{padding: 4}}>
             <Icon name="close" size={20} color={COLORS.slate400} />
           </TouchableOpacity>
        )}
      </View>

      <View style={{height: 50}}>
        <FlatList
          horizontal
          data={['All', 'Sent', 'Received', 'Links']}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredHistory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 40}}>
                <Text style={{color: COLORS.slate400}}>No history found</Text>
            </View>
        }
      />

      {/* Modal Action Sheet */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle} numberOfLines={1}>{selectedItem?.name}</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => { setModalVisible(false); }}>
              <Icon name="info" size={24} color={COLORS.text} />
              <Text style={styles.modalOptionText}>View Details</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.modalOption} onPress={handleDeleteItem}>
              <Icon name="delete" size={24} color={COLORS.danger} />
              <Text style={[styles.modalOptionText, { color: COLORS.danger }]}>Delete from History</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  clearText: { color: COLORS.primary, fontWeight: 'bold' },
  
  searchContainer: { marginHorizontal: 16, marginBottom: 16, position: 'relative', flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.slate100, borderRadius: 20, paddingHorizontal: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.text },
  
  filterChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, height: 36, justifyContent: 'center' },
  filterChipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  filterText: { fontSize: 12, fontWeight: 'bold', color: COLORS.slate400 },
  filterTextActive: { color: '#fff' },

  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  iconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative', marginRight: 16 },
  statusBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#fff', padding: 2, borderRadius: 50, elevation: 1 },
  itemContent: { flex: 1, marginRight: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, flex: 1, marginRight: 8 },
  typeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  metaText: { fontSize: 12, color: COLORS.slate400 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.slate400 },

  // Modal Styles (Reusable ideally)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 24, color: COLORS.text, textAlign: 'center' },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16 },
  modalOptionText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
});

export default HistoryScreen;