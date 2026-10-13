// src/config/env.ts
import { Platform } from 'react-native';
import { API_URL as ENV_API_URL } from '@env';

// Check if running on web
const isWeb = Platform.OS === 'web';

const DEFAULT_DEV_API_URL = isWeb
  ? 'http://localhost:5000/api'
  : Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/api'
  : 'http://localhost:5000/api';

const RAW_API_URL = ENV_API_URL || DEFAULT_DEV_API_URL;

export const API_URL = RAW_API_URL.replace(/\/+$/, '');
export const AUTH_URL = `${API_URL}/auth`;
export const DOCUMENT_URL = `${API_URL}/documents`;
export const SYNC_URL = `${API_URL}/sync`;
