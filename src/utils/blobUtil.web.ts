// Web mock for react-native-blob-util
// Uses browser's native Blob, FileReader, and fetch/XMLHttpRequest APIs

const _fetch = globalThis.fetch.bind(globalThis);

export interface BlobUtilConfig {
  timeout?: number;
  fileCache?: boolean;
  path?: string;
  addAndroidDownloads?: any;
  IOSProps?: any;
}

export interface ProgressCallback {
  (received: number, total: number): void;
}

// Configuration
export const config = (_options: BlobUtilConfig) => {
  return {
    fetch: (
      method: string,
      url: string,
      headers: Record<string, string>,
      body: any
    ): any => {
      return createDownloadTask(method, url, headers, body);
    },
  };
};

function createDownloadTask(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: any
) {
  const xhr = new XMLHttpRequest();
  const progressCallbacks: ProgressCallback[] = [];

  const promise = new Promise<any>((resolve, reject) => {
    xhr.open(method, url);
    Object.keys(headers || {}).forEach((k) =>
      xhr.setRequestHeader(k, headers[k])
    );
    xhr.responseType = 'blob';
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          respInfo: { status: xhr.status, headers: {} as Record<string, string> },
          text: () => Promise.resolve(xhr.responseText || ''),
          json: () => {
            try { return Promise.resolve(JSON.parse(xhr.responseText || '{}')); }
            catch { return Promise.resolve({}); }
          },
          blob: () => Promise.resolve(xhr.response),
          base64: () => blobToBase64(xhr.response),
        });
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));

    // Convert body
    let fetchBody: any = body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      if (!Array.isArray(body) && body.constructor === Object) {
        fetchBody = JSON.stringify(body);
      }
    }
    xhr.send(fetchBody);
  });

  xhr.onprogress = (e) => {
    if (e.lengthComputable) {
      progressCallbacks.forEach((cb) => cb(e.loaded, e.total));
    }
  };

  const wrapper = {
    progress: (cb: ProgressCallback) => {
      progressCallbacks.push(cb);
      return wrapper;
    },
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };

  return wrapper;
}

// Direct fetch (for non-download use)
export const fetch = (
  method: string,
  url: string,
  headers: Record<string, string>,
  body: any
): Promise<any> => {
  return blobFetch(method, url, headers, body);
};

const blobFetch = async (
  method: string,
  url: string,
  headers: Record<string, string>,
  body: any
): Promise<any> => {
  try {
    let fetchBody: any = body;
    
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      if (!Array.isArray(body) && body.constructor === Object) {
        fetchBody = JSON.stringify(body);
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
    }
    
    const response = await _fetch(url, {
      method,
      headers,
      body: fetchBody,
    });
    
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value: string, key: string) => {
      responseHeaders[key] = value;
    });
    
    const result: any = {
      respInfo: {
        status: response.status,
        headers: responseHeaders,
      },
      text: async () => response.text(),
      json: async () => { try { return await response.json(); } catch { return {}; } },
      blob: async () => response.blob(),
      base64: async () => {
        const blob = await response.blob();
        return blobToBase64(blob);
      },
    };
    
    return result;
  } catch (error: any) {
    throw error;
  }
};

// Helper: Convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// File system operations (simplified for web)
export const dirs = {
  DocumentDir: '/documents',
  CacheDir: '/cache',
  MainBundle: '/',
  DownloadDir: '/downloads',
};

export const fs = {
  dirs,
  exists: async (_path: string): Promise<boolean> => {
    console.warn('BlobUtil.fs.exists not fully supported on web');
    return false;
  },
  mkdir: async (_path: string): Promise<void> => {
    console.warn('BlobUtil.fs.mkdir not supported on web');
  },
  unlink: async (_path: string): Promise<void> => {
    console.warn('BlobUtil.fs.unlink not supported on web');
  },
  cp: async (_from: string, _to: string): Promise<void> => {
    console.warn('BlobUtil.fs.cp not supported on web');
  },
  mv: async (_from: string, _to: string): Promise<void> => {
    console.warn('BlobUtil.fs.mv not supported on web');
  },
  ls: async (_path: string): Promise<string[]> => {
    console.warn('BlobUtil.fs.ls not supported on web');
    return [];
  },
};

export const exists = async (_path: string): Promise<boolean> => {
  // On web, we don't have direct file system access
  // This is a placeholder that always returns false
  console.warn('BlobUtil.exists not fully supported on web');
  return false;
};

export const mkdir = async (_path: string): Promise<void> => {
  console.warn('BlobUtil.mkdir not supported on web');
};

export const unlink = async (_path: string): Promise<void> => {
  console.warn('BlobUtil.unlink not supported on web');
};

export const cp = async (_from: string, _to: string): Promise<void> => {
  console.warn('BlobUtil.cp not supported on web');
};

export const mv = async (_from: string, _to: string): Promise<void> => {
  console.warn('BlobUtil.mv not supported on web');
};

export const ls = async (_path: string): Promise<string[]> => {
  console.warn('BlobUtil.ls not supported on web');
  return [];
};

// Upload with progress
export const uploadProgress = (
  _taskId: string,
  _interval: number,
  _callback: (sent: number, total: number) => void
): void => {
  console.warn('Upload progress tracking not fully supported on web yet');
};

// Media operations
export const media = {
  copyToStorage: async (_tag: string, _path: string): Promise<string> => {
    console.warn('Media.copyToStorage not supported on web');
    return '';
  },
  getMimeType: async (_path: string): Promise<string> => {
    return 'application/octet-stream';
  },
  getExtension: async (_mimeType: string): Promise<string> => {
    return '.file';
  },
  createMedia: async (_mimeType: string, _path: string, _filename: string): Promise<string> => {
    console.warn('Media.createMedia not supported on web');
    return '';
  },
  saveToGallery: async (_source: string, _filename: string): Promise<string> => {
    console.warn('Media.saveToGallery not supported on web');
    return '';
  },
  getAlbums: async (): Promise<string[]> => {
    console.warn('Media.getAlbums not supported on web');
    return [];
  },
};

// Android specific
export const android = {
  addCompleteDownload: async (_config: any): Promise<string> => {
    console.warn('Android.addCompleteDownload not supported on web');
    return '';
  },
  usingSpecificVersionApi: (_version: number): boolean => {
    return false;
  },
};

// Default export
export default {
  config,
  fetch,
  fs,
  exists,
  mkdir,
  unlink,
  cp,
  mv,
  ls,
  dirs,
  uploadProgress,
  media,
  android,
};
