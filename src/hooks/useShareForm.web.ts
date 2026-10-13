import { useState, useCallback, useReducer } from 'react';
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
import { pickDocument } from '../utils/filePicker.web';
import { showAlert } from '../utils/alert';

const initialState: ShareFormData = initialShareFormData;

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

const detectFileType = (fileName: string): ShareCategory => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'heic', 'heif'];
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', '3gp', 'm4v', 'ts'];

  if (imageExts.includes(ext)) return 'Photos';
  if (videoExts.includes(ext)) return 'Videos';
  return 'Files';
};

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
  formData: ShareFormData;
  isLoading: boolean;
  uploadProgress: number;
  errors: Record<string, string>;
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
  handleSelectMedia: (
    useCamera: boolean,
    categoryOverride?: Extract<ShareCategory, 'Photos' | 'Videos'>
  ) => Promise<void>;
  handleSelectDocument: () => Promise<void>;
  handleShare: () => Promise<void>;
  resetForm: () => void;
  validate: () => boolean;
}

const getLocation = async (): Promise<{ latitude: number; longitude: number }> => {
  if (!navigator.geolocation) {
    throw new Error(
      'Location is required to share. Your browser does not support geolocation.'
    );
  }

  const tryGetPosition = (timeout: number): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout,
        maximumAge: 120000,
      });
    });

  for (const timeout of [2000, 5000]) {
    try {
      const pos = await tryGetPosition(timeout);
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    } catch {
      // Try next timeout
    }
  }

  // Không lấy được vị trí -> chặn share thay vì gán tọa độ (0,0)
  throw new Error(
    'Location is required to share. Please allow GPS permission and try again.'
  );
};

export const useShareForm = (navigation: any): UseShareFormReturn => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, dispatch] = useReducer(formReducer, initialState);

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

  // Unified file picker - accepts ALL file types, auto-detects category
  const handleSelectDocument = useCallback(async () => {
    try {
      const files = await pickDocument();
      if (!files || files.length === 0) return;

      const file = files[0];
      const detectedCategory = detectFileType(file.name);

      const shareFile: ShareFile = {
        uri: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
      };

      dispatch({ type: 'SET_CATEGORY', payload: detectedCategory });
      dispatch({ type: 'SET_SELECTED_FILE', payload: shareFile });
    } catch (err: any) {
      if (err?.message !== 'User canceled document picker') {
        showAlert('Cannot select file', 'Please try again');
      }
    }
  }, []);

  // Media picker: camera dùng input capture (T11), còn lại dùng unified picker
  const handleSelectMedia = useCallback(
    async (
      useCamera: boolean,
      _categoryOverride?: Extract<ShareCategory, 'Photos' | 'Videos'>
    ) => {
      if (!useCamera) {
        await handleSelectDocument();
        return;
      }

      try {
        const files = await pickDocument({ type: ['image/*'], capture: true });
        if (!files || files.length === 0) return;

        const file = files[0];
        const shareFile: ShareFile = {
          uri: URL.createObjectURL(file),
          name: file.name || `capture-${Date.now()}.jpg`,
          type: file.type || 'image/jpeg',
          size: file.size,
        };

        dispatch({ type: 'SET_CATEGORY', payload: 'Photos' });
        dispatch({ type: 'SET_SELECTED_FILE', payload: shareFile });
      } catch (err: any) {
        if (err?.message !== 'User canceled document picker') {
          showAlert('Cannot capture photo', 'Please try again');
        }
      }
    },
    [handleSelectDocument]
  );

  const handleShare = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const { latitude, longitude } = await getLocation();

      const fields: { name: string; data: string }[] = [
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

      const isPublic = !token;
      const uploadUrl = `${DOCUMENT_URL}/share${isPublic ? '-public' : ''}`;

      const headers: Record<string, string> = {};
      if (!isPublic && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (formData.category === 'Links') {
        const uploadFormData = new FormData();
        fields.forEach((field) => uploadFormData.append(field.name, field.data));
        uploadFormData.append('linkContent', formData.linkContent.trim());
        await uploadFormDataFetch(uploadUrl, headers, uploadFormData);
      } else if (formData.category === 'Text') {
        const uploadFormData = new FormData();
        fields.forEach((field) => uploadFormData.append(field.name, field.data));
        uploadFormData.append('textContent', formData.textContent.trim());
        await uploadFormDataFetch(uploadUrl, headers, uploadFormData);
      } else if (formData.selectedFile) {
        await uploadFileFetch(uploadUrl, headers, latitude, longitude);
      }

      showAlert('Sharing started', 'People nearby can scan your content.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('[Share Error]', {
        message: error?.message,
        status: error?.status,
        responseText: error?.responseText,
        raw: error,
      });
      showAlert('Cannot share', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }

    async function uploadFormDataFetch(
      url: string,
      headers: Record<string, string>,
      body: FormData
    ) {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: body as any,
      });

      const responseText = await response.text().catch(() => '');
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        // ignore
      }

      if (!response.ok) {
        throw new UploadError(
          data.message || data.error || `Upload failed (${response.status})`,
          response.status,
          responseText
        );
      }
    }

    async function uploadFileFetch(
      url: string,
      headers: Record<string, string>,
      lat: number,
      lng: number
    ) {
      const file = formData.selectedFile!;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const finalFormData = new FormData();

      const fields: { name: string; data: string }[] = [
        { name: 'category', data: formData.category },
        { name: 'expiration', data: formData.expiration },
        { name: 'isAnonymous', data: String(formData.isAnonymous) },
        { name: 'isPublicSharing', data: String(formData.isPublicSharing) },
        { name: 'latitude', data: String(lat) },
        { name: 'longitude', data: String(lng) },
      ];

      if (formData.isPasswordProtected && formData.password.trim()) {
        fields.push({ name: 'password', data: formData.password.trim() });
      }

      fields.forEach((f) => finalFormData.append(f.name, f.data));
      finalFormData.append('file', blob, file.name);

      const uploadResponse = await fetch(url, {
        method: 'POST',
        headers,
        body: finalFormData as any,
      });

      const responseText = await uploadResponse.text().catch(() => '');
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        // ignore
      }

      if (!uploadResponse.ok) {
        throw new UploadError(
          data.message || data.error || `Upload failed (${uploadResponse.status})`,
          uploadResponse.status,
          responseText
        );
      }

      setUploadProgress(100);
    }
  }, [formData, token, validate, navigation]);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET' });
    setUploadProgress(0);
    setErrors({});
  }, []);

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
