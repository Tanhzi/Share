import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export interface Document {
  id: string;
  name: string;
  type: string;
  ownerDevice: string;
  distance?: string | null;
  size: string;
  timestamp?: string;
  isProtected?: boolean;
  url?: string;
}

interface DocumentCardProps {
  document: Document;
  onPress: (doc: Document) => void;
  downloading?: boolean;
  downloadProgress?: number;
}

const COLORS = {
  slate50: '#f8fafc',
  slate400: '#94a3b8',
  slate500: '#64748b',
  primary: '#2563EB',
  white: '#fff',
  warning: '#f59e0b',
  success: '#10b981',
};

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onPress, downloading, downloadProgress }) => {
  const getIconInfo = (type: string, name: string) => {
    const t = (type || '').toLowerCase();
    const cleanName = (name || '').split('?')[0];
    const ext = (cleanName.split('.').pop() || '').toLowerCase();

    if (t.includes('link')) {
      return { name: 'link', color: '#f97316', bg: '#fff7ed' };
    }
    if (
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'].includes(ext) ||
      t.includes('photo') ||
      t.includes('image')
    ) {
      return { name: 'image', color: '#a855f7', bg: '#faf5ff' };
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || t.includes('video')) {
      return { name: 'movie', color: '#f43f5e', bg: '#fff1f2' };
    }
    if (ext === 'pdf' || t.includes('pdf')) {
      return { name: 'picture-as-pdf', color: '#ef4444', bg: '#fef2f2' };
    }
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext) || t.includes('docx')) {
      return { name: 'description', color: '#3b82f6', bg: '#eff6ff' };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { name: 'folder-zip', color: '#6366f1', bg: '#eef2ff' };
    }
    if (ext === 'txt' || t.includes('text')) {
      return { name: 'notes', color: '#10b981', bg: '#ecfdf5' };
    }
    return { name: 'draft', color: '#64748b', bg: '#f8fafc' };
  };

  const { name, color, bg } = getIconInfo(document.type, document.name);

  return (
    <TouchableOpacity
      style={[styles.card, downloading && styles.cardDownloading]}
      activeOpacity={0.7}
      onPress={() => onPress(document)}
      disabled={downloading}
    >
      <View style={[styles.iconContainer, { backgroundColor: bg }]}>
        <Icon name={name} size={28} color={color} />
        <View
          style={[
            styles.securityBadge,
            {
              backgroundColor: document.isProtected ? '#fffbeb' : '#f0fdf4',
              borderColor: document.isProtected ? '#fcd34d' : '#86efac',
            },
          ]}>
          <Icon
            name={document.isProtected ? 'lock' : 'public'}
            size={10}
            color={document.isProtected ? COLORS.warning : COLORS.success}
          />
        </View>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {document.type === 'link' && document.isProtected
            ? '***'
            : document.name}
        </Text>
        <View style={styles.deviceRow}>
          <Icon name="smartphone" size={14} color={COLORS.slate400} />
          <Text numberOfLines={1} style={styles.deviceText}>
            {document.ownerDevice}
          </Text>
        </View>
        <View style={styles.metaRow}>
          {document.distance ? (
            <View style={styles.badge}>
              <Icon name="location-on" size={12} color={COLORS.primary} />
              <Text style={styles.badgeText}>{document.distance}</Text>
            </View>
          ) : null}
          <Text style={styles.metaText}>{document.size}</Text>
          <View
            style={[
              styles.securityTag,
              { backgroundColor: document.isProtected ? '#fffbeb' : '#f0fdf4' },
            ]}>
            <Text
              style={[
                styles.securityText,
                { color: document.isProtected ? '#d97706' : '#15803d' },
              ]}>
              {document.isProtected ? 'Protected' : 'Public'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.downloadBtn}>
          {downloading ? (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            {downloadProgress !== undefined && downloadProgress > 0 && (
              <Text style={styles.progressText}>{downloadProgress}%</Text>
            )}
          </View>
        ) : (
          <Icon
            name={
              document.type === 'link'
                ? 'link'
                : document.isProtected
                ? 'lock'
                : 'download'
            }
            size={24}
            color={document.type === 'link' ? '#f97316' : COLORS.primary}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.slate50,
    elevation: 2,
  },
  cardDownloading: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  securityBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
  },
  content: { flex: 1, marginRight: 8 },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  deviceText: { fontSize: 12, color: COLORS.slate500 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: COLORS.slate50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeText: { fontSize: 11, color: COLORS.primary, fontWeight: 'bold' },
  metaText: { fontSize: 11, color: COLORS.slate500, fontWeight: '500' },
  securityTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  securityText: { fontSize: 10, fontWeight: 'bold' },
  downloadBtn: {
    padding: 8,
    backgroundColor: COLORS.slate50,
    borderRadius: 50,
    minWidth: 40,
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    gap: 2,
  },
  progressText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default DocumentCard;
