# Kế hoạch thực hiện: Giai đoạn 1 - Bảo mật khẩn cấp

**Thời gian dự kiến:** 2.5 giờ  
**Mức độ ưu tiên:** 🔴 Critical  
**Ngày tạo:** 2026-04-17

---

## Mục tiêu tổng thể

1. ✅ Thay thế AsyncStorage bằng EncryptedStorage để lưu token an toàn
2. ✅ Tách biến môi trường ra file `.env` với template `.env.example`
3. ✅ Đảm bảo `.env` không bị commit vào git
4. ✅ Cập nhật AuthContext sử dụng EncryptedStorage
5. ✅ Test luồng login/logout/updateUser

---

## Phân tích hiện trạng

### File hiện có:

- ✅ `package.json` đã cài `react-native-encrypted-storage@^4.0.3` và `react-native-dotenv@^3.4.11`
- ✅ `.env` tồn tại với nội dung: `API_URL=http://10.0.2.2:5000/api`
- ⚠️ `.gitignore` chưa ignore file `.env`
- ⚠️ `src/config/env.ts` đã sử dụng `process.env.API_URL` nhưng chưa có fallback đúng
- ⚠️ `AuthContext.tsx` đang dùng AsyncStorage cho tất cả data

### File cần tạo:

- ❌ `.env.example` (template an toàn)
- ❌ `src/utils/secureStorage.ts` (wrapper cho EncryptedStorage)

### File cần sửa:

- ❌ `.gitignore` (thêm `.env`)
- ❌ `src/context/AuthContext.tsx` (thay AsyncStorage → EncryptedStorage)

---

## Các nhiệm vụ chi tiết

### Nhiệm vụ 1.1: Cấu hình Environment Variables

**Thời gian:** 15 phút  
**Đầu vào:** `.env` (đã có), `.gitignore` (đã có)  
**Đầu ra:** `.env.example`, `.gitignore` (updated)

**Các bước:**

1. Tạo `.env.example` với nội dung template an toàn (không chứa secret thực)
2. Thêm `.env` vào `.gitignore` (hiện tại chưa có)
3. Kiểm tra `src/config/env.ts` đảm bảo fallback đúng

**File liên quan:**

- `.env` (existing)
- `.env.example` (create)
- `.gitignore` (edit)
- `src/config/env.ts` (review only)

---

### Nhiệm vụ 1.2: Tạo SecureStorage Utility

**Thời gian:** 30 phút  
**Đầu vào:** `react-native-encrypted-storage` (đã cài)  
**Đầu ra:** `src/utils/secureStorage.ts`

**Các bước:**

1. Tạo folder `src/utils/` nếu chưa có
2. Tạo file `src/utils/secureStorage.ts` với các hàm:
   - `saveToSecureStorage(key, data)`
   - `getFromSecureStorage(key)`
   - `removeFromSecureStorage(key)`
   - `clearSecureStorage()`
3. Export các hàm dưới dạng named exports

**API EncryptedStorage:**

```typescript
import EncryptedStorage from 'react-native-encrypted-storage';

// Lưu
await EncryptedStorage.setItem('key', 'value');

// Lấy
const value = await EncryptedStorage.getItem('key');

// Xóa
await EncryptedStorage.removeItem('key');
```

**File liên quan:**

- `src/utils/secureStorage.ts` (create)

---

### Nhiệm vụ 1.3: Refactor AuthContext

**Thời gian:** 45 phút  
**Đầu vào:** `AuthContext.tsx` (dùng AsyncStorage)  
**Đầu ra:** `AuthContext.tsx` (dùng EncryptedStorage)

**Các bước:**

1. Import `secureStorage` utility thay vì `AsyncStorage`
2. Cập nhật `loadStorageData()` sử dụng `getFromSecureStorage`
3. Cập nhật `login()` sử dụng `saveToSecureStorage`
4. Cập nhật `logout()` sử dụng `removeFromSecureStorage`
5. Cập nhật `updateUser()` sử dụng `saveToSecureStorage`
6. Test manual luồng login → logout → login

**Lưu ý:**

- Giữ nguyên logic token expiry
- Giữ nguyên User interface
- Đảm bảo backward compatibility (nếu có user cũ)

**File liên quan:**

- `src/context/AuthContext.tsx` (edit)
- `src/utils/secureStorage.ts` (dependency)

---

### Nhiệm vụ 1.4: Testing & Verification

**Thời gian:** 30 phút  
**Đầu vào:** AuthContext đã refactor  
**Đầu ra:** Xác nhận hoạt động đúng

**Test cases:**

1. ✅ Login thành công → token lưu vào EncryptedStorage
2. ✅ Reload app → vẫn giữ session
3. ✅ Logout → xóa token khỏi EncryptedStorage
4. ✅ Token expiry → tự động logout
5. ✅ API_URL lấy từ environment (kiểm tra trong log)

**Test commands:**

