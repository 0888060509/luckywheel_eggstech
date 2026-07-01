# Tài Liệu Đặc Tả Yêu Cầu Chức Năng (Functional Requirements Specification - FRS)

**Dự án:** Minigame Vòng Quay May Mắn (Lucky Wheel)
**Ngày cập nhật:** 30/06/2026
**Vai trò:** Senior Business Analyst

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
Minigame "Vòng Quay May Mắn" là một ứng dụng Web/Mini App tương tác, hỗ trợ doanh nghiệp triển khai các chiến dịch thu hút khách hàng (lead generation), tri ân khách hàng và tăng tỷ lệ chuyển đổi. Hệ thống được chia thành hai phân hệ chính: 
- **Người dùng cuối (End-User):** Tham gia vòng quay, đăng ký thẻ thành viên, nhận thưởng và chia sẻ.
- **Quản trị viên (Admin):** Quản lý chiến dịch, cấu hình giao diện, thiết lập tỷ lệ trúng thưởng và thống kê dữ liệu.

---

## 2. QUY TRÌNH NGHIỆP VỤ (BUSINESS FLOW)
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

## 3. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### 3.1 Phân hệ Người dùng cuối (End-User Frontend)
Dựa vào luồng thực thi thực tế của hệ thống, phân hệ Người dùng cuối bao gồm các chức năng chi tiết sau:

| Mã Yêu Cầu | Tên Chức Năng | Mô tả chi tiết |
| :--- | :--- | :--- |
| **FR-U01** | **Khởi tạo & Kiểm tra Chiến dịch** | Khi load trang, gọi API `/api/config` để lấy cấu hình chiến dịch đang `active`. Kiểm tra `startDate` và `endDate` so với thời gian hiện tại. Nếu ngoài khung giờ hoặc không có chiến dịch, hiển thị màn hình chặn: "Không có chương trình" hoặc "Chưa đến lúc!". Nếu URL có tham số `?preview=true` (dành cho Admin test) thì bỏ qua check thời gian. |
| **FR-U02** | **Tham gia qua Zalo (Zalo Consent)** | Hiển thị nút "ĐĂNG NHẬP QUA ZALO". Nhấn vào sẽ hiển thị popup xin quyền chia sẻ số điện thoại (Mô phỏng Zalo SDK). Nếu đồng ý, tự động cấp SĐT và gọi API kiểm tra. Nếu từ chối, hiển thị thông báo lỗi nhắc nhở nhập thủ công. |
| **FR-U03** | **Nhập SĐT Thủ công & Validate** | Cung cấp ô nhập SĐT dự phòng. Khi người dùng submit, kiểm tra định dạng chuẩn SĐT Việt Nam bằng Regex `/(84\|0[3\|5\|7\|8\|9])+([0-9]{8})\b/g`. Báo lỗi ngay lập tức (inline) nếu sai định dạng. |
| **FR-U04** | **Kiểm tra Lịch sử Khách hàng** | Gửi SĐT lên API `/api/check-phone`.<br>- Nếu SĐT đã quay trong chiến dịch này: Chuyển thẳng tới màn hình "Kết quả" và hiển thị giải cũ (Block quay lại).<br>- Nếu SĐT tồn tại nhưng chưa quay: Chuyển tới màn hình Vòng quay.<br>- Nếu SĐT mới hoàn toàn: Chuyển sang bước Đăng ký thành viên. |
| **FR-U05** | **Đăng ký Thẻ Thành viên** | Màn hình xin phép tạo thẻ thành viên. Nút "Đồng ý & Tạo thẻ" gọi API `/api/register` tạo tài khoản (`is_member = 1`), server log gửi Zalo ZNS chào mừng. Chọn "Từ chối" sẽ quay lại bước nhập SĐT ban đầu. |
| **FR-U06** | **Tương tác Vòng quay** | Vòng quay hiển thị động nhãn (label) và màu sắc cấu hình. Khi bấm "QUAY NGAY", gọi API `/api/spin` chốt kết quả giải thưởng trước khi hoạt ảnh quay bắt đầu (hiệu ứng xoay 5 vòng + định tuyến trỏ đúng phần thưởng). Trạng thái chờ hiển thị chữ "Đang quay..." kèm hiệu ứng nhấp nháy. |
| **FR-U07** | **Hiệu ứng & Âm thanh** | - Play BGM khi vào màn quay, âm thanh tick-tick (spinSound) khi quay.<br>- Nếu trúng giải (Tên giải KHÔNG chứa chữ "may mắn"): Phát âm thanh Chiến thắng (playWin) & bắn pháo giấy (Confetti) màu sắc chủ đạo của brand.<br>- Nếu quay trúng giải khuyến khích (Tên giải CÓ chữ "may mắn"): Phát âm thanh Thua cuộc (playLose), không bắn pháo giấy. |
| **FR-U08** | **Gửi thông báo & Chia sẻ** | Hiển thị màn hình Kết quả với hộp quà nổi bật. Server thực hiện log gửi Zalo ZNS thông báo nhận quà đến SĐT. Frontend cung cấp Web Share API (Nút Chia Sẻ góc trái) cho phép share tự nhiên qua HĐH, hoặc Copy link nếu trình duyệt không hỗ trợ. Có nút "Quay lại" để reset session chơi. |

