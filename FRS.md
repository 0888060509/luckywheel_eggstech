# Tài Liệu Đặc Tả Yêu Cầu Chức Năng (Functional Requirements Specification - FRS)

**Dự án:** Minigame Vòng Quay May Mắn (Lucky Wheel)
**Ngày cập nhật:** 01/07/2026
**Vai trò:** Senior Business Analyst

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
Minigame "Vòng Quay May Mắn" là một ứng dụng Web/Mini App tương tác, hỗ trợ doanh nghiệp triển khai các chiến dịch thu hút khách hàng (lead generation), tri ân khách hàng và tăng tỷ lệ chuyển đổi. Hệ thống được chia thành hai phân hệ chính: 
- **Người dùng cuối (End-User):** Tham gia vòng quay, đăng ký thẻ thành viên, nhận thưởng và chia sẻ.
- **Quản trị viên (Admin):** Quản lý chiến dịch, cấu hình giao diện, thiết lập tỷ lệ trúng thưởng và thống kê dữ liệu.

---

## 2. KIẾN TRÚC HỆ THỐNG & CƠ SỞ DỮ LIỆU (SYSTEM ARCHITECTURE & DATABASE)
Hệ thống sử dụng SQLite (thông qua `better-sqlite3`) cho việc lưu trữ dữ liệu tại local/backend server, chia làm 4 thực thể chính:
1. **configs (Cấu hình chiến dịch):** Lưu trữ thông tin chiến dịch (`name`, `startDate`, `endDate`, `status`, `settings` JSON). Cấu hình duy nhất được active (hoặc mới nhất) sẽ áp dụng cho frontend.
2. **prizes (Giải thưởng):** Lưu thông tin các giải thưởng thuộc một chiến dịch (`config_id`, `name`, `label`, `probability`, `color`, `stock`).
3. **users (Người dùng):** Định danh người chơi bằng số điện thoại (`phone`), kèm trạng thái đăng ký thành viên (`is_member`).
4. **spins (Lượt quay):** Bảng lịch sử quay, mỗi bản ghi mapping 1 `user_id` với 1 `prize_id` thuộc 1 `config_id`. Đảm bảo người dùng chỉ quay 1 lần duy nhất trong mỗi chiến dịch.

---

## 3. QUY TRÌNH NGHIỆP VỤ (BUSINESS FLOW)
1. Khách hàng truy cập đường dẫn Minigame. Hệ thống tải cấu hình và kiểm tra tính hợp lệ của thời gian chiến dịch.
2. Nếu chiến dịch đang diễn ra, hiển thị màn hình yêu cầu khách hàng tham gia (qua Zalo hoặc nhập SĐT thủ công).
3. Hệ thống kiểm tra lịch sử tham gia:
   - Nếu đã tham gia và quay thưởng: Hiển thị ngay phần thưởng đã trúng.
   - Nếu chưa tham gia: Chuyển sang bước xin quyền tạo thẻ thành viên.
4. Sau khi xác nhận đăng ký thành viên, khách hàng được chuyển đến màn hình Vòng quay.
5. Khách hàng bấm "Quay Ngay". Frontend gọi API báo cáo server, server tính toán giải thưởng dựa trên xác suất, tồn kho và chốt kết quả.
6. Vòng quay thực hiện hiệu ứng quay vòng và dừng tại giải thưởng được server chỉ định.
7. Hệ thống hiển thị popup chúc mừng (kèm hiệu ứng pháo giấy, âm thanh), gửi tin nhắn Zalo ZNS (mô phỏng) và hiển thị nút chia sẻ lan tỏa chiến dịch.

---

## 4. YÊU CẦU CHỨC NĂNG - PHÂN HỆ NGƯỜI DÙNG CUỐI (END-USER FRONTEND)

