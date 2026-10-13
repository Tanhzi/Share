// Babel config for web build
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: ['last 2 versions', 'not dead'],
      },
    }],
    'module:@react-native/babel-preset',
  ],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      },
    ],
    // Transform React Native imports for web
    'react-native-web',
  ].filter(Boolean),
};
