Chắc chắn rồi. Đây là một bước cực kỳ quan trọng để đảm bảo cả hai team Frontend và Backend có một sự hiểu biết chung và nhất quán về những gì đã được xây dựng, trước khi chúng ta tiếp tục với Sprint 4.

Dưới đây là hai bản tóm tắt riêng biệt, một cho team Backend và một cho team Frontend, bao gồm tất cả các thông tin cốt lõi từ **Sprint 1, 2 và 3**.

---

### **A. Tóm tắt cho Team Backend (BE)**

**Tổng quan:** Vai trò của Backend là "bộ não" của hệ thống, chịu trách nhiệm về logic nghiệp vụ, xử lý dữ liệu, và bảo mật. Toàn bộ hệ thống được xây dựng dưới dạng một RESTful API để cung cấp dữ liệu cho Frontend.

---
#### **1. API Contract đã triển khai (Endpoints)**

*   **Authentication (`/api/auth`)**
    *   `POST /register`: Đăng ký người dùng mới.
    *   `POST /login`: Xác thực người dùng và trả về JWT token.
*   **Places (Public)**
    *   `GET /places`: Lấy danh sách địa điểm (cho trang chủ).
    *   `GET /places/{slug}`: Lấy thông tin chi tiết của một địa điểm, bao gồm cả danh sách các reviews liên quan.
*   **Reviews (Yêu cầu xác thực)**
    *   `POST /places/:placeId/reviews`: Đăng một bình luận/đánh giá mới cho một địa điểm.
*   **User Visits (Yêu cầu xác thực)**
    *   `POST /me/visits`: Đánh dấu một địa điểm là "đã ghé thăm".
    *   `GET /me/visits`: Lấy lịch sử các địa điểm đã ghé thăm của người dùng.
*   **Admin**
    *   `POST /admin/places`: Tạo một địa điểm mới (bao gồm logic gọi OpenStreetMap để lấy tọa độ).

---
#### **2. Quy định & Logic Nghiệp vụ Quan trọng**

*   **Xác thực (Authentication):**
    *   Hệ thống phải sử dụng **JSON Web Tokens (JWT)**.
    *   Một lớp **middleware** phải được implement để kiểm tra JWT token trên tất cả các route yêu cầu đăng nhập.
*   **Bảo mật Mật khẩu:**
    *   Mật khẩu người dùng trong database phải được **hash** bằng `bcrypt`. Tuyệt đối không lưu mật khẩu dạng plaintext.
*   **Tạo Slug tự động:**
    *   Khi một địa điểm mới được tạo (`ND-001`), hệ thống phải tự động tạo ra một `slug` (URL-friendly string) từ `name` của địa điểm và đảm bảo nó là duy nhất.
*   **Tính toán Rating trung bình:**
    *   Mỗi khi một `review` mới được thêm vào (`CD-003`), hệ thống phải tự động tính toán lại giá trị `average_rating` của địa điểm tương ứng và cập nhật vào bảng `places`.
*   **Cấu trúc Database:**
    *   Database **PostgreSQL** phải bao gồm các bảng đã được thiết kế: `users`, `places`, `place_images`, `reviews`, `user_visits`.
    *   Các mối quan hệ (Foreign Keys) giữa các bảng phải được thiết lập chính xác.

---
#### **3. Checklist Kiểm tra trong Code base (BE)**

*   [ ] Toàn bộ các endpoint liệt kê ở trên đã được implement và hoạt động đúng với Postman/Insomnia chưa?
*   [ ] Middleware xác thực JWT đã được áp dụng cho các route `reviews` và `user_visits` chưa?
*   [ ] Mật khẩu trong bảng `users` có được hash không?
*   [ ] Khi tạo địa điểm mới, trường `slug` có được tự động điền không?
*   [ ] Khi đăng review mới, trường `average_rating` của địa điểm có được cập nhật lại không?