| Mã Yêu Cầu | Tên Chức Năng | Mô tả chi tiết |
| :--- | :--- | :--- |
| **FR-U01** | **Khởi tạo & Kiểm tra Chiến dịch** | Khi load trang, gọi API `/api/config` để lấy cấu hình chiến dịch đang `active`. Kiểm tra `startDate` và `endDate` so với thời gian hiện tại. Nếu ngoài khung giờ hoặc không có chiến dịch, hiển thị màn hình chặn: "Không có chương trình" hoặc "Chưa đến lúc!". URL có tham số `?preview=true` sẽ bỏ qua check thời gian. Áp dụng CSS variables cho Theme từ cấu hình. |
| **FR-U02** | **Tham gia qua Zalo (Zalo Consent)** | Hiển thị nút "ĐĂNG NHẬP QUA ZALO". Nhấn vào sẽ hiển thị popup xin quyền chia sẻ số điện thoại (Mô phỏng Zalo SDK). Nếu đồng ý, tự động điền SĐT và tiếp tục. |
| **FR-U03** | **Nhập SĐT Thủ công & Validate** | Cung cấp ô nhập SĐT dự phòng. Khi submit, kiểm tra định dạng chuẩn SĐT Việt Nam (bắt đầu bằng 03,05,07,08,09 và có đủ 10 số). Báo lỗi ngay lập tức (inline) nếu sai định dạng. |
| **FR-U04** | **Kiểm tra Lịch sử Khách hàng** | Gửi SĐT lên API `/api/check-phone`.<br>- Nếu SĐT đã quay trong chiến dịch này: Chuyển thẳng tới màn hình "Kết quả" và hiển thị giải cũ (Block quay lại).<br>- Nếu SĐT tồn tại nhưng chưa quay: Chuyển tới màn hình Vòng quay.<br>- Nếu SĐT mới hoàn toàn: Chuyển sang bước Đăng ký thành viên. |
| **FR-U05** | **Đăng ký Thẻ Thành viên** | Màn hình xin phép tạo thẻ thành viên. Nút "Đồng ý & Tạo thẻ" gọi API `/api/register` tạo tài khoản (`is_member = 1`). Chọn "Từ chối" sẽ quay lại bước nhập SĐT ban đầu. |
| **FR-U06** | **Tương tác Vòng quay** | Vòng quay hiển thị động nhãn (label) và màu sắc cấu hình. Khi bấm "QUAY NGAY", gọi API `/api/spin` chốt kết quả giải thưởng trước khi hoạt ảnh quay bắt đầu (hiệu ứng xoay 5 vòng + định tuyến trỏ đúng phần thưởng). Trạng thái chờ hiển thị chữ "Đang xử lý..." kèm hiệu ứng vô hiệu hóa nút. |
| **FR-U07** | **Hiệu ứng & Âm thanh** | - Play BGM khi vào màn quay, âm thanh tick-tick (spinSound) khi quay.<br>- Trúng giải (Tên giải KHÔNG chứa chữ "may mắn"): Phát âm thanh Chiến thắng (playWin) & bắn pháo giấy (Confetti).<br>- Trượt giải (Tên giải CÓ chữ "may mắn"): Phát âm thanh Thua cuộc (playLose), không bắn pháo giấy. |
| **FR-U08** | **Gửi thông báo & Chia sẻ** | Hiển thị màn hình Kết quả với hộp quà nổi bật. Cung cấp Web Share API (Nút Chia Sẻ) cho phép share tự nhiên qua HĐH, hoặc Copy link nếu trình duyệt không hỗ trợ. Có nút "Quay lại" để reset session chơi. |

---

## 5. YÊU CẦU CHỨC NĂNG - PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN PANEL)

| Mã Yêu Cầu | Tên Chức Năng | Mô tả chi tiết |
| :--- | :--- | :--- |
| **FR-A01** | **Tổng quan thống kê (Dashboard)** | Xem thống kê số lượng người tham gia, thành viên đăng ký mới (tỉ lệ chuyển đổi), tổng số lượt quay. Biểu đồ tần suất quay 7 ngày qua (Bar chart) và biểu đồ phân bổ giải thưởng theo tỉ lệ và theo thời gian. |
| **FR-A02** | **Quản lý Chiến dịch (Configs)** | Xem danh sách các chiến dịch. Thêm mới, chỉnh sửa (draft/active) hoặc xóa chiến dịch. Một chiến dịch bao gồm tên, ngày bắt đầu/kết thúc, cài đặt màu sắc, hình ảnh và danh sách giải thưởng. |
| **FR-A03** | **Quản lý Giao diện (Theme)** | Chọn Theme từ các mẫu có sẵn (Mặc định, Tết, 8/3, Trung Thu, Giáng Sinh...) hoặc tự cấu hình các mã màu: Primary, Secondary, Tertiary, Background. |
| **FR-A04** | **Quản lý Hình ảnh & SEO** | Nhập Logo URL (Hiển thị góc trên minigame), Meta Title, Meta Description và Meta Image cho tính năng chia sẻ Zalo/Facebook. |
| **FR-A05** | **Quản lý Giải thưởng (Prizes)** | Thêm/Sửa/Xóa các giải thưởng trong một cấu hình. Mỗi giải thưởng có: Tên giải, Nhãn hiển thị trên vòng, Xác suất (Probability 0-1), Màu sắc (hex) và Số lượng tồn kho (Stock, -1 là vô hạn). |
| **FR-A06** | **Xem trước thời gian thực (Live Preview)** | Cửa sổ Iframe hiển thị giả lập Minigame mobile bên cạnh màn hình cài đặt. Mọi thay đổi về màu sắc, thông tin giải thưởng sẽ được cập nhật tức thời vào Iframe thông qua `postMessage`. |
| **FR-A07** | **Lịch sử trúng thưởng & Xuất CSV** | Bảng danh sách chi tiết SĐT và giải thưởng trúng của từng chiến dịch. Hỗ trợ tải file `.csv` danh sách này từ nút "Xuất CSV" trong Dashboard. |

---

## 6. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

