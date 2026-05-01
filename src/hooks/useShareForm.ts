// src/hooks/useShareForm.ts

import { useState, useCallback, useReducer } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { launchCamera } from 'react-native-image-picker';
import * as DocumentPicker from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { useAuth } from '../context/AuthContext';
import { DOCUMENT_URL } from '../config/env';
import {
  shareFormReducer as formReducer,
  initialShareFormData,
} from '../types/shareForm';
import type {
  ShareFormData,
  ShareFile,
  ShareCategory,
  ShareFormAction,
} from '../types/shareForm';

// Initial state
const initialState: ShareFormData = initialShareFormData;

// Validation functions
const validateLink = (link: string): boolean => {
  if (!link.trim()) return false;
  try {
    return Boolean(new URL(link));
  } catch {
    return false;
  }
};

const validatePassword = (pwd: string): boolean => {
  return pwd.length >= 4;
};

const LARGE_FILE_UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

class UploadError extends Error {
  status?: number;
  responseText?: string;

  constructor(message: string, status?: number, responseText?: string) {
    super(message);
    this.name = 'UploadError';
    this.status = status;
    this.responseText = responseText;
  }
}

interface UseShareFormReturn {
  // State
  formData: ShareFormData;
  isLoading: boolean;
  uploadProgress: number;
  errors: Record<string, string>;

  // Actions
  dispatch: React.Dispatch<ShareFormAction>;
  setCategory: (category: ShareCategory) => void;
  setLinkInput: (value: string) => void;
  setTextInput: (value: string) => void;
  setSelectedFile: (file: ShareFile | null) => void;
  setExpiration: (value: string) => void;
  setIsAnonymous: (value: boolean) => void;
  setIsPasswordProtected: (value: boolean) => void;
  setPassword: (value: string) => void;
  setIsPublicSharing: (value: boolean) => void;

  // File operations
  handleSelectMedia: (useCamera: boolean) => Promise<void>;
  handleSelectDocument: () => Promise<void>;

  // Share operation
  handleShare: () => Promise<void>;
  resetForm: () => void;

  // Validation
  validate: () => boolean;
}

