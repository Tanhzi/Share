module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['dist/', 'coverage/', 'web-build/', 'node_modules/'],
  overrides: [
    {
      files: ['jest.setup.js', '**/__tests__/**', '**/*.test.{ts,tsx}'],
      env: { jest: true },
    },
  ],
};
