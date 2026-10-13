// Web mocks for @react-navigation hooks that don't exist on web

import { useCallback } from 'react';

// Mock for useBackButton
export const useBackButton = (_handler: () => void) => {
  // On web, we'll use browser's back button
  return null;
};

// Mock for useDocumentTitle  
export const useDocumentTitle = (title?: string) => {
  if (typeof title !== 'undefined') {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  }
};

// Mock for useLinking (simplified for web)
export const useLinking = (_ref: any, _config: any) => {
  return {
    link: useCallback((_state: any) => {
      // Simplified linking for web
      return '#';
    }, []),
    getInitialState: () => ({
      routes: [],
    }),
  };
};

// Mock for useScrollToTop
export const useScrollToTop = (ref: any, offset: number = 0) => {
  return useCallback(() => {
    if (ref.current && typeof ref.current.scrollTo === 'function') {
      ref.current.scrollTo({ x: 0, y: offset, animated: true });
    }
  }, [ref, offset]);
};

export default {
  useBackButton,
  useDocumentTitle,
  useLinking,
  useScrollToTop,
};
