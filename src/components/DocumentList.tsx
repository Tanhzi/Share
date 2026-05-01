import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import DocumentCard from './DocumentCard';

interface Document {
  id: string;
  name: string;
  type: string;
  ownerDevice: string;
  distance: string;
  size: string;
  isProtected: boolean;
  url?: string;
}

interface DocumentListProps {
  documents: Document[];
  onDocumentPress: (doc: Document) => void;
  isLoading?: boolean;
}

const COLORS = {
  primary: '#2563EB',
  secondary: '#10b981',
  bg: '#f8fafc',
  white: '#fff',
  slate400: '#94a3b8',
};

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentPress,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Scanning...</Text>
      </View>
    );
  }

  if (documents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📍</Text>
        <Text style={styles.emptyText}>No documents nearby</Text>
        <Text style={styles.emptySubtext}>
          Move around to discover shared files
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={documents}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <DocumentCard document={item} onPress={() => onDocumentPress(item)} />
      )}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.slate400,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.slate400,
    textAlign: 'center',
  },
});