export const useShareForm = (navigation: any): UseShareFormReturn => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, dispatch] = useReducer(formReducer, initialState);

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.category === 'Links' && !validateLink(formData.linkContent)) {
      newErrors.linkInput = 'Please enter a valid link';
    }

    if (formData.category === 'Text' && !formData.textContent.trim()) {
      newErrors.textInput = 'Please enter some text';
    }

    if (
      ['Photos', 'Videos', 'Files'].includes(formData.category) &&
      !formData.selectedFile
    ) {
      newErrors.file = 'Please select a file';
    }

    if (formData.isPasswordProtected && !validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Permission handler
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'This app needs access to your location to share files nearby.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return false;
  }, []);

  // Media picker
  const handleSelectMedia = useCallback(
    async (useCamera: boolean) => {
      try {
        if (useCamera) {
          const options: any = {
            mediaType: formData.category === 'Videos' ? 'video' : 'photo',
            quality: 0.8,
            includeBase64: false,
            saveToPhotos: true,
            videoQuality: 'medium',
          };

          const result = await launchCamera(options);

          if (result.didCancel) return;
          if (result.errorCode) {
            Alert.alert(
              'Error',
              result.errorMessage || 'Failed to capture media'
            );
            return;
          }

          if (!result.assets?.[0]) {
            Alert.alert('Error', 'No media returned');
            return;
          }

          const asset = result.assets[0];
          let uri = asset.uri || '';
          if (Platform.OS === 'android' && uri.startsWith('file://')) {
            uri = uri.replace('file://', '');
          }

          const fileName =
            asset.fileName ||
            `capture-${Date.now()}.${
              formData.category === 'Videos' ? 'mp4' : 'jpg'
            }`;
          const fileType =
            asset.type ||
            (formData.category === 'Videos' ? 'video/mp4' : 'image/jpeg');
          const fileSize = asset.fileSize || 0;

          dispatch({
            type: 'SET_SELECTED_FILE',
            payload: { uri, type: fileType, name: fileName, size: fileSize },
          });
        } else {
          const mimeTypes =
            formData.category === 'Videos'
              ? [DocumentPicker.types.video]
              : [DocumentPicker.types.images];

          const res = await DocumentPicker.pick({
            allowMultiSelection: false,
            type: mimeTypes,
          });

          if (res && res.length > 0) {
            const file = res[0];
            dispatch({
              type: 'SET_SELECTED_FILE',
              payload: {
                uri: file.uri || '',
                name: file.name || '',
                type: file.type || '',
                size: file.size || 0,
              },
            });
          }
        }
      } catch (err: any) {
        if (err?.message !== 'User canceled document picker') {
          Alert.alert('Error', 'Unknown error picking file');
        }
      }
    },
    [formData.category]
  );

  // Document picker
  const handleSelectDocument = useCallback(async () => {
    try {
      const res = await DocumentPicker.pick({
        allowMultiSelection: false,
        type: [DocumentPicker.types.allFiles],
      });

      if (res && res.length > 0) {
        const file = res[0];
        dispatch({
          type: 'SET_SELECTED_FILE',
          payload: {
            uri: file.uri || '',
            name: file.name || '',
            type: file.type || '',
            size: file.size || 0,
          },
        });
      }
    } catch (err: any) {
      if (err?.message !== 'User canceled document picker') {
        Alert.alert('Error', 'Unknown error picking file');
      }
    }
  }, []);

  // Share handler
  const handleShare = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Location is required to share files nearby.'
        );
        setIsLoading(false);
        return;
      }

      // Get location
      const position = await new Promise<Geolocation.GeoPosition>(
        (resolve, reject) => {
          Geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      const fields = [
        { name: 'category', data: formData.category },
        { name: 'expiration', data: formData.expiration },
        { name: 'isAnonymous', data: String(formData.isAnonymous) },
        { name: 'latitude', data: String(latitude) },
        { name: 'longitude', data: String(longitude) },
      ];

      if (formData.isPasswordProtected && formData.password.trim()) {
        fields.push({ name: 'password', data: formData.password.trim() });
      }

      if (formData.category === 'Links') {
        const uploadFormData = new FormData();
        fields.forEach(field => uploadFormData.append(field.name, field.data));
        uploadFormData.append('linkContent', formData.linkContent.trim());
        await uploadWithFetch(uploadFormData);
      } else if (formData.category === 'Text') {
        const uploadFormData = new FormData();
        fields.forEach(field => uploadFormData.append(field.name, field.data));
        uploadFormData.append('textContent', formData.textContent.trim());
        await uploadWithFetch(uploadFormData);
      } else if (formData.selectedFile) {
        await uploadFileWithBlobUtil([
          ...fields,
          {
            name: 'file',
            filename: formData.selectedFile.name,
            data: ReactNativeBlobUtil.wrap(
              normalizeUploadPath(formData.selectedFile.uri)
            ),
            type: formData.selectedFile.type || 'application/octet-stream',
          },
        ]);
      }

      Alert.alert('Success', 'Sharing started successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('[Share Error]', {
        message: error?.message,
        status: error?.status,
        responseText: error?.responseText,
        raw: error,
      });
      Alert.alert('Error', error.message || 'Could not share document');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }

    async function uploadWithFetch(uploadFormData: FormData) {
      const uploadUrl = `${DOCUMENT_URL}/share${
        formData.isPublicSharing ? '-public' : ''
      }`;

      const headers: Record<string, string> = {};
      if (!formData.isPublicSharing && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: uploadFormData as any,
      });

      const responseText = await response.text().catch(() => '');
      const data = parseResponseJson(responseText);

      if (!response.ok) {
        throw createUploadError(response.status, data, responseText);
      }
    }

    async function uploadFileWithBlobUtil(parts: any[]) {
      const uploadUrl = `${DOCUMENT_URL}/share${
        formData.isPublicSharing ? '-public' : ''
      }`;

      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      };
      if (!formData.isPublicSharing && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const task = ReactNativeBlobUtil.config({
        timeout: LARGE_FILE_UPLOAD_TIMEOUT_MS,
      }).fetch('POST', uploadUrl, headers, parts);

      const response = await task.uploadProgress(
        { interval: 250 },
        (sent, total) => {
          if (total > 0) {
            setUploadProgress(Math.min(99, Math.round((sent / total) * 100)));
          }
        }
      );

      const status = response.respInfo.status;
      const responseText = await response.text();
      const data = parseResponseJson(responseText);

      if (status < 200 || status >= 300) {
        throw createUploadError(status, data, responseText);
      }

      setUploadProgress(100);
    }

    function normalizeUploadPath(uri: string): string {
      if (!uri) {
        return uri;
      }

      if (
        Platform.OS === 'android' &&
        !uri.startsWith('file://') &&
        !uri.startsWith('content://')
      ) {
        return `file://${uri}`;
      }

      return uri;
    }

    function parseResponseJson(text: string): any {
      if (!text) {
        return {};
      }

      try {
        return JSON.parse(text);
      } catch {
        return {};
      }
    }

    function createUploadError(
      status: number,
      data: any,
      responseText: string
    ): UploadError {
      const serverMessage =
        data.message || data.error || data.details || data.detail;
      const message =
        serverMessage ||
        getDefaultUploadErrorMessage(status, responseText) ||
        'Upload failed';

      return new UploadError(message, status, responseText);
    }

    function getDefaultUploadErrorMessage(
      status: number,
      responseText: string
    ): string {
      if (status === 413) {
        return 'File is too large for the server upload limit. Please increase the backend/proxy file size limit.';
      }

      if (status === 408 || status === 504) {
        return 'Upload finished, but the server took too long to process the file. Please try again or increase the backend timeout.';
      }

      if (status >= 500) {
        return 'Upload finished, but the server failed while processing the file. Check the backend logs for the real error.';
      }

      if (responseText) {
        return `Upload failed with status ${status}`;
      }

      return `Upload failed with status ${status || 'unknown'}`;
    }
  }, [formData, token, validate, requestLocationPermission, navigation]);

  // Reset form
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET' });
    setUploadProgress(0);
    setErrors({});
  }, []);

  // Action creators
  const setCategory = useCallback((category: ShareCategory) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  }, []);

  const setLinkInput = useCallback((value: string) => {
    dispatch({ type: 'SET_LINK_INPUT', payload: value });
  }, []);

  const setTextInput = useCallback((value: string) => {
    dispatch({ type: 'SET_TEXT_INPUT', payload: value });
  }, []);

  const setSelectedFile = useCallback((file: ShareFile | null) => {
    dispatch({ type: 'SET_SELECTED_FILE', payload: file });
  }, []);

  const setExpiration = useCallback((value: string) => {
    dispatch({ type: 'SET_EXPIRATION', payload: value });
  }, []);

  const setIsAnonymous = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IS_ANONYMOUS', payload: value });
  }, []);

  const setIsPasswordProtected = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IS_PASSWORD_PROTECTED', payload: value });
  }, []);

  const setPassword = useCallback((value: string) => {
    dispatch({ type: 'SET_PASSWORD', payload: value });
  }, []);

  const setIsPublicSharing = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IS_PUBLIC_SHARING', payload: value });
  }, []);

  return {
    formData,
    isLoading,
    uploadProgress,
    errors,
    dispatch,
    setCategory,
    setLinkInput,
    setTextInput,
    setSelectedFile,
    setExpiration,
    setIsAnonymous,
    setIsPasswordProtected,
    setPassword,
    setIsPublicSharing,
    handleSelectMedia,
    handleSelectDocument,
    handleShare,
    resetForm,
    validate,
  };
};