- **NFR-01: An toàn & Bảo mật (Security & Anti-cheat)**: 
  - Kết quả Vòng quay phải được chốt trước bởi Server-side khi user bắt đầu bấm "Quay". Frontend chỉ đóng vai trò animate diễn hoạt nhằm ngăn ngừa việc can thiệp bằng console/DevTools.
- **NFR-02: Trải nghiệm người dùng (UX/UI)**:
  - Thiết kế Mobile-first ưu tiên, phù hợp với thao tác vuốt, chạm. Sử dụng background gradient động, glassmorphism (backdrop-blur) và animation mượt mà (Framer Motion).
- **NFR-03: Khả năng chịu tải & Đồng nhất dữ liệu**:
  - Tối ưu hóa Database locking bằng `transaction` trong API `/api/spin` để đảm bảo không bị quá xuất phần thưởng (Overselling) khi nhiều request đồng thời, trừ stock chuẩn xác.

---

## 7. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

1. **Quy tắc Kiểm duyệt Thời gian hiển thị (Timeframe Rule):**
   - Truy cập vào hệ thống sẽ bị chặn bằng UI nếu thời gian hiện tại không nằm giữa khoảng `startDate` và `endDate`. Trừ khi có URL Params `?preview=true`.
   
2. **Quy tắc Tham gia Định danh (1 User - 1 Lượt/Chiến dịch):**
   - Định danh duy nhất là Số Điện Thoại (`phone`). Mỗi SĐT chỉ có tối đa **1 bản ghi (lượt quay) đối với 1 cấu hình chiến dịch (`configId`)**.
   - Chặn quay API/UI nếu kiểm tra thấy SĐT đã quay trong chiến dịch này.

3. **Quy tắc Tính Xác suất & Tồn kho (Probability & Stock Rule):**
   - Trục quay ngẫu nhiên chỉ lấy các giải thưởng thuộc cấu hình hiện tại và có tồn kho hợp lệ (`stock > 0` hoặc vô hạn `stock = -1`). Giải thưởng có `stock = 0` tự động bị loại khỏi vòng tính tỷ lệ (Total Probability pool).
   - Thuật toán Random pool sử dụng mảng dồn (Cumulative Probability) từ 0 đến Tổng xác suất các giải đang có kho.
   - **Validation Config:** Quản trị viên khi lưu chiến dịch, tổng xác suất (probability) của tất cả giải thưởng bắt buộc phải xấp xỉ bằng `1.0`. Nếu không, chặn thao tác lưu.

4. **Quy tắc Định hình Giải Trúng / Khuyến khích (Win/Lose Flow):**
   - **Khuyến khích (Lose/Try Again):** Khớp điều kiện `prizeName` **có chứa** chữ `"may mắn"` (Không phân biệt hoa thường). Frontend kích hoạt luồng thất bại.
   - **Trúng giải (Win):** Các trường hợp còn lại. Frontend kích hoạt luồng chiến thắng.

---

## 8. XỬ LÝ NGOẠI LỆ & LỖI (EXCEPTION & ERROR HANDLING)

1. **Từ chối Quyền Zalo (Zalo Consent Denied):**
   - Hiển thị thông báo nhắc nhở nhẹ nhàng và chuyển sang ô nhập SĐT thủ công để giữ luồng người dùng.

2. **Người dùng Đã Tham Gia nhưng tải lại trang (F5):**
   - Xác minh tại hàm `/api/check-phone` nhận diện `hasSpun = true`. Force Redirect về Step `"result"`.

3. **Lỗi Hết toàn bộ giải thưởng trong kho:**
   - Khi gọi lệnh `/api/spin`, nếu Backend không còn giải thưởng nào thoả điều kiện, API trả về lỗi 400 *"Không có giải thưởng khả dụng"*. Frontend chặn xoay, hiện alert.

4. **Lỗi Xác thực Admin (Validation Errors):**
   - Thiếu tối thiểu số lượng giải thưởng (Bắt buộc > 1 giải).
   - Tổng xác suất không bằng 1 (Chênh lệch quá mức cho phép).
   - Hiển thị alert phía admin, không lưu db.

5. **Lỗi Đường truyền khi đang chốt kết quả Quay (Spin Connection Error):**
   - Frontend bọc trong khối `try...catch`. Báo *"Có lỗi xảy ra, vui lòng thử lại!"* và reset trạng thái nút quay để người dùng click lại.

6. **Lỗi Xung đột Dữ liệu (Race Condition / Overselling Error):**
   - Nếu transaction trừ stock của giải thưởng vật lý trả về không thay đổi record nào (do có request khác đã cướp lượt kho cuối cùng). Backend API `/api/spin` trả về báo lỗi 500. Frontend yêu cầu người chơi quay lại để tái chọn giải khác. Tối ưu: Backend tự retry vòng random nội bộ trong server (nếu thiết lập) trước khi báo lỗi cho frontend. Mặc định API sẽ fail thẳng ra frontend báo thử lại.
