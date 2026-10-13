// Web implementation for AsyncStorage using localStorage
// Compatible with @react-native-async-storage/async-storage API

const STORAGE_PREFIX = 'sharedocu_';

export const AsyncStorage = {
  // Get value by key
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = localStorage.getItem(STORAGE_PREFIX + key);
      return value || null;
    } catch (error) {
      console.error('AsyncStorage.getItem error:', error);
      return null;
    }
  },

  // Set value by key
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, value);
    } catch (error) {
      console.error('AsyncStorage.setItem error:', error);
      throw error;
    }
  },

  // Remove item by key
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.error('AsyncStorage.removeItem error:', error);
      throw error;
    }
  },

  // Merge value with existing value
  mergeItem: async (key: string, value: string): Promise<void> => {
    try {
      const existing = await AsyncStorage.getItem(key);
      if (existing) {
        const merged = JSON.stringify({
          ...JSON.parse(existing),
          ...JSON.parse(value),
        });
        await AsyncStorage.setItem(key, merged);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('AsyncStorage.mergeItem error:', error);
      throw error;
    }
  },

  // Get all keys
  getAllKeys: async (): Promise<string[]> => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keys.push(key.replace(STORAGE_PREFIX, ''));
        }
      }
      return keys;
    } catch (error) {
      console.error('AsyncStorage.getAllKeys error:', error);
      return [];
    }
  },

  // Get multiple items by keys
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      const items: [string, string | null][] = [];
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        items.push([key, value]);
      }
      return items;
    } catch (error) {
      console.error('AsyncStorage.multiGet error:', error);
      return [];
    }
  },

  // Set multiple items
  multiSet: async (keyValuePairs: [string, string][]): Promise<void> => {
    try {
      for (const [key, value] of keyValuePairs) {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('AsyncStorage.multiSet error:', error);
      throw error;
    }
  },

  // Remove multiple items
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      for (const key of keys) {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('AsyncStorage.multiRemove error:', error);
      throw error;
    }
  },

  // Clear all items
  clear: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      for (const key of keys) {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('AsyncStorage.clear error:', error);
      throw error;
    }
  },

  // Use storage listener (web doesn't support this well)
  addListener: (_eventType: string, _callback: Function): void => {
    console.warn('AsyncStorage.addListener not fully supported on web');
  },

  removeListener: (_eventType: string, _callback: Function): void => {
    console.warn('AsyncStorage.removeListener not supported on web');
  },
};

// Default export
export default AsyncStorage;
