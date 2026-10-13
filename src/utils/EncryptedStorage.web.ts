// Web mock for react-native-encrypted-storage
// Uses localStorage instead (not encrypted, but works for web)

const STORAGE_PREFIX = 'sharedocu_encrypted_';

export const EncryptedStorage = {
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, value);
    } catch (error) {
      console.error('EncryptedStorage.setItem error:', error);
      throw error;
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(STORAGE_PREFIX + key) || null;
    } catch (error) {
      console.error('EncryptedStorage.getItem error:', error);
      return null;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.error('EncryptedStorage.removeItem error:', error);
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      // Remove all keys with our prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('EncryptedStorage.clear error:', error);
      throw error;
    }
  },
};

export default EncryptedStorage;
