/**
 * Test setup for React Native
 */

// Mock react-native-encrypted-storage
jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

// Mock react-native-geolocation-service
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
  requestAuthorization: jest.fn(),
}));

// Mock react-native-blob-util
jest.mock('react-native-blob-util', () => ({
  config: jest.fn().mockReturnThis(),
  fetch: jest.fn(),
  fs: {
    dirs: {
      DocumentDir: '/mock/documents',
      DownloadDir: '/mock/downloads',
    },
  },
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// Mock @react-native-documents/picker (TurboModule — cần mock để render App trong test)
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(() => Promise.resolve([])),
  types: {},
  errorCodes: { CANCELED: 'canceled' },
  isErrorWithCode: jest.fn(() => false),
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(() => Promise.resolve({ didCancel: true })),
  launchImageLibrary: jest.fn(() => Promise.resolve({ didCancel: true })),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
}));

// Mock console.error to reduce noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalError.call(console.error, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
