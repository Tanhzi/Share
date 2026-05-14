import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReactNativeBlobUtil from 'react-native-blob-util';

interface DownloadProgress {
  isDownloading: boolean;
  progress: number;
  error?: string;
}

interface UseFileDownloadProps {
  onDownloadStart?: (docId: string) => void;
  onDownloadComplete?: (docId: string, path: string) => void;
  onDownloadError?: (docId: string, error: Error) => void;
}

export const useFileDownload = ({
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
}: UseFileDownloadProps = {}) => {
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: DownloadProgress }>({});

  const downloadFile = useCallback(async (docId: string, docName: string, docType: string, url?: string) => {
    if (downloadProgress[docId]?.isDownloading) {
      console.log('Already downloading:', docId);
      return;
    }

    try {
      setDownloadProgress(prev => ({
        ...prev,
        [docId]: { isDownloading: true, progress: 0 },
      }));

      onDownloadStart?.(docId);

      const { dirs } = ReactNativeBlobUtil.fs;
      const path = Platform.OS === 'ios'
        ? `${dirs.DocumentDir}/${docName}`
        : `${dirs.DownloadDir}/${docName}`;

      let downloadTask: any;

      if (url) {
        downloadTask = ReactNativeBlobUtil.config({
          fileCache: true,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            path: path,
            description: `Downloading ${docName}`,
            title: docName,
            mediaScannable: true,
          },
        }).fetch('GET', url, {
          Accept: '*/*',
        });

        downloadTask.progress((received: number, total: number) => {
          const percent = Math.round((received / total) * 100);
          setDownloadProgress(prev => ({
            ...prev,
            [docId]: { isDownloading: true, progress: percent },
          }));
        });

        await downloadTask;
      }

      setDownloadProgress(prev => ({
        ...prev,
        [docId]: { isDownloading: false, progress: 100 },
      }));

      onDownloadComplete?.(docId, path);
      Alert.alert('Success', `${docName} saved to: ${path}`);

    } catch (error: any) {
      setDownloadProgress(prev => ({
        ...prev,
        [docId]: { isDownloading: false, progress: 0, error: error.message },
      }));

      onDownloadError?.(docId, error);
      Alert.alert('Error', `Download failed: ${error.message}`);
    }
  }, [downloadProgress, onDownloadStart, onDownloadComplete, onDownloadError]);

  const cancelDownload = useCallback((docId: string) => {
    ReactNativeBlobUtil.cancel(docId);
    setDownloadProgress(prev => ({
      ...prev,
      [docId]: { isDownloading: false, progress: 0 },
    }));
  }, []);

  const getProgress = useCallback((docId: string) => {
    return downloadProgress[docId] || { isDownloading: false, progress: 0 };
  }, [downloadProgress]);

  return {
    downloadFile,
    cancelDownload,
    getProgress,
    downloadProgress,
  };
};

export default useFileDownload;
