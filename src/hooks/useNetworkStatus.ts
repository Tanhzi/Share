import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState, useCallback } from 'react';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<
    boolean
  >(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const executeWithRetry = useCallback(async <T>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delayTime = BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayTime}ms`);
          await delay(delayTime);
        }
      }
    }
    
    throw lastError || new Error('Network request failed');
  }, []);

  return { 
    isConnected, 
    isInternetReachable,
    executeWithRetry 
  };
};
