export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  file_type: string;
  raw_type: 'sent' | 'received' | string;
  is_protected: boolean;
  owner_name?: string;
  owner_id?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  expires_at?: string;
  size?: number;
  url?: string;
  download_url?: string;
}

export interface ScanResponse {
  success: boolean;
  data?: Document[];
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface Error {
  message: string;
  code?: string;
  status?: number;
}
