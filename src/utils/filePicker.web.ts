// Web implementation for file picker using HTML5 File API

export interface FilePickerOptions {
  allowMultiSelection?: boolean;
  type?: string[];
  capture?: boolean;
}

export const pickDocument = async (options?: FilePickerOptions): Promise<File[] | null> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (options?.type?.length) {
      input.accept = options.type.join(',');
    }
    
    if (options?.allowMultiSelection) {
      input.multiple = true;
    }

    if (options?.capture) {
      input.setAttribute('capture', '');
    }

    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        resolve(Array.from(files));
      } else {
        resolve(null);
      }
    };

    // Người dùng huỷ chọn file -> resolve(null), không treo Promise (T12)
    input.oncancel = () => resolve(null);

    input.onerror = reject;
    input.click();
  });
};

export const pickImage = async (options?: FilePickerOptions): Promise<File[] | null> => {
  return pickDocument({
    ...options,
    type: ['image/*'],
  });
};

export const pickVideo = async (options?: FilePickerOptions): Promise<File[] | null> => {
  return pickDocument({
    ...options,
    type: ['video/*'],
  });
};

export const pickMedia = async (options?: FilePickerOptions & { mediaType?: 'photo' | 'video' }): Promise<File[] | null> => {
  const type = options?.mediaType === 'video' ? ['video/*'] : ['image/*'];
  return pickDocument({
    ...options,
    type,
  });
};

// Helper to convert File to blob/base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

// Helper to get file info
export const getFileInfo = (file: File) => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
};
