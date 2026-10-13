import { API_URL } from '../config/env';

interface RequestOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// --- Xử lý 401 (token hết hạn / bị thu hồi) ---
// AuthContext đăng ký callback để tự logout, tránh circular import.
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null): void => {
  unauthorizedHandler = handler;
};

// 401 từ lỗi xác thực nghiệp vụ (sai mật khẩu...) KHÔNG được coi là token hết hạn
const BUSINESS_401_PATTERNS = ['incorrect password', 'password required'];

const isSessionExpired401 = (message: string): boolean => {
  const lower = message.toLowerCase();
  return !BUSINESS_401_PATTERNS.some(p => lower.includes(p));
};

const getHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export async function apiCall<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  const { token, ...fetchOptions } = options || {};

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      // Header của caller ghi đè default, không bị bỏ qua (T14)
      headers: {
        ...getHeaders(token),
        ...(fetchOptions.headers as Record<string, string> | undefined),
      },
    });

    // Đọc text trước để không ném SyntaxError với body rỗng/HTML (T15)
    const raw = await response.text();
    let data: any = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        if (response.ok) {
          throw new ApiError('Invalid response format', response.status, 'PARSE_ERROR');
        }
        data = {};
      }
    }

    if (!response.ok) {
      // Token hết hạn / bị thu hồi khi gọi API có kèm token -> đăng xuất
      if (response.status === 401 && token && isSessionExpired401(data?.message || '')) {
        unauthorizedHandler?.();
      }

      throw new ApiError(
        data.message || 'API request failed',
        response.status,
        data.code
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Thêm thông tin lỗi chi tiết hơn
    if (error instanceof Error) {
      console.error('API Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    throw new ApiError(
      'Network error. Please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}

export async function apiGet<T>(endpoint: string, token?: string): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'GET',
    token,
  });
}

export async function apiPost<T>(
  endpoint: string,
  data?: any,
  token?: string
): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function apiPut<T>(
  endpoint: string,
  data?: any,
  token?: string
): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  });
}

export async function apiDelete<T>(
  endpoint: string,
  token?: string
): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'DELETE',
    token,
  });
}
