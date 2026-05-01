# KẾ HOẠCH DỰ ÁN SHAREDOCU - CÁC BƯỚC TIẾP THEO

## I. TỔNG QUAN

Dự án ShareDocu đã hoàn thành các cải tiến quan trọng về bảo mật và cấu trúc code. Bây giờ cần tiếp tục thực hiện các công việc còn lại để hoàn thiện sản phẩm.

## II. DANH SÁCH CÔNG VIỆC CẦN THỰC HIỆN

### 1. CÁC CÔNG VIỆC ƯU TIÊN CAO (Thực hiện ngay lập tức)

#### 1.1. Áp dụng API Client vào các màn hình
- [x] Áp dụng API client đã tạo vào ScannerScreen
- [x] Áp dụng API client đã tạo vào ShareFormScreen
- [x] Áp dụng API client đã tạo vào các màn hình còn lại

### 2. CÁC CÔNG VIỆC ƯU TIÊN TRUNG BÌNH (Thực hiện sau)

#### 2.1. Cải thiện UX và dọn dẹp code
- [x] Network status detection
- [x] Accessibility improvements
- [x] Xóa console.log thừa
- [ ] Format code với Prettier

#### 2.2. Cập nhật README.md
- [x] Cập nhật tài liệu dự án

### 3. CÁC CÔNG VIỆC ƯU TIÊN THẤP (Thực hiện cuối cùng)

#### 3.1. Input Validation với Zod/Yup
- [x] Cài đặt Zod/Yup
- [x] Schema validation cho form inputs

#### 3.2. Tách utility functions
- [x] Tạo src/utils/format.ts chứa formatBytes()
- [x] Tạo src/utils/constants.ts chứa các hằng số

## III. DANH SÁCH LỖI CẦN KHẮC PHỤC

### 1. DANH SÁCH LỖI PHÁT HIỆN

#### 1.1. Lỗi P0 (Critical)
- [ ] Lỗi trong hàm apiDelete: Trong file src/api/client.ts, hàm apiDelete đang sử dụng phương thức apiCall nhưng không truyền đúng tham số. Hàm apiPost được gọi với tham số method='DELETE' nhưng lại truyền thêm tham số data không cần thiết.

#### 1.2. Lỗi P1 (High)
- [x] Lỗi trong việc hiển thị tên file trong thông báo xóa
- [x] Lỗi trong việc gọi API DELETE request

#### 1.3. Lỗi P2 (Medium)
- [x] Lỗi trong việc gọi apiPost cho DELETE request

#### 1.4. Lỗi P3 (Low)
- [x] Thiếu kiểm tra lỗi chi tiết trong API calls
- [x] Thiếu comment cho các hàm phức tạp
- [x] Thiếu kiểm tra kiểu dữ liệu đầu vào

## IV. THEO DÕI TIẾN ĐỘ

### KPIs mục tiêu:
| Metric | Before | Target | After |
|--------|--------|--------|-------|
| ESLint errors | 48 | 0 | TBD |
| TypeScript errors | 0 | 0 | 0 |
| Custom hooks | 3 | 10+ | TBD |
| UI components | 6+ | 20+ | TBD |
| Code reusability | Medium | High | TBD |
| Testability | Medium | High | TBD |

### Mốc kiểm tra:
- Mỗi công việc sẽ được đánh dấu hoàn thành khi thực hiện xong
- Tất cả các công việc sẽ được theo dõi và cập nhật tiến độ hàng tuần

## V. KẾT LUẬN

Dự án ShareDocu đang trên đà hoàn thiện với các cải tiến quan trọng về bảo mật và cấu trúc code đã được thực hiện. Các bước tiếp theo sẽ tập trung vào việc áp dụng API client, cải thiện UX và dọn dẹp codebase để tạo ra một sản phẩm hoàn chỉnh và chuyên nghiệp.