```bash
# Chạy app trên Android
npm run android

# Theo dõi log
npx react-native log-android
```

---

## Trình tự thực hiện

```
┌─────────────────────────────────────────────────────────────┐
│  Bước 1: Cấu hình Environment Variables (15 phút)           │
│  ├─ Tạo .env.example                                        │
│  ├─ Cập nhật .gitignore                                     │
│  └─ Verify env.ts                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Bước 2: Tạo SecureStorage Utility (30 phút)                │
│  ├─ Tạo src/utils/secureStorage.ts                          │
│  ├─ Implement wrapper functions                             │
│  └─ Export clean API                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Bước 3: Refactor AuthContext (45 phút)                     │
│  ├─ Replace AsyncStorage → EncryptedStorage                 │
│  ├─ Update login/logout/updateUser                          │
│  └─ Maintain existing interfaces                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Bước 4: Testing & Verification (30 phút)                   │
│  ├─ Test login flow                                         │
│  ├─ Test persistence                                        │
│  ├─ Test logout                                             │
│  └─ Test token expiry                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Danh sách file

### File cần tạo:

| File                         | Mục đích                             |
| ---------------------------- | ------------------------------------ |
| `.env.example`               | Template an toàn cho biến môi trường |
| `src/utils/secureStorage.ts` | EncryptedStorage wrapper             |

### File cần sửa:

| File                          | Thay đổi                                |
| ----------------------------- | --------------------------------------- |
| `.gitignore`                  | Thêm `.env`                             |
| `src/context/AuthContext.tsx` | Replace AsyncStorage → EncryptedStorage |

### File chỉ đọc (review):

| File                | Lý do                    |
| ------------------- | ------------------------ |
| `package.json`      | Verify dependencies      |
| `src/config/env.ts` | Verify env configuration |
| `.env`              | Check existing values    |

---

## Mốc kiểm tra (Milestones)

### ✅ Milestone 1: Environment Setup (15 phút)

- [ ] `.env.example` được tạo với nội dung đúng
- [ ] `.gitignore` chứa `.env`
- [ ] `src/config/env.ts` được verify

### ✅ Milestone 2: SecureStorage Utility (45 phút)

- [ ] `src/utils/secureStorage.ts` được tạo
- [ ] Đủ 4 hàm: save, get, remove, clear
- [ ] TypeScript types đầy đủ

### ✅ Milestone 3: AuthContext Migration (90 phút)

- [ ] Import EncryptedStorage thay AsyncStorage
- [ ] Login flow hoạt động
- [ ] Logout flow hoạt động
- [ ] Persistence qua reload

### ✅ Milestone 4: Testing Complete (120 phút)

- [ ] Test case 1: Login → token saved
- [ ] Test case 2: Reload → session kept
- [ ] Test case 3: Logout → token removed
- [ ] Test case 4: Token expiry works

---

## Tiêu chí hoàn thành (Success Criteria)

- ✅ `.env` được ignore trong git
- ✅ `.env.example` tồn tại làm template
- ✅ Token được lưu trong EncryptedStorage (không phải AsyncStorage)
- ✅ AuthContext hoạt động đúng sau refactor
- ✅ Không có regression trong login/logout flow
- ✅ Code chạy được trên Android emulator

---

## Rủi ro & Giảm thiểu

| Rủi ro                                            | Tác động | Giảm thiểu                                       |
| ------------------------------------------------- | -------- | ------------------------------------------------ |
| EncryptedStorage không hoạt động trên emulator cũ | Medium   | Test trên physical device nếu cần                |
| Migration làm mất session user                    | High     | Test kỹ với user cũ trước khi deploy             |
| `.env` bị commit nhầm                             | Medium   | Review kỹ trước khi commit, dùng pre-commit hook |

---

## Ghi chú kỹ thuật

### EncryptedStorage vs AsyncStorage

- **EncryptedStorage**: iOS Keychain + Android Keystore (an toàn)
- **AsyncStorage**: Unencrypted (không an toàn)
- **API tương tự**: `setItem`, `getItem`, `removeItem`

### Environment Variables

- `react-native-dotenv` đã được cài sẵn
- Chỉ cần đảm bảo `.env` không bị commit
- Dùng `.env.example` làm template cho team

### Backward Compatibility

- User cũ có token trong AsyncStorage → cần migration strategy
- Có thể implement migration trong future iteration
- Ưu tiên hiện tại: EncryptedStorage cho user mới

---

## Resources

### Tài liệu tham khảo:

- [react-native-encrypted-storage docs](https://github.com/emeraldsanto/react-native-encrypted-storage)
- [react-native-dotenv docs](https://github.com/goatandsheep/react-native-dotenv)

### Code locations:

- AuthContext: `src/context/AuthContext.tsx`
- Env config: `src/config/env.ts`
- Package deps: `package.json`

---

_Kế hoạch này sẵn sàng để implement. Tất cả dependencies đã được cài đặt sẵn trong project._
