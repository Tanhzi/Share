import EncryptedStorage from 'react-native-encrypted-storage';

export const saveToSecureStorage = async (
  key: string,
  data: string
): Promise<void> => {
  try {
    await EncryptedStorage.setItem(key, data);
  } catch (error) {
    console.error('Failed to save to secure storage:', error);
    throw error;
  }
};

export const getFromSecureStorage = async (
  key: string
): Promise<string | null> => {
  try {
    const data = await EncryptedStorage.getItem(key);
    return data;
  } catch (error) {
    console.error('Failed to get from secure storage:', error);
    return null;
  }
};

export const removeFromSecureStorage = async (key: string): Promise<void> => {
  try {
    await EncryptedStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from secure storage:', error);
    throw error;
  }
};

export const clearSecureStorage = async (): Promise<void> => {
  try {
    await EncryptedStorage.clear();
  } catch (error) {
    console.error('Failed to clear secure storage:', error);
    throw error;
  }
};
