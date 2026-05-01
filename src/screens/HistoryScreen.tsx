import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { DOCUMENT_URL } from '../config/env';
import GuestPlaceholder from '../components/GuestPlaceholder';
import { useFocusEffect } from '@react-navigation/native';
import { apiGet, apiPost } from '../api/client';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import DocumentItem from '../components/myshares/DocumentItem';

const COLORS = {
  primary: '#2563EB',
  bg: '#fff',
  slate100: '#f1f5f9',
  slate400: '#94a3b8',
  text: '#0f172a',
  danger: '#ef4444',
};
const DOC_URL = DOCUMENT_URL;

const HistoryScreen = ({ navigation }: any) => {
  const { isLoggedIn, token } = useAuth();
  const { isConnected, isInternetReachable } = useNetworkStatus();

  // States
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // --- HELPER FUNCTIONS ---
  const formatBytes = (bytes: number) => {
    if (!bytes) return 'Link';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return 'Older';
  };

  const getIcon = (type: string) => {
    if (type.includes('Photo') || type.includes('Image')) return 'image';
    if (type.includes('Video')) return 'movie';
    if (type === 'Links') return 'link';
    if (type.includes('zip')) return 'folder-zip';
    return 'description';
  };

// --- 1. FETCH API ---
  const fetchHistory = async () => {
    if (!token) return;
    try {
      const data = await apiGet(`${DOC_URL}/history/all`, token);

      const mappedData = data.history.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        size: formatBytes(doc.file_size),
        time: getTimeAgo(doc.created_at),
        group: getGroup(doc.created_at),
        rawType: doc.history_type, // 'sent' | 'received'
        icon: getIcon(doc.file_type),
        // Nếu là sent -> To Partner, Nếu received -> From Partner
        userLabel:
          doc.history_type === 'sent' ? 'To: Partner' : 'From: Partner',
      }));

      setHistory(mappedData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Info',
      "To clear history, please delete individual files in 'My Shares'.",
    );
  };

  // --- FILTER LOGIC ---
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      let matchesFilter = true;
      if (activeFilter === 'Sent') matchesFilter = item.rawType === 'sent';
      else if (activeFilter === 'Received')
        matchesFilter = item.rawType === 'received';
      else if (activeFilter === 'Links') matchesFilter = item.icon === 'link';

      return matchesSearch && matchesFilter;
    });
  }, [history, searchQuery, activeFilter]);

  if (!isLoggedIn)
    return (
      <GuestPlaceholder
        title="Transfer History"
        subtitle="Sign in to view history."
        icon="history"
      />
    );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        setSelectedItem(item);
        setModalVisible(true);
      }}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: item.rawType === 'sent' ? '#eef2ff' : '#ecfdf5' },
        ]}
      >
        <Icon
          name={item.icon}
          size={28}
          color={item.rawType === 'sent' ? '#6366f1' : '#10b981'}
        />
        <View style={styles.statusBadge}>
          <Icon
            name={item.rawType === 'sent' ? 'arrow-upward' : 'arrow-downward'}
            size={12}
            color={item.rawType === 'sent' ? COLORS.primary : '#10b981'}
          />
        </View>
      </View>

      <View style={styles.itemContent}>
        <View style={styles.rowBetween}>
          <Text numberOfLines={1} style={styles.itemName}>
            {item.name}
          </Text>
          <View
            style={[
              styles.typeTag,
              {
                backgroundColor:
                  item.rawType === 'sent' ? '#dbeafe' : '#d1fae5',
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                { color: item.rawType === 'sent' ? COLORS.primary : '#059669' },
              ]}
            >
              {item.rawType.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.userLabel}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{item.size}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{item.time}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={{ padding: 8 }}
        onPress={() => {
          setSelectedItem(item);
          setModalVisible(true);
        }}
      >
        <Icon name="more-vert" size={24} color={COLORS.slate400} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={32} color={COLORS.slate400} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearText}>Help</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon
          name="search"
          size={24}
          color={COLORS.slate400}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search history..."
          placeholderTextColor={COLORS.slate400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={{ padding: 4 }}
          >
            <Icon name="close" size={20} color={COLORS.slate400} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 50 }}>
        <FlatList
          horizontal
          data={['All', 'Sent', 'Received', 'Links']}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchHistory();
              }}
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: COLORS.slate400 }}>No history found</Text>
            </View>
          }
        />
      )}

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedItem?.name}
            </Text>

            {selectedItem?.rawType === 'sent' && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleDeleteItem}
              >
                <Icon name="delete" size={24} color={COLORS.danger} />
                <Text
                  style={[styles.modalOptionText, { color: COLORS.danger }]}
                >
                  Delete File
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close" size={24} color={COLORS.text} />
              <Text style={styles.modalOptionText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  clearText: { color: COLORS.primary, fontWeight: 'bold' },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate100,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  filterText: { fontSize: 12, fontWeight: 'bold', color: COLORS.slate400 },
  filterTextActive: { color: '#fff' },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 16,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    padding: 2,
    borderRadius: 50,
    elevation: 1,
  },
  itemContent: { flex: 1, marginRight: 8 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  typeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  metaText: { fontSize: 12, color: COLORS.slate400 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.slate400,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  modalOptionText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
});

export default HistoryScreen;