### 3.2 Phân hệ Quản trị viên (Admin Panel)
| Mã Yêu Cầu | Tên Chức Năng | Mô tả chi tiết |
| :--- | :--- | :--- |
| **FR-A01** | **Tổng quan thống kê (Dashboard)** | Hiển thị các chỉ số thời gian thực: Tổng lượt quay, Tổng người chơi tham gia, Tỷ lệ chuyển đổi thành viên. Thống kê biểu đồ phân bổ chi tiết của các phần thưởng. |
| **FR-A02** | **Quản lý Thời gian & Giao diện** | Cho phép setup `Start Date` và `End Date`. Cấu hình dải màu chủ đạo (Theme): Primary, Secondary, Tertiary, Background để linh động theo brand identity. |
| **FR-A03** | **Quản lý Kho & Tỷ lệ trúng** | Cho phép Thêm/Sửa/Xóa các giải thưởng.<br>- Nhãn (Label): Hiển thị ngắn gọn trên mặt vòng quay.<br>- Tỷ lệ (Probability): Quyết định xác suất ra.<br>- Kho (Stock, -1 là vô hạn): Tự động giảm khi user trúng. Hết kho sẽ không rơi vào ô đó. |
| **FR-A04** | **Xem trước trực tiếp (Live Preview)** | Cung cấp một khung di động (mobile frame) ngay trong màn hình Cấu hình, giúp quản trị viên xem ngay thay đổi màu sắc, nhãn mác qua luồng postMessage thời gian thực. |
| **FR-A05** | **Xuất dữ liệu CSV** | Hỗ trợ tải xuống file `.csv` chứa toàn bộ danh sách User, Số điện thoại và Phần thưởng tương ứng để bộ phận Telesale/CSKH gọi xác nhận trả thưởng. |

---

## 4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

- **NFR-01: An toàn & Bảo mật (Security & Anti-cheat)**: 
  - Kết quả Vòng quay phải được chốt trước bởi Server-side khi user bắt đầu bấm "Quay". Frontend chỉ đóng vai trò animate diễn hoạt nhằm ngăn ngừa việc can thiệp bằng console/DevTools.
- **NFR-02: Trải nghiệm người dùng (UX/UI)**:
  - Thiết kế Mobile-first ưu tiên, phù hợp với thao tác vuốt, chạm. Sử dụng background gradient động, glassmorphism (backdrop-blur) và animation mượt mà (Framer Motion).
- **NFR-03: Khả năng chịu tải**:
  - Tối ưu hóa Database locking (bằng transaction) để đảm bảo không bị quá xuất phần thưởng (Overselling) trong trường hợp có lượng truy cập đồng thời lớn.

---

## 5. QUY TẮC NGHIỆP VỤ (BUSINESS RULES) CHUYÊN SÂU - PHÂN HỆ NGƯỜI DÙNG

