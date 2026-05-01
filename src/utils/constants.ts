// src/utils/constants.ts
export const APP_CONSTANTS = {
  // App colors
  COLORS: {
    PRIMARY: '#2563EB',
    PRIMARY_DARK: '#1e40af',
    SUCCESS: '#10b981',
    BG: '#f8fafc',
    WHITE: '#fff',
    TEXT: '#0f172a',
    SUB_TEXT: '#64748b',
    BORDER: '#e2e8f0',
    DANGER: '#ef4444',
    CARD_BG: '#ffffff',
  },
  
  // App dimensions
  DIMENSIONS: {
    BORDER_RADIUS: 24,
    PADDING: 24,
    MARGIN: 16,
    ICON_SIZE: 24,
  },
  
  // App timing
  TIMING: {
    ANIMATION_DURATION: 2500,
    TRANSITION_DURATION: 300,
  },
  
  // File types
  FILE_TYPES: {
    IMAGE: 'image',
    VIDEO: 'video',
    FILE: 'file',
    LINK: 'link',
    TEXT: 'text',
  },
  
  // Document types
  DOCUMENT_TYPES: {
    PHOTO: 'Photo',
    VIDEO: 'Video',
    FILE: 'File',
    LINK: 'Link',
    TEXT: 'Text',
  },
  
  // Expiration options
  EXPIRATION_OPTIONS: ['1 hour', '6 hours', '1 day', '3 days', '7 days'],
  
  // Categories
  CATEGORIES: ['Photos', 'Videos', 'Files', 'Links', 'Text'],
  
  // Filter types
  FILTER_TYPES: ['All', 'PDF', 'Images', 'Videos', 'Archives', 'Docs'],
  
  // Sync settings
  SYNC_SETTINGS: {
    AUTO_DOWNLOAD: 'autoDownload',
    AUTO_VIEW: 'autoView',
  },
  
  // Network status
  NETWORK: {
    ONLINE: 'online',
    OFFLINE: 'offline',
    CHECKING: 'checking',
  },
  
  // Error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    INVALID_RESPONSE: 'Invalid response format',
    SCAN_ERROR: 'Could not scan documents',
    DOWNLOAD_ERROR: 'Download failed',
    UPLOAD_ERROR: 'Upload failed',
    AUTH_ERROR: 'Authentication failed',
    PERMISSION_ERROR: 'Permission denied',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    UPLOAD_SUCCESS: 'Sharing started successfully!',
    DELETE_SUCCESS: 'File has been removed.',
    PASSWORD_UPDATE_SUCCESS: 'Password protection updated successfully.',
    INVITATION_SENT: 'Invitation sent.',
  },
};