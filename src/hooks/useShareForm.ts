// src/hooks/useShareForm.ts

import { useState, useCallback, useReducer } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { launchCamera } from 'react-native-image-picker';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
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

// Helper to determine if sharing should be public (unauthenticated users)
const shouldSharePublicly = (userToken: string | null): boolean => {
return !userToken;
};

const detectFileType = (fileName: string): ShareCategory => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'heic', 'heif'];
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', '3gp', 'm4v', 'ts'];
  if (imageExts.includes(ext)) return 'Photos';
  if (videoExts.includes(ext)) return 'Videos';
  return 'Files';
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
setIsPublicSharing: (value: boolean) => void;
setPassword: (value: string) => void;

// File operations
  handleSelectMedia: (
    useCamera: boolean,
    categoryOverride?: Extract<ShareCategory, 'Photos' | 'Videos'>
  ) => Promise<void>;
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
      newErrors.textInput = 'Please enter content to share';
    }

    if (
      ['Photos', 'Videos', 'Files'].includes(formData.category) &&
      !formData.selectedFile
    ) {
      newErrors.file = 'Please select a file to share';
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
title: 'Location Access Required',
message:
'App needs location to share content with people nearby.',
buttonNeutral: 'Later',
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
    async (
      useCamera: boolean,
      categoryOverride?: Extract<ShareCategory, 'Photos' | 'Videos'>
    ) => {
      try {
        const mediaCategory = categoryOverride || formData.category;

        if (useCamera) {
          const options: any = {
            mediaType: mediaCategory === 'Videos' ? 'video' : 'photo',
            quality: 0.8,
            includeBase64: false,
            saveToPhotos: true,
            videoQuality: 'medium',
          };

          const result = await launchCamera(options);

          if (result.didCancel) return;
if (result.errorCode) {
Alert.alert(
'Cannot open camera',
result.errorMessage || 'Please try again'
);
return;
}

if (!result.assets?.[0]) {
Alert.alert('No content', 'Camera did not return photo/video');
return;
}

          const asset = result.assets[0];
          let uri = asset.uri || '';
          if (Platform.OS === 'android' && uri.startsWith('file://')) {
            uri = uri.replace('file://', '');
          }

          const fileName =
            asset.fileName ||
            `capture-${Date.now()}.${mediaCategory === 'Videos' ? 'mp4' : 'jpg'}`;
          const fileType =
            asset.type ||
            (mediaCategory === 'Videos' ? 'video/mp4' : 'image/jpeg');
          const fileSize = asset.fileSize || 0;

          dispatch({ type: 'SET_CATEGORY', payload: mediaCategory });
          dispatch({
            type: 'SET_SELECTED_FILE',
            payload: { uri, type: fileType, name: fileName, size: fileSize },
          });
        } else {
          const mimeTypes =
            mediaCategory === 'Videos'
              ? [types.video]
              : [types.images];

          const res = await pick({
            allowMultiSelection: false,
            type: mimeTypes,
          });

          if (res && res.length > 0) {
            const file = res[0];
            dispatch({ type: 'SET_CATEGORY', payload: mediaCategory });
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
if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
Alert.alert('Cannot select content', 'Please try again');
}
},
[formData.category]
);

// Document picker - unified, auto-detects file type
const handleSelectDocument = useCallback(async () => {
try {
const res = await pick({
  allowMultiSelection: false,
  type: [types.allFiles],
});

if (res && res.length > 0) {
  const file = res[0];
  const fileName = file.name || '';
  const detectedCategory = detectFileType(fileName);
  dispatch({ type: 'SET_CATEGORY', payload: detectedCategory });
  dispatch({
    type: 'SET_SELECTED_FILE',
    payload: {
      uri: file.uri || '',
      name: fileName,
      type: file.type || '',
      size: file.size || 0,
    },
  });
}
} catch (err: any) {
if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
Alert.alert('Cannot select file', 'Please try again');
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
'Location access required',
'You need to grant location access to share content with people nearby.'
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
        { name: 'isPublicSharing', data: String(formData.isPublicSharing) },
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

Alert.alert('Sharing started', 'People nearby can scan your content.', [
{ text: 'OK', onPress: () => navigation.goBack() },
]);
} catch (error: any) {
console.error('[Share Error]', {
message: error?.message,
status: error?.status,
responseText: error?.responseText,
raw: error,
});
Alert.alert('Cannot share', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }

async function uploadWithFetch(uploadFormData: FormData) {
// Public sharing is automatically enabled for unauthenticated users
const isPublic = shouldSharePublicly(token);
const uploadUrl = `${DOCUMENT_URL}/share${isPublic ? '-public' : ''}`;

const headers: Record<string, string> = {};
if (!isPublic && token) {
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
// Public sharing is automatically enabled for unauthenticated users
const isPublic = shouldSharePublicly(token);
const uploadUrl = `${DOCUMENT_URL}/share${isPublic ? '-public' : ''}`;

const headers: Record<string, string> = {
Accept: 'application/json',
'Content-Type': 'multipart/form-data',
};
if (!isPublic && token) {
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
return 'File is too large for server upload limit.';
}

if (status === 408 || status === 504) {
return 'Upload completed but server took too long. Please try again.';
}

if (status >= 500) {
return 'Server encountered an error. Please try again later.';
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

  const setIsPublicSharing = useCallback((value: boolean) => {
    dispatch({ type: 'SET_IS_PUBLIC_SHARING', payload: value });
  }, []);

const setPassword = useCallback((value: string) => {
dispatch({ type: 'SET_PASSWORD', payload: value });
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
setIsPublicSharing,
setPassword,
handleSelectMedia,
handleSelectDocument,
handleShare,
resetForm,
validate,
};
};
