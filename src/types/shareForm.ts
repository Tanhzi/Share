// src/types/shareForm.ts

export type ShareCategory = 'Photos' | 'Videos' | 'Files' | 'Links' | 'Text';

export interface ShareFile {
  uri: string;
  type: string;
  name: string;
  size: number;
  file?: any; // For React Native file upload
}

export interface ShareFormData {
  category: ShareCategory;
  expiration: string;
  isAnonymous: boolean;
  isPasswordProtected: boolean;
  isPublicSharing: boolean;
  password: string;
  linkContent: string;
  textContent: string;
  selectedFile: ShareFile | null;
}

export interface ShareFormErrors {
  linkInput?: string;
  textInput?: string;
  file?: string;
  password?: string;
  location?: string;
}

export type ShareFormAction =
  | { type: 'SET_CATEGORY'; payload: ShareCategory }
  | { type: 'SET_LINK_INPUT'; payload: string }
  | { type: 'SET_TEXT_INPUT'; payload: string }
  | { type: 'SET_SELECTED_FILE'; payload: ShareFile | null }
  | { type: 'SET_EXPIRATION'; payload: string }
  | { type: 'SET_IS_ANONYMOUS'; payload: boolean }
  | { type: 'SET_IS_PASSWORD_PROTECTED'; payload: boolean }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_IS_PUBLIC_SHARING'; payload: boolean }
  | { type: 'RESET' };

export const initialShareFormData: ShareFormData = {
  category: 'Photos',
  expiration: '1 hour',
  isAnonymous: false,
  isPasswordProtected: false,
  isPublicSharing: false,
  password: '',
  linkContent: '',
  textContent: '',
  selectedFile: null,
};

export function shareFormReducer(
  state: ShareFormData,
  action: ShareFormAction
): ShareFormData {
  switch (action.type) {
    case 'SET_CATEGORY':
      return { ...state, category: action.payload };
    case 'SET_LINK_INPUT':
      return { ...state, linkContent: action.payload };
    case 'SET_TEXT_INPUT':
      return { ...state, textContent: action.payload };
    case 'SET_SELECTED_FILE':
      return { ...state, selectedFile: action.payload };
    case 'SET_EXPIRATION':
      return { ...state, expiration: action.payload };
    case 'SET_IS_ANONYMOUS':
      return { ...state, isAnonymous: action.payload };
    case 'SET_IS_PASSWORD_PROTECTED':
      return { ...state, isPasswordProtected: action.payload };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    case 'SET_IS_PUBLIC_SHARING':
      return { ...state, isPublicSharing: action.payload };
    case 'RESET':
      return initialShareFormData;
    default:
      return state;
  }
}
