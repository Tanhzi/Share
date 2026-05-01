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
      headers: getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
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

    if (error instanceof SyntaxError) {
      throw new ApiError('Invalid response format', 0, 'PARSE_ERROR');
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
