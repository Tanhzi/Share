// Web mock for @react-native-documents/picker
// Uses HTML5 file input API

export interface DocumentPickerResponse {
  name: string;
  uri: string;
  size: number;
  type?: string;
}

export interface DocumentPickerOptions {
  allowMultiSelection?: boolean;
  type?: string[];
  copyTo?: string;
}

const getTypeFromMime = (mimeType: string): string => {
  if (!mimeType) return 'application/octet-stream';
  
  if (mimeType.includes('pdf')) return 'application/pdf';
  if (mimeType.includes('word')) return 'application/msword';
  if (mimeType.includes('excel')) return 'application/vnd.ms-excel';
  if (mimeType.includes('powerpoint')) return 'application/vnd.ms-powerpoint';
  if (mimeType.includes('text')) return 'text/plain';
  if (mimeType.includes('zip')) return 'application/zip';
  if (mimeType.includes('image')) return mimeType;
  if (mimeType.includes('video')) return mimeType;
  
  return 'application/octet-stream';
};

export const pick = async (options?: DocumentPickerOptions): Promise<DocumentPickerResponse[]> => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = options?.allowMultiSelection || false;
  
  // Set file type filter
  if (options?.type?.length) {
    // Convert picker types to HTML accept attribute
    const acceptTypes = options.type.map(t => {
      if (t.includes('/')) return t; // Already a MIME type
      if (t === 'png') return 'image/png';
      if (t === 'jpg') return 'image/jpeg';
      if (t === 'jpeg') return 'image/jpeg';
      if (t === 'pdf') return 'application/pdf';
      if (t === 'mp4') return 'video/mp4';
      return t;
    });
    input.accept = acceptTypes.join(',');
  }
  
  return new Promise((resolve, reject) => {
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      
      if (files && files.length > 0) {
        const results: DocumentPickerResponse[] = Array.from(files).map(file => ({
          name: file.name,
          uri: URL.createObjectURL(file),
          size: file.size,
          type: file.type || getTypeFromMime(file.type) || 'application/octet-stream',
        }));
        
        resolve(results);
      } else {
        // User canceled
        const error = new Error('User canceled document picker');
        error.name = 'DocumentPickerError';
        reject(error);
      }
    };
    
    input.onerror = () => {
      reject(new Error('File picker error'));
    };

    // Người dùng huỷ chọn -> reject cùng thông điệp như onchange rỗng, không treo Promise (T12)
    input.oncancel = () => {
      const error = new Error('User canceled document picker');
      error.name = 'DocumentPickerError';
      reject(error);
    };

    input.click();
  });
};

export const pickMultiple = async (options?: DocumentPickerOptions): Promise<DocumentPickerResponse[]> => {
  return pick({ ...options, allowMultiSelection: true });
};

// Constants for type safety
export const types = {
  allFiles: '*/*',
  images: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  pdf: 'application/pdf',
  word: 'application/msword',
  excel: 'application/vnd.ms-excel',
  powerpoint: 'application/vnd.ms-powerpoint',
  text: 'text/plain',
  zip: 'application/zip',
};
