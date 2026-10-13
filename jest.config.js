module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx,js,jsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.+|@testing-library|@supabase|@hugeicons)',
  ],
};