---
### **B. Tóm tắt cho Team Frontend (FE)**

**Tổng quan:** Vai trò của Frontend là xây dựng một giao diện người dùng trực quan, đáp ứng (responsive) và mang lại trải nghiệm mượt mà. Frontend là "người tiêu thụ" (consumer) dữ liệu từ các API do Backend cung cấp.

---
#### **1. Các Tính năng & Tương tác API**

*   **Luồng Khám phá (Không cần đăng nhập):**
    *   **Trang chủ:** Gọi `GET /api/places` để hiển thị danh sách địa điểm nổi bật.
    *   **Trang chi tiết:** Gọi `GET /api/places/{slug}` để hiển thị toàn bộ thông tin, bao gồm cả việc đọc và hiển thị danh sách các reviews.
*   **Luồng Xác thực Người dùng:**
    *   **Đăng ký:** Dựng form, gọi `POST /api/auth/register` và xử lý kết quả.
    *   **Đăng nhập:** Dựng form, gọi `POST /api/auth/login`, nhận và lưu trữ JWT token.
*   **Luồng Tương tác (Yêu cầu đăng nhập):**
    *   **Đăng bình luận:** Dựng form, gọi `POST /api/places/:placeId/reviews`, gửi kèm JWT token trong header.
    *   **Đánh dấu đã ghé thăm:** Thêm nút chức năng, gọi `POST /api/me/visits`, gửi kèm JWT token.
    *   **Xem lịch sử:** Dựng trang cá nhân, gọi `GET /api/me/visits`, gửi kèm JWT token.
*   **Luồng Admin:**
    *   **Tạo địa điểm:** Dựng trang quản trị với form chi tiết, gọi `POST /admin/places` (tạm thời chưa cần JWT cho demo ban đầu).

---
#### **2. Quy định & Logic Nghiệp vụ Quan trọng**

*   **Quản lý Trạng thái Toàn cục (Global State):**
    *   Hệ thống phải có một cơ chế quản lý trạng thái đăng nhập của người dùng (ví dụ: React Context, Redux). Toàn bộ ứng dụng phải biết được người dùng đã đăng nhập hay chưa và thông tin của họ là gì.
*   **Lưu trữ Token:**
    *   JWT token nhận được sau khi đăng nhập phải được lưu trữ an toàn ở phía client (ví dụ: `localStorage`, `sessionStorage` hoặc `HttpOnly cookie`).
*   **Gửi Token với Request:**
    *   Tất cả các lệnh gọi API đến các endpoint yêu cầu xác thực phải tự động đính kèm token vào `Authorization` header (ví dụ: `Authorization: Bearer <token>`).
*   **Hiển thị có điều kiện (Conditional Rendering):**
    *   Giao diện phải thay đổi dựa trên trạng thái đăng nhập. Ví dụ:
        *   Hiển thị "Đăng nhập/Đăng ký" vs. "Chào, [Tên người dùng]".
        *   Ẩn/hiện form "Viết bình luận".
        *   Ẩn/hiện các tính năng cá nhân hóa.
*   **Xử lý Lỗi (Error Handling):**
    *   Ứng dụng phải có khả năng xử lý các lỗi trả về từ API (mã 4xx, 5xx) và hiển thị thông báo thân thiện cho người dùng.

---
#### **3. Checklist Kiểm tra trong Code base (FE)**

*   [ ] Cơ chế quản lý trạng thái đăng nhập toàn cục đã được implement chưa?
*   [ ] Token có được lưu và gửi đi đúng cách với các request được bảo vệ không?
*   [ ] Giao diện có tự động cập nhật sau khi người dùng đăng nhập hoặc đăng xuất không?
*   [ ] Form "Viết bình luận" có bị ẩn đi đối với khách (guest) không?
*   [ ] Các thông báo lỗi từ API (ví dụ: "Email đã tồn tại", "Sai mật khẩu") có được hiển thị cho người dùng không?