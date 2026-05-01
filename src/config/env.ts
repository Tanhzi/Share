// src/config/env.ts
import { Platform } from 'react-native';

const DEFAULT_DEV_API_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';

export const API_URL = (process.env.API_URL || DEFAULT_DEV_API_URL).replace(
  /\/+$/,
  ''
);
export const AUTH_URL = `${API_URL}/auth`;
export const DOCUMENT_URL = `${API_URL}/documents`;
export const SYNC_URL = `${API_URL}/sync`;
