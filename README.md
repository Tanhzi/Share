# sharedocu

Ứng dụng React Native chia sẻ tài liệu theo vị trí gần nhau.

## 📋 Mô tả dự án

`sharedocu` cho phép người dùng:
- Quét và khám phá tài liệu trong phạm vi gần (Scanner)
- Chia sẻ ảnh, video, file, link hoặc text từ thiết bị
- Thiết lập quyền truy cập: công khai / ẩn danh / có mật khẩu / giới hạn thời gian
- Quản lý tài liệu đã chia sẻ, đồng bộ với tài khoản khác, cập nhật hồ sơ cá nhân (khi đăng nhập)

## 🚀 Cài đặt & Chạy dự án

### Yêu cầu
- Node.js >= 20
- Môi trường React Native cho Android/iOS

### Cài đặt
```bash
npm install
```

### Chạy ứng dụng
```bash
# Khởi động Metro bundler
npm start

# Chạy trên Android
npm run android

# Chạy trên iOS
npm run ios

# Chạy test
npm test

# Kiểm tra lint
npm run lint
```

> **Lưu ý Android**: Nếu gặp lỗi SDK, thử thiết lập biến môi trường:
> ```powershell
> $env:ANDROID_HOME = "C:\Users\kaido\AppData\Local\Android\Sdk"
> npm run android
> ```

## 📁 Cấu trúc thư mục

```
src/
  components/    # UI components tái sử dụng
  context/       # Auth context và shared state 
  navigation/     # Cấu hình điều hướng (stack/tab)
  screens/       # Các màn hình chính
android/          # Native Android project
ios/            # Native iOS project
__tests__/      # Test files
patches/         # Patch-package fixes
```

## 🧭 Điều hướng & Luồng ứng dụng

- Entry point: `index.js` → `App.tsx`
- Root providers: `AuthProvider` + `SafeAreaProvider`
- Navigation: `AppNavigator.tsx` → `TabNavigator.tsx`
- Màn hình mặc định: `Scanner` (trong Bottom Tabs)
- Auth flow: mở khi người dùng chủ động đăng nhập/đăng ký

## 🖥️ Các màn hình chính

### Scanner (`src/screens/ScannerScreen.tsx`)
- Xin quyền vị trí, gọi API quét tài liệu gần
- Hỗ trợ guest và user đã đăng nhập
- Hiển thị danh sách tài liệu, mở link hoặc tải file
- Modal xác thực mật khẩu nếu tài liệu được bảo vệ
- Kiểm tra trạng thái mạng trước khi quét

### Share Form (`src/screens/ShareForm.tsx`)
- Chia sẻ: ảnh, video, file, link, text
- Tùy chọn: public / ẩn danh / mật khẩu / thời hạn
- Bắt buộc lấy vị trí trước khi upload

### My Shares (`src/screens/MySharesScreen.tsx`)
- Chỉ khả dụng khi đã đăng nhập
- Xem, tìm kiếm, lọc tài liệu đang chia sẻ
- Bật/tắt mật khẩu, xóa tài liệu khỏi danh sách
- Kiểm tra trạng thái mạng trước khi thực hiện các thao tác

### Sync Center (`src/screens/SyncScreen.tsx`)
- Kết nối tài khoản khác qua email
- Xử lý sync request (incoming/outgoing)
- Xem trạng thái partner, preview tài liệu
- Cài đặt auto download và instant preview

### Profile (`src/screens/ProfileScreen.tsx`)
- Xem/cập nhật thông tin cá nhân
- Upload avatar, đổi mật khẩu, đăng xuất

### Auth (`src/screens/*.tsx`)
- Đăng nhập, đăng ký, quên mật khẩu, đổi mật khẩu
- Lưu token và userInfo qua `@react-native-async-storage/async-storage`

## 🔌 Backend & API

Base URL hiện tại (hardcode cho Android Emulator):
```
http://10.0.2.2:5000/api
```

### Các nhóm endpoint
| Nhóm | Chức năng |
|------|-----------|
| `/api/auth/*` | login, register, forgot/reset/change password, profile, upload-avatar |
| `/api/documents/*` | scan, share, verify-password, my-documents, history, download |
| `/api/sync/*` | status, requests, link, respond, cancel, settings, unlink, documents |

> ⚠️ **Lưu ý**: `API_URL` đang hardcode, chưa tách qua file env/config.

## 🛠️ Stack kỹ thuật

| Công nghệ | Phiên bản / Package |
|-----------|---------------------|
| React Native | 0.83.1 |
| React | 19.2.0 |
| TypeScript | ✅ |
| Navigation | @react-navigation/native, native-stack, bottom-tabs |
| Storage | @react-native-async-storage/async-storage |
| Geolocation | react-native-geolocation-service |
| File Picker | @react-native-documents/picker |
| Image Picker | react-native-image-picker |
| File Utils | react-native-blob-util |
| Icons | react-native-vector-icons |
| Backend Client | @supabase/supabase-js, socket.io-client (có trong deps, hiện dùng fetch là chính) |

## ⚠️ Ghi chú kỹ thuật

- `README.md` gốc là template mặc định, chưa phản ánh nghiệp vụ thực tế
- `API_URL` hardcode → cần cấu hình env cho production
- App cho phép guest mode, auth chỉ bắt buộc với tính năng cá nhân hóa
- Mã nguồn còn nhiều debug log và một số chuỗi tiếng Việt lỗi encoding
- `SyncScreen`: một số logic tải file chưa hoàn thiện end-to-end
- Test coverage còn thấp, mới có `__tests__/App.test.tsx`

## 📚 File tham khảo khi tiếp quản

1. `src/context/AuthContext.tsx`
2. `src/navigation/AppNavigator.tsx`
3. `src/navigation/TabNavigator.tsx`
4. `src/screens/ScannerScreen.tsx`
5. `src/screens/ShareFormScreen.tsx`
6. `src/screens/MySharesScreen.tsx`
7. `src/screens/SyncScreen.tsx`

## 🧪 Scripts hữu ích (package.json)

| Lệnh | Mô tả |
|------|-------|
| `npm start` | Khởi động Metro bundler |
| `npm run android` | Build & chạy Android |
| `npm run ios` | Build & chạy iOS |
| `npm test` | Chạy Jest tests |
| `npm run lint` | Kiểm tra ESLint |
| `npm run postinstall` | Áp dụng patch-package |

## 📄 License

MIT
