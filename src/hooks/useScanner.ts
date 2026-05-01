import { useState, useCallback } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useAuth } from '../context/AuthContext';
import { DOCUMENT_URL } from '../config/env';

export interface Document {
  id: string;
  name: string;
  type: string;
  ownerDevice: string;
  distance: string;
  size: string;
  isProtected: boolean;
  url?: string;
  file_type?: string;
  file_size?: number;
  is_anonymous?: boolean;
}

interface UseScannerReturn {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  scan: () => Promise<void>;
  refresh: () => Promise<void>;
}

const getFileType = (dbType: string): string => {
  const type = dbType.toLowerCase();
  if (type.includes('photo') || type.includes('image')) return 'jpg';
  if (type.includes('video')) return 'mp4';
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('link')) return 'link';
  return 'file';
};

const formatBytes = (bytes: number, decimals = 2): string => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const useScanner = (): UseScannerReturn => {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'Location is needed to scan nearby files.'
        );
        return null;
      }
    }

    return new Promise((resolve, _reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        err => {
          console.error('GPS Error:', err);
          Alert.alert('GPS Error', 'Could not get location.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }, []);

  const scan = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        setIsLoading(false);
        return;
      }

      const scanEndpoint = token ? '/scan' : '/scan-public';
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(
        `${DOCUMENT_URL}${scanEndpoint}?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=50`,
        { headers }
      );

      const data = await res.json();

      if (res.ok && Array.isArray(data?.documents)) {
        const mappedDocs = data.documents.map((doc: any) => {
          const distanceVal = Math.floor(Math.random() * 30) + 1;
          return {
            id: doc.id,
            name: doc.name,
            type: getFileType(doc.file_type),
            ownerDevice: doc.is_anonymous ? 'Anonymous' : 'Unknown Device',
            distance: `${distanceVal}m`,
            size: formatBytes(doc.file_size),
            isProtected: doc.is_protected,
            url: doc.file_url,
            file_type: doc.file_type,
            file_size: doc.file_size,
            is_anonymous: doc.is_anonymous,
          };
        });
        setDocuments(mappedDocs);
      } else {
        console.error('Scan failed:', data);
        setError('Failed to scan documents.');
        Alert.alert('Error', 'Failed to scan documents.');
      }
    } catch (err) {
      console.error('Scan failed:', err);
      setError('Network request failed.');
      Alert.alert('Error', 'Network request failed.');
    } finally {
      setIsLoading(false);
    }
  }, [token, getCurrentLocation]);

  const refresh = useCallback(async () => {
    await scan();
  }, [scan]);

  return {
    documents,
    isLoading,
    error,
    scan,
    refresh,
  };
};
