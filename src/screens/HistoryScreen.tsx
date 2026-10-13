import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SectionList,
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
import { apiGet, apiDelete } from '../api/client';
import { getParams } from '../utils/SimpleNavigation';

const COLORS = {
  primary: '#2563EB',
  bg: '#fff',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  text: '#0f172a',
  danger: '#ef4444',
  sentBg: '#eef2ff',
  sentColor: '#6366f1',
  receivedBg: '#ecfdf5',
  receivedColor: '#10b981',
};
const DOC_URL = DOCUMENT_URL;

const HistoryScreen = ({ navigation }: any) => {
  const { isLoggedIn, token } = useAuth();

  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [pairOnly, setPairOnly] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

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
    if (type?.includes('Photo') || type?.includes('Image')) return 'image';
    if (type?.includes('Video')) return 'movie';
    if (type === 'Links') return 'link';
    if (type?.includes('zip')) return 'folder-zip';
    return 'description';
  };

  const fetchHistory = useCallback(async (pairOnly = false) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const url = pairOnly
        ? `${DOC_URL}/history/all?pairOnly=true`
        : `${DOC_URL}/history/all`;
      const data = await apiGet<{ history?: any[] }>(url, token ?? undefined);
      const mappedData = (data.history || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        size: formatBytes(doc.file_size),
        time: getTimeAgo(doc.created_at),
        group: getGroup(doc.created_at),
        rawType: doc.history_type,
        icon: getIcon(doc.file_type),
      }));
      setHistory(mappedData);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      const params = navigation?.getState?.()?.routes?.find((r: any) => r.name === 'History')?.params || getParams();
      const initialPairOnly = params?.pairOnly === true;
      setPairOnly(initialPairOnly);
      if (initialPairOnly) setActiveFilter('Sync');
      fetchHistory(initialPairOnly);
    }, [fetchHistory, navigation])
  );

  const handleFilterChange = (type: string) => {
    const wasSync = activeFilter === 'Sync';
    const isSyncFilter = type === 'Sync';
    setActiveFilter(type);
    setPairOnly(isSyncFilter);
    if (wasSync !== isSyncFilter) {
      fetchHistory(isSyncFilter);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesFilter = true;
      if (activeFilter === 'Sent') matchesFilter = item.rawType === 'sent';
      else if (activeFilter === 'Received') matchesFilter = item.rawType === 'received';
      else if (activeFilter === 'Links') matchesFilter = item.icon === 'link';
      else if (activeFilter === 'Sync') {/* only pair docs */}
      return matchesSearch && matchesFilter;
    });
  }, [history, searchQuery, activeFilter]);

  const sections = useMemo(() => {
    const groups: Record<string, any[]> = { Today: [], Yesterday: [], Older: [] };
    filteredHistory.forEach(item => {
      if (groups[item.group]) groups[item.group].push(item);
      else groups.Older.push(item);
    });
    return Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .map(([title, data]) => ({ title, data }));
  }, [filteredHistory]);

  const handleDeleteItem = async () => {
    if (!selectedItem || selectedItem.rawType !== 'sent') return;
    try {
      await apiDelete(`${DOC_URL}/my-documents/${selectedItem.id}`, token ?? undefined);
      setHistory(prev => prev.filter(h => h.id !== selectedItem.id));
      setModalVisible(false);
      Alert.alert('Deleted', 'File has been deleted.');
    } catch {
      Alert.alert('Error', 'Failed to delete file.');
    }
  };

  if (!isLoggedIn)
    return (
      <GuestPlaceholder
        title="Transfer History"
        subtitle="Sign in to view history."
        icon="history"
        navigation={navigation}
      />
    );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        setSelectedItem(item);
        setModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: item.rawType === 'sent' ? COLORS.sentBg : COLORS.receivedBg },
        ]}
      >
        <Icon
          name={item.icon}
          size={26}
          color={item.rawType === 'sent' ? COLORS.sentColor : COLORS.receivedColor}
        />
        <View style={styles.statusBadge}>
          <Icon
            name={item.rawType === 'sent' ? 'arrow-upward' : 'arrow-downward'}
            size={11}
            color={item.rawType === 'sent' ? COLORS.primary : COLORS.receivedColor}
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
                backgroundColor: item.rawType === 'sent' ? '#dbeafe' : '#d1fae5',
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                { color: item.rawType === 'sent' ? COLORS.primary : '#059669' },
              ]}
            >
              {item.rawType === 'sent' ? 'SENT' : 'GOT'}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name={item.rawType === 'sent' ? 'arrow-upward' : 'arrow-downward'} size={12} color={COLORS.slate400} />
            <Text style={styles.metaText}>
              {item.rawType === 'sent' ? 'Shared' : 'Downloaded'}
            </Text>
          </View>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{item.size}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{item.time}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.moreBtn}
        onPress={() => {
          setSelectedItem(item);
          setModalVisible(true);
        }}
      >
        <Icon name="more-vert" size={22} color={COLORS.slate400} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerCount}>{history.length} items</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={22} color={COLORS.slate400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search history..."
          placeholderTextColor={COLORS.slate400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
            <Icon name="close" size={20} color={COLORS.slate400} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterBar}>
        {['All', 'Sent', 'Received', 'Sync', 'Links'].map(type => {
          const isActive = activeFilter === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
               onPress={() => handleFilterChange(type)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading && !refreshing ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                // Giữ nguyên bộ lọc hiện tại (pairOnly) thay vì mặc định false
                fetchHistory(pairOnly).finally(() => setRefreshing(false));
              }}
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Icon name="history" size={48} color={COLORS.slate200} />
              <Text style={styles.emptyText}>No history found</Text>
            </View>
          }
        />
      )}

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
              <TouchableOpacity style={styles.modalOption} onPress={handleDeleteItem}>
                <Icon name="delete" size={24} color={COLORS.danger} />
                <Text style={[styles.modalOptionText, { color: COLORS.danger }]}>Delete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.modalOption} onPress={() => setModalVisible(false)}>
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  headerRight: {
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  headerCount: { fontSize: 12, fontWeight: 'bold', color: COLORS.slate400 },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
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
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    height: 34,
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  filterText: { fontSize: 12, fontWeight: 'bold', color: COLORS.slate400 },
  filterTextActive: { color: '#fff' },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.slate400,
    letterSpacing: 0.5,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 14,
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
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  typeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { fontSize: 12, color: COLORS.slate400 },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.slate400,
  },
  moreBtn: { padding: 6 },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.slate400,
    textAlign: 'center',
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
    backgroundColor: COLORS.slate200,
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