1. **Quy tắc Kiểm duyệt Thời gian hiển thị (Timeframe Rule):**
   - Truy cập vào hệ thống sẽ bị chặn bằng UI nếu thời gian `now < startDate` hoặc `now > endDate`.
   - **Ngoại lệ (Bypass):** Chạy Minigame với đường dẫn kèm param `?preview=true` (chế độ xem trước của Admin) sẽ bỏ qua check thời gian để phục vụ testing.
   
2. **Quy tắc Tham gia Định danh (1 User - 1 Lượt/Chiến dịch):**
   - Định danh duy nhất của khách hàng là Số Điện Thoại (`phone`).
   - Một số điện thoại có thể lưu định danh tĩnh ở bảng `users`, nhưng trên bảng `spins` (lượt quay), mỗi user chỉ có tối đa **1 bản ghi (tương ứng 1 lượt quay) đối với 1 cấu hình chiến dịch (`configId`)**.
   - Nếu số điện thoại cũ đăng nhập lại vào cùng chiến dịch, API quét trong bảng `spins` sẽ trả về `hasSpun = true` kèm object `previousPrize` để ép hiển thị màn hình kết quả ngay lập tức và cấm gọi hành động quay lại.

3. **Quy tắc Quay trúng & Rớt kho (Probability & Stock Rule):**
   - Trục quay ngẫu nhiên chỉ lấy các giải thưởng thuộc cấu hình hiện tại và có tồn kho hợp lệ (`stock > 0` hoặc vô hạn `stock = -1`). Giải thưởng có `stock = 0` tự động bị loại khỏi vòng tính tỷ lệ (Total Probability pool).
   - Random pool tính theo thuật toán Cộng dồn xác suất (Cumulative Probability): Sinh số ngẫu nhiên từ `0` đến `totalProb` và duyệt mảng cộng dồn để xác định item trúng.
   - Khi chốt giải, nếu giải có giới hạn (`stock > 0`), hệ thống thực thi lệnh trừ SQL: `UPDATE prizes SET stock = stock - 1 WHERE id = ? AND stock > 0`. Nếu số row thay đổi (`info.changes`) bằng `0` (kho đã bị hụt trong tích tắc), ném Exception để Rollback Transaction.

4. **Quy tắc Định hình Giải Trúng / Khuyến khích (Win/Lose Flow):**
   - **Trúng giải (Win):** Khớp điều kiện tên giải thưởng (`prizeName`) **không chứa** từ khoá `"may mắn"`.
   - **Khuyến khích (Lose/Try Again):** Khớp điều kiện `prizeName` **có chứa** chữ `"may mắn"` (Ví dụ: "Chúc bạn may mắn lần sau"). Khi rơi vào rule này, Frontend kích hoạt luồng thất bại: Phát nhạc Fail buồn, bỏ qua hiệu ứng bắn Confetti.

---

## 6. XỬ LÝ NGOẠI LỆ (EXCEPTION HANDLING) - PHÂN HỆ NGƯỜI DÙNG

1. **Từ chối Quyền Zalo (Zalo Consent Denied):**
   - Trong quá trình Đăng nhập qua Zalo, nếu người dùng tương tác bấm "Từ chối" quyền truy cập số điện thoại, hệ thống sẽ trigger trạng thái Exception và hiển thị thông báo lỗi màu đỏ (Red Alert Box): *"Rất tiếc! Để tham gia quay thưởng nhanh chóng bạn cần cho phép Zalo chia sẻ số điện thoại. Đừng lo, bạn vẫn có thể nhập số điện thoại thủ công ở ô bên dưới nhé!"* nhằm giữ luồng trải nghiệm không bị đứt gãy.

