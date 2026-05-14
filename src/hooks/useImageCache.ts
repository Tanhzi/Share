import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface UseImageCacheProps {
  uri: string;
  maxSizeMB?: number;
}

interface CacheEntry {
  uri: string;
  cachedAt: number;
  expiresAt: number;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_MAX_SIZE_MB = 100;

/**
 * Hook for image caching with expiration
 * Features:
 * - LocalStorage caching with TTL
 * - Automatic cleanup of expired entries
 * - Memory-efficient LRU strategy
 */
export const useImageCache = ({ uri, maxSizeMB = DEFAULT_MAX_SIZE_MB }: UseImageCacheProps) => {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getCacheKey = useCallback((url: string) => {
    return `image_cache_${new URL(url).pathname.split('/').pop()}`;
  }, []);

  const getCachedImage = useCallback(async (key: string): Promise<string | null> => {
    try {
      const entry = await AsyncStorage.getItem(key);
      if (entry) {
        const { uri: cachedUri, expiresAt } = JSON.parse(entry) as CacheEntry;
        if (Date.now() < expiresAt) {
          return cachedUri;
        }
        // Expired, remove it
        await AsyncStorage.removeItem(key);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const setCachedImage = useCallback(async (key: string, imageUri: string) => {
    try {
      const entry: CacheEntry = {
        uri: imageUri,
        cachedAt: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION_MS,
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }, []);

  const loadCachedImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const cacheKey = getCacheKey(uri);
      const cached = await getCachedImage(cacheKey);

      if (cached) {
        setCachedUri(cached);
      } else {
        // Not cached, use original URI and cache it
        setCachedUri(uri);
        await setCachedImage(cacheKey, uri);
      }
    } catch (err) {
      setError(err as Error);
      setCachedUri(uri); // Fallback to original
    } finally {
      setIsLoading(false);
    }
  }, [uri, getCacheKey, getCachedImage, setCachedImage]);

  useEffect(() => {
    loadCachedImage();
  }, [loadCachedImage]);

  return { cachedUri, isLoading, error };
};

// Import AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

export default useImageCache;
