import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
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

const getAndroidSdkVersion = () => {
  return typeof Platform.Version === 'number'
    ? Platform.Version
    : parseInt(String(Platform.Version), 10);
};

const getMimeType = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    txt: 'text/plain',
    zip: 'application/zip',
  };
  return ext ? mimeMap[ext] || 'application/octet-stream' : 'application/octet-stream';
};

const requestLegacyAndroidDownloadPermission = async () => {
  if (Platform.OS !== 'android' || getAndroidSdkVersion() >= 29) {
    return true;
  }
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    {
      title: 'Storage Permission',
      message: 'ShareDocu needs storage permission to save files to Downloads.',
      buttonPositive: 'OK',
    }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const triggerWebDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const downloadOnWeb = (docId: string, docName: string, url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        triggerWebDownload(xhr.response, docName);
        resolve(`downloaded:${docName}`);
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send();
  });

export const useFileDownload = ({
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
}: UseFileDownloadProps = {}) => {
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: DownloadProgress }>({});

  const downloadFile = useCallback(async (docId: string, docName: string, docType: string, url?: string) => {
    if (downloadProgress[docId]?.isDownloading) return;

    if (!url) return;

    try {
      setDownloadProgress(prev => ({
        ...prev,
        [docId]: { isDownloading: true, progress: 0 },
      }));

      onDownloadStart?.(docId);

      if (Platform.OS === 'web') {
        await downloadOnWeb(docId, docName, url);
      } else if (Platform.OS === 'android') {
        const safeName = docName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const mimeType = getMimeType(docName);
        const canSaveToDownloads = await requestLegacyAndroidDownloadPermission();

        if (!canSaveToDownloads) {
          throw new Error('Storage permission denied.');
        }

        const { dirs } = ReactNativeBlobUtil.fs;
        const sdkVersion = getAndroidSdkVersion();
        const legacyDownloadDir = dirs.LegacyDownloadDir || dirs.DownloadDir;
        const androidDownloadOptions =
          sdkVersion >= 29
            ? {
                useDownloadManager: true,
                notification: true,
                title: safeName,
                description: 'Downloading document from ShareDocu',
                mime: mimeType,
                mediaScannable: true,
                storeInDownloads: true,
              }
            : {
                useDownloadManager: true,
                notification: true,
                path: `${legacyDownloadDir}/${safeName}`,
                title: safeName,
                description: 'Downloading document from ShareDocu',
                mime: mimeType,
                mediaScannable: true,
              };

        const downloadTask = ReactNativeBlobUtil.config({
          fileCache: true,
          addAndroidDownloads: androidDownloadOptions,
        }).fetch('GET', url, {
          Accept: '*/*',
        });

        downloadTask.progress({ interval: 250 }, (received: number, total: number) => {
          if (total > 0) {
            const pct = Math.min(99, Math.round((received / total) * 100));
            setDownloadProgress(prev => ({
              ...prev,
              [docId]: { isDownloading: true, progress: pct },
            }));
          }
        });

        await downloadTask;

        setDownloadProgress(prev => ({
          ...prev,
          [docId]: { isDownloading: false, progress: 100 },
        }));
      } else {
        const { dirs } = ReactNativeBlobUtil.fs;
        const path = `${dirs.DocumentDir}/${docName}`;

        const task = ReactNativeBlobUtil.config({
          fileCache: true,
          path,
        }).fetch('GET', url, { Accept: '*/*' });

        await task;
      }

      setDownloadProgress(prev => ({
        ...prev,
        [docId]: { isDownloading: false, progress: 100 },
      }));

      onDownloadComplete?.(docId, docName);

    } catch (error: any) {
      setDownloadProgress(prev => ({
        ...prev,
        [docId]: { isDownloading: false, progress: 0, error: error.message },
      }));
      onDownloadError?.(docId, error);
    }
  }, [downloadProgress, onDownloadStart, onDownloadComplete, onDownloadError]);

  const cancelDownload = useCallback((docId: string) => {
    try { (ReactNativeBlobUtil as unknown as { cancel?: (id: string) => void }).cancel?.(docId); } catch {}
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
