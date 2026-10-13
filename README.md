# ShareDocu — Frontend

> Ứng dụng chia sẻ tài liệu theo vị trí địa lý — một codebase React Native chạy Android, iOS và Web

![React Native](https://img.shields.io/badge/React%20Native-0.83-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![React Native Web](https://img.shields.io/badge/React%20Native%20Web-0.21-999999)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-green)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Backend:** [Tanhzi/Beshare1](https://github.com/Tanhzi/Beshare1) — REST API + PostgreSQL/PostGIS + Supabase Storage

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Tính năng](#2-tính-năng)
3. [Công nghệ](#3-công-nghệ)
4. [Kiến trúc](#4-kiến-thúc)
5. [Cài đặt & chạy](#5-cài-đặt--chạy)
6. [Cấu trúc thư mục](#6-cấu-trúc-thư-mục)
7. [Các lệnh chính](#7-các-lệnh-chính)
8. [Các màn hình](#8-các-màn-hình)
9. [Ghi chú kỹ thuật](#9-ghi-chú-kỹ-thuật)
10. [License](#10-license)

## 1. Tổng quan

**ShareDocu** là ứng dụng di động & web cho phép người dùng chia sẻ tài liệu (Photos, Videos, Files, Links, Text) với những người khác **trong cùng khu vực địa lý**. Ứng dụng dùng **một codebase React Native** duy nhất chạy trên Android, iOS và Web (qua React Native Web + Webpack).

Ứng dụng giao tiếp với backend qua **REST API** ([Tanhzi/Beshare1](https://github.com/Tanhzi/Beshare1)), xác thực bằng **JWT token** lưu an toàn trên thiết bị.

Phiên bản web chạy trực tiếp trên trình duyệt (Chrome, Firefox, Edge, Safari) — responsive cho cả desktop và mobile.

## 2. Tính năng

- **Quét tài liệu gần đó**: Tìm tài liệu được chia sẻ trong bán kính gần vị trí hiện tại (GPS + PostGIS)
- **Chia sẻ tài liệu**: Upload file, ảnh, video, chia sẻ link & văn bản
- **Chia sẻ công khai**: Không cần đăng nhập (Guest Mode)
- **Bảo vệ mật khẩu**: Tài liệu nhạy cảm yêu cầu nhập mật khẩu trước khi tải
- **Quản lý tài liệu đã chia sẻ (My Shares)**: Xem, xoá, đổi mật khẩu
- **Kết nối tài khoản (Sync)**: Liên kết với tài khoản khác qua email, chia sẻ riêng tư (`private_share`)
- **Tự động tải về (Auto-download)**: Bật để tự động tải tài liệu mới từ partner
- **Lịch sử giao dịch (History)**: Xem lịch sử chia sẻ / nhận, lọc theo kiểu giao dịch
- **Xác thực người dùng**: Đăng ký, đăng nhập, quên mật khẩu (OTP qua email), đổi mật khẩu, hồ sơ
- **Đa nền tảng**: Android, iOS và Web (responsive) từ cùng một mã nguồn

## 3. Công nghệ

### Nền tảng

| Công nghệ | Mục đích |
|---|---|
| **React Native 0.83 + React 19** | Nền tảng ứng dụng di động |
| **React Native Web 0.21** | Chạy cùng codebase trên trình duyệt |
| **Webpack 5 + Babel** | Build web (dev server & production bundle) |
| **TypeScript** | Kiểu dữ liệu tĩnh |
| **React Navigation** | Điều hướng native (native-stack, bottom-tabs) |
| **SimpleWebNav** | Điều hướng tùy chỉnh cho web (state-based) |
| **react-native-blob-util** | Tải file về thiết bị (DownloadManager trên Android) |
| **react-native-geolocation-service** | Lấy toạ độ GPS khi chia sẻ / quét |
| **react-native-image-picker** | Chọn ảnh / chụp ảnh |
| **@react-native-documents/picker** | Chọn file từ bộ nhớ |
| **AsyncStorage / EncryptedStorage** | Lưu phiên đăng nhập & token an toàn |
| **Jest** | Unit testing framework |

### Triển khai riêng cho Web

- Các file **`*.web.tsx` / `*.web.ts`**: bản triển khai riêng cho web (blob download, image picker, location, async storage, vector icons...)
- Webpack alias chuyển `react-native` → `react-native-web`
- **Navigation**: state-based (`SimpleNavigation`) thay cho React Navigation — tránh compatibility issues trên web
- **Icons**: emoji icons (`Icon.web.tsx`) — không cần load font ngoài, tương thích mọi trình duyệt
- **Storage**: `localStorage` cho phiên làm việc
- **Browser APIs**: Geolocation, File API, Clipboard

## 4. Kiến trúc

```
┌─────────────────────────────────────┐
│  Android / iOS  (React Native)     │
│  Web  (React Native Web + Webpack) │
└──────────────────┬──────────────────┘
                   │  REST API + JWT
┌──────────────────▼──────────────────┐
│  BeShare — Backend API             │
│  Express + TypeScript              │
│  github.com/Tanhzi/Beshare1        │
└──────────────────┬──────────────────┘
                   │
        ┌──────────▼───────────┐
        │  Supabase            │
        │  PostgreSQL + PostGIS│
        │  Storage (file/ảnh)  │
        └──────────────────────┘
```

## 5. Cài đặt & chạy

### Yêu cầu hệ thống

- Node.js >= 20.x, npm >= 8.x
- Backend đang chạy tại cổng 5000 (xem [Tanhzi/Beshare1](https://github.com/Tanhzi/Beshare1))
- Android SDK (cho bản native), trình duyệt hiện đại (cho bản web)

### Bước 1: Cài dependencies

```bash
npm install --legacy-peer-deps
```

> **Ghi chú `--legacy-peer-deps`**: package `@react-navigation/web@1.0.0-alpha.9` yêu cầu `@react-navigation/core@^3` trong khi dự án dùng core v7 → npm báo xung đột peer dependency. Cờ `--legacy-peer-deps` bỏ qua kiểm tra này (an toàn — `@react-navigation/web` không được dùng trong runtime).

### Bước 2: Cấu hình biến môi trường

Copy `.env.example` thành `.env` cho mobile và `.env.web` cho web:

```env
# .env (Android native — emulator)
API_URL=http://10.0.2.2:5000/api
```

```env
# .env.web (web development)
API_URL=http://localhost:5000/api
PLATFORM=web
```

### Bước 3: Chạy ứng dụng

```bash
# Web (development) — mở http://localhost:3000
npm run web

# Android (native)
npm run android

# iOS (native)
cd ios && pod install && cd ..
npm run ios

# Build web production → dist/
npm run build:web
```

## 6. Cấu trúc thư mục

```
Share/
├── src/
│   ├── screens/            # Các màn hình chính
│   │   ├── ScannerScreen.tsx / ScannerScreen.web.tsx   # Quét tài liệu gần
│   │   ├── ShareFormScreen.tsx     # Chia sẻ tài liệu
│   │   ├── MySharesScreen.tsx      # Tài liệu đã chia sẻ
│   │   ├── HistoryScreen.tsx       # Lịch sử giao dịch
│   │   ├── ProfileScreen.tsx       # Hồ sơ & cài đặt
│   │   ├── SyncScreen.tsx          # Kết nối tài khoản
│   │   └── Login / Register / ForgotPassword / ChangePassword
│   ├── components/         # Component dùng lại
│   │   ├── DocumentCard.tsx, PasswordModal.tsx, FilterBar.tsx, GuestPlaceholder.tsx, RadarView.tsx
│   │   └── history/ myshares/ profile/ sync/ web/   # Item/View theo màn hình
│   ├── hooks/              # useFileDownload, useNetworkStatus, useShareForm(+.web), useWebDragDrop
│   ├── context/            # AuthContext, ToastContext
│   ├── api/
│   │   └── client.ts       # API client (GET/POST/PUT/DELETE + JWT + xử lý 401)
│   ├── navigation/         # AppNavigator, TabNavigator (native) + SimpleWebNav, WebNavigator (web)
│   ├── utils/              # SimpleNavigation, alert, format, logger, secureStorage + shim *.web.ts
│   │                        #   (AsyncStorage, blobUtil, clipboard, file/image/documentPicker, location, Icon…)
│   ├── config/
│   │   └── env.ts          # Cấu hình API_URL theo platform
│   └── types/              # TypeScript types
├── __tests__/              # Unit tests (Jest): App, PasswordModal, useNetworkStatus, format
├── web/
│   ├── index.html          # HTML template cho webpack
│   └── styles.css          # Global styles cho web
├── public/
│   └── favicon.svg         # Icon trình duyệt (copy vào dist/ khi build)
├── android/                # Project Android native
├── ios/                    # Project iOS native
├── patches/                # patch-package (patch react-native-document-picker)
├── webpack.config.js       # Cấu hình build web (alias react-native-web + shim)
├── jest.config.js          # Cấu hình Jest (preset react-native)
├── jest.setup.js           # Mock native modules khi test
├── vercel.json             # Cấu hình deploy SPA lên Vercel
├── index.web.js            # Entry point web
├── App.tsx                 # Entry point mobile
├── App.web.tsx             # Entry point web
└── package.json
```

## 7. Các lệnh chính

| Lệnh | Mô tả |
|---|---|
| `npm run web` | Chạy web development server (port 3000) |
| `npm run build:web` | Build web production (output: `dist/`) |
| `npm run android` | Chạy ứng dụng trên Android |
| `npm run ios` | Chạy ứng dụng trên iOS |
| `npm run start` | Chạy Metro bundler |
| `npm run test` | Chạy unit test (Jest — 4 suites / 17 tests) |
| `npm run lint` | Kiểm tra chất lượng code (ESLint) |

> **postinstall**: `patch-package` tự chạy sau `npm install` để áp dụng bản patch trong `patches/` (sửa `react-native-document-picker`).

## 8. Các màn hình

| Màn hình | Mô tả |
|---|---|
| **Scanner** | Quét & hiển thị tài liệu được chia sẻ gần vị trí |
| **Share Form** | Chia sẻ tài liệu (file, ảnh, video, link, text) |
| **My Shares** | Quản lý tài liệu đã chia sẻ (xoá, đổi mật khẩu) |
| **History** | Lịch sử chia sẻ / nhận, lọc theo loại |
| **Sync** | Kết nối tài khoản, bật auto-download / auto-view |
| **Profile** | Thông tin cá nhân, avatar, đổi mật khẩu |
| **Login / Register** | Xác thực người dùng |
| **Forgot Password** | Đặt lại mật khẩu bằng mã OTP qua email |
| **Change Password** | Đổi mật khẩu (thu hồi token cũ phía backend) |


## 9. Ghi chú kỹ thuật

1. **Tải file về máy**:
   - **Web**: `XMLHttpRequest` + `Blob URL` + thẻ `<a download>` → hộp thoại lưu file của trình duyệt.
   - **Android**: `react-native-blob-util` với `useDownloadManager: true` → thư mục **Downloads**, hiện thông báo trên status bar.
   - **iOS**: lưu vào thư mục `Documents` của ứng dụng.
2. **Auto-download**: khi bật "Tự tải về" trong màn hình Sync, tài liệu mới từ partner được tự động tải (chỉ tài liệu chưa từng xuất hiện).
3. **Chia sẻ công khai (Guest)**: không cần đăng nhập — dùng các endpoint `*-public` của backend.
4. **Vị trí địa lý**: ứng dụng cần quyền GPS để chia sẻ và quét tài liệu.
5. **Web so với Mobile**: API native (camera, file picker, blob download) có bản triển khai riêng cho web — các file hậu tố `.web.*`; webpack alias map module native → shim web (`webpack.config.js`).
6. **Cấu hình API theo platform**: `src/config/env.ts` tự chọn `API_URL` — web dùng `localhost`, Android emulator dùng `10.0.2.2`.
7. **Testing**: Jest với preset `react-native`; `jest.setup.js` mock các native module (AsyncStorage, NetInfo, blob-util, image-picker, documents picker, navigation) — 4 suites / 17 tests.
8. **Đồng bộ FE ↔ BE**: FE gọi đúng 27 endpoint của [BeShare](https://github.com/Tanhzi/Beshare1); khớp chuỗi lỗi (`Incorrect password`), khoảng cách (`distance`) và chủ sở hữu (`owner_name`) từ RPC `get_nearby_documents`.


## 10. License

MIT License — xem file [LICENSE](LICENSE).
