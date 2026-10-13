const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isDev = process.argv.includes('--mode') && process.argv[process.argv.indexOf('--mode') + 1] === 'development';

module.exports = {
  entry: path.resolve(__dirname, './index.web.js'),
  
output: {
path: path.resolve(__dirname, 'dist'),
filename: isDev ? 'bundle.js' : 'bundle.[contenthash].js',
publicPath: '/',
clean: true,
},

module: {
rules: [
{
test: /\.(js|jsx|ts|tsx)$/,
exclude: /node_modules\/(?!react-native-vector-icons)/,
use: {
loader: 'babel-loader',
options: {
presets: ['@babel/preset-env', 'module:@react-native/babel-preset'],
plugins: [
['module:react-native-dotenv', {
envName: 'APP_ENV',
moduleName: '@env',
path: '.env.web',
safe: false,
allowUndefined: true,
}],
],
},
},
},
{
test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
type: 'asset/resource',
},
{
test: /\.css$/,
use: ['style-loader', 'css-loader'],
},
],
},

  resolve: {
  alias: {
    'react-native$': 'react-native-web',
    'react-native-vector-icons$': path.resolve(__dirname, 'src/utils/Icon.web.tsx'),
    'react-native-vector-icons/MaterialIcons': path.resolve(__dirname, 'src/utils/react-native-vector-icons.web.tsx'),
    '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/utils/AsyncStorage.web.ts'),
    'react-native-encrypted-storage': path.resolve(__dirname, 'src/utils/EncryptedStorage.web.ts'),
    'react-native-image-picker': path.resolve(__dirname, 'src/utils/imagePicker.web.ts'),
    '@react-native-documents/picker': path.resolve(__dirname, 'src/utils/documentPicker.web.ts'),
    'react-native-blob-util': path.resolve(__dirname, 'src/utils/blobUtil.web.ts'),
    // Mock React Navigation elements and hooks
    '@react-navigation/native': path.resolve(__dirname, 'src/utils/__mocks__/@react-navigation/native.ts'),
    '@react-navigation/elements': path.resolve(__dirname, 'src/utils/__mocks__/@react-navigation/elements.tsx'),
    '@react-navigation/native/lib/useBackButton': path.resolve(__dirname, 'src/utils/NavigationMocks.web.ts'),
    '@react-navigation/native/lib/useDocumentTitle': path.resolve(__dirname, 'src/utils/NavigationMocks.web.ts'),
    '@react-navigation/native/lib/useLinking': path.resolve(__dirname, 'src/utils/NavigationMocks.web.ts'),
    '@react-navigation/native/lib/useBackButton.js': path.resolve(__dirname, 'src/utils/NavigationMocks.web.ts'),
    '@react-navigation/native/lib/useDocumentTitle.js': path.resolve(__dirname, 'src/utils/NavigationMocks.web.ts'),
    '@react-navigation/native/lib/useLinking.js': path.resolve(__dirname, 'src/utils/NavigationMocks.web.ts'),
    '@react-navigation/stack/lib/module/views/Stack/Card': path.resolve(__dirname, 'src/utils/NavigationMocks.web.ts'),
    '@react-navigation/stack/lib/module/views/Stack/StackView': path.resolve(__dirname, 'src/utils/NavigationMocks.web.ts'),
    '@react-navigation/stack/lib/module/views/Stack/Card.js': path.resolve(__dirname, 'src/utils/NavigationMocks.web.ts'),
    '@react-navigation/stack/lib/module/views/Stack/StackView.js': path.resolve(__dirname, 'src/utils/NavigationMocks.web.ts'),
    '@react-navigation/stack/lib/module/views/Stack/GestureHandler': path.resolve(__dirname, 'src/utils/GestureHandler.web.tsx'),
    '@react-navigation/stack/lib/module/views/Stack/GestureHandler.js': path.resolve(__dirname, 'src/utils/GestureHandler.web.tsx'),
    '@env': path.resolve(__dirname, '.env.web'),
  },
    extensions: [
      '.web.js',
      '.web.ts',
      '.web.tsx',
      '.js',
      '.ts',
      '.tsx',
      '.json',
    ],
    fallback: {
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      querystring: false,
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './web/index.html',
      inject: 'body',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: '', noErrorOnMissing: true },
      ],
    }),
  ],

  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
    port: 3000,
    hot: true,
    open: true,
  },

  devtool: isDev ? 'cheap-module-source-map' : 'source-map',
};