2. **Người dùng Đã Tham Gia nhưng tải lại trang (F5) hoặc nhập lại SĐT:**
   - Việc xác minh lịch sử chơi là tuyệt đối. Khi người dùng cố tình tải lại trang hoặc thử nhập lại chính SĐT đã dùng, hàm gọi `/api/check-phone` nhận diện `hasSpun = true`. Frontend lập tức bỏ qua luồng "Đồng ý Tạo thẻ" và "Quay vòng quay", ép đẩy (Force Redirect) về Step `"result"`. Màn hình chốt nội dung: *"Bạn Đã Tham Gia! Phần quà của bạn là: [Giải thưởng cũ]"* kèm cảnh báo *"Mỗi số điện thoại chỉ được nhận thưởng 1 lần"*.

3. **Hết toàn bộ giải thưởng trong kho:**
   - Khi gọi lệnh `/api/spin`, nếu Backend truy xuất DB và thấy không còn giải thưởng nào thoả điều kiện `stock > 0` hoặc `stock = -1`, API ném Exception: *"Tất cả phần thưởng đã hết!"*. Frontend bắt Exception này và popup `alert()`, từ chối chạy hoạt ảnh xoay. Do đó, Admin cần đảm bảo luôn có ít nhất 1 giải `stock = -1` (vô hạn) như một lớp Fallback đón các lượt quay cuối.

---

## 7. XỬ LÝ LỖI (ERROR HANDLING) - PHÂN HỆ NGƯỜI DÙNG

1. **Lỗi Kết nối & Tải Cấu Hình (Fetch Config Error):**
   - **Mô tả:** Lỗi phát sinh ngay khi người dùng load trang (giai đoạn `useEffect`), không gọi được API `/api/config` (có thể do mạng yếu hoặc server crash).
   - **Xử lý:** Frontend gán cờ `fetchError = true`. Thay vì trắng trang hoặc hiện Loading mãi mãi, màn hình được xử lý lỗi Graceful Degradation hiển thị dòng chữ *"Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng."* kèm một nút bấm lớn *"Thử lại"* để người dùng tự retry function tải lại cấu hình.

2. **Lỗi Định dạng Số Điện Thoại Thủ Công (Validation/Format Error):**
   - **Mô tả:** Người dùng nhập SĐT gõ nhầm chữ cái, độ dài nhỏ hơn 10 ký tự, hoặc sai đầu số nhà mạng VN.
   - **Xử lý:** Bắt ngay tại Client-side thông qua hàm `validatePhone()`. Nếu sai, chặn submit. Box input tự động chuyển màu viền cảnh báo (`border-red-500`) và hiển thị đoạn text đỏ báo lỗi: *"Số điện thoại không hợp lệ"* ngay dưới ô nhập, bắt buộc sửa mới cho đi tiếp.

3. **Lỗi Đường truyền khi đang chốt kết quả Quay (Spin Connection Error):**
   - **Mô tả:** User vừa bấm nút "QUAY NGAY" nhưng mạng rớt kết nối tới API.
   - **Xử lý:** Function `handleSpin` được bọc toàn bộ trong khối lệnh `try...catch`. Block `catch` hiển thị Alert thông báo: *"Lỗi kết nối. Vui lòng kiểm tra lại mạng!"*, đồng thời lập tức trả nút Quay về trạng thái khả dụng ban đầu (`isAssigningPrize = false`), ngăn chặn lỗi kẹt giao diện ở trạng thái "ĐANG XỬ LÝ...".

4. **Lỗi Xung đột Dữ liệu (Race Condition / Overselling Error):**
   - **Mô tả:** 2 người dùng thao tác bấm chốt cùng 1 mili-giây nhắm vào giải thưởng vật lý cuối cùng còn lại (Kho = 1).
   - **Xử lý (Database level):** Backend kiểm soát chặt bằng `db.transaction()`. Nếu lệnh trừ (`UPDATE ... WHERE stock > 0`) thất bại và không có record nào thay đổi (do User A đã lấy trước 1 mili-giây đưa kho về 0), tiến trình cho User B ném lỗi `Lỗi cập nhật kho!`. Transaction bị huỷ (Rollback). Trả về Frontend báo lỗi, bảo toàn tính nhất quán tuyệt đối của hệ thống (Data Integrity). User B có thể bấm lại và hệ thống sẽ loại món quà đó ra để random lại vào phần quà khác.
