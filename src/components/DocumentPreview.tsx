import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';

interface DocumentPreviewProps {
  document: {
    id: string;
    type: string;
    name: string;
    url?: string;
    localPath?: string;
    thumbnail?: string;
  };
  onPreviewClose?: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, onPreviewClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [showFullPreview, setShowFullPreview] = useState(false);

  const sourceUri = document.localPath || document.url || '';

  const renderPreview = () => {
    const type = document.type?.toLowerCase();

    if (type === 'image' || type?.includes('image') || type?.includes('photo')) {
      return (
        <View style={styles.mediaContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          )}
          <Image
            source={{ uri: sourceUri }}
            style={styles.imagePreview}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load image');
            }}
            resizeMode="cover"
          />
        </View>
      );
    }

    if (type === 'video' || type?.includes('video')) {
      return (
        <View style={styles.mediaContainer}>
          <Video
            source={{ uri: sourceUri }}
            style={styles.videoPreview}
            paused={true}
            onError={(e) => setError(e.nativeEvent.errorString)}
            onBuffer={() => setIsLoading(false)}
          />
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => setShowFullPreview(true)}
          >
            <Icon name="play-circle-filled" size={48} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    if (type === 'pdf' || type?.includes('pdf')) {
      return (
        <View style={styles.filePreview}>
          <Icon name="picture-as-pdf" size={48} color="#ef4444" />
          <Text style={styles.fileName}>{document.name}</Text>
          <Text style={styles.fileType}>PDF Document</Text>
          <TouchableOpacity style={styles.openButton} onPress={() => setShowFullPreview(true)}>
            <Text style={styles.openButtonText}>Open PDF</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Default file preview
    return (
      <View style={styles.filePreview}>
        <Icon name="insert-drive-file" size={48} color="#64748b" />
        <Text style={styles.fileName} numberOfLines={2}>
          {document.name}
        </Text>
        <Text style={styles.fileType} textTransform="uppercase">
          {type || 'Unknown'}
        </Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <>
      {renderPreview()}
      
      {/* Full Screen Preview Modal for Video/PDF */}
      <Modal
        visible={showFullPreview}
        onRequestClose={() => setShowFullPreview(false)}
        animationType="fade"
      >
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity onPress={() => setShowFullPreview(false)}>
              <Icon name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fullScreenTitle} numberOfLines={1}>
              {document.name}
            </Text>
          </View>
          
          <View style={styles.fullScreenContent}>
            {document.type?.includes('video') && sourceUri ? (
              <Video
                source={{ uri: sourceUri }}
                style={styles.fullScreenVideo}
                controls={true}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.comingSoonContainer}>
                <Icon name="construction" size={64} color="#fff" />
                <Text style={styles.comingSoonText}>Full preview coming soon</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  mediaContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  videoPreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  playButton: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
  },
  filePreview: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 12,
    textAlign: 'center',
  },
  fileType: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  openButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  openButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  fullScreenTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenVideo: {
    width: '100%',
    height: 300,
  },
  comingSoonContainer: {
    alignItems: 'center',
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
});

export default DocumentPreview;
