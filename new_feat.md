### **1. API cho Chức năng Tìm kiếm & Lọc (TK-003 & TK-004)**

Để phục vụ cả 2 giao diện tìm kiếm (dropdown gợi ý và trang kết quả đầy đủ), chúng ta sẽ thiết kế một **endpoint API duy nhất nhưng linh hoạt**.

#### **API Contract:**

*   **Endpoint:** `GET /api/places`
*   **Mục đích:** Lấy danh sách các địa điểm, hỗ trợ tìm kiếm theo từ khóa, lọc theo nhiều tiêu chí và phân trang.
*   **Xác thực:** Công khai.
*   **Query Parameters (Tham số truy vấn):**
    *   `q` (string): Từ khóa tìm kiếm. Ví dụ: `?q=chùa`.
    *   `category` (string): Lọc theo danh mục. Có thể nhận nhiều giá trị cách nhau bởi dấu phẩy. Ví dụ: `?category=Chùa,Công viên`.
    *   `district` (string): Lọc theo quận/huyện. Ví dụ: `?district=Quận 1`.
    *   `sortBy` (string): Sắp xếp kết quả. Ví dụ: `?sortBy=name_asc` (Tên A-Z), `?sortBy=rating_desc` (Đánh giá cao nhất).
    *   `limit` (number): Giới hạn số lượng kết quả trả về. Mặc định là 10.
    *   `page` (number): Dùng cho phân trang. Mặc định là 1.

#### **Mô tả hoạt động:**

*   **Khi người dùng gõ vào thanh search có dropdown (UI 1):**
    *   Frontend sẽ gọi API này với từ khóa người dùng đang gõ và một `limit` nhỏ. Ví dụ: `GET /api/places?q=chua&limit=5`.
    *   Backend sẽ thực hiện tìm kiếm (hỗ trợ không dấu) và trả về một danh sách rút gọn (chỉ cần `id`, `name`, `district`).
    *   Frontend nhận kết quả và hiển thị trong dropdown gợi ý.

*   **Khi người dùng ở trang tìm kiếm đầy đủ (UI 2):**
    *   Frontend sẽ gọi API này với đầy đủ các tham số từ bộ lọc. Ví dụ: `GET /api/places?category=Điểm tham quan&district=Quận 1&sortBy=rating_desc`.
    *   Backend xử lý logic tìm kiếm, lọc và sắp xếp, sau đó trả về dữ liệu đầy đủ để hiển thị các thẻ thông tin (card info).

#### **Response Body (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-cua-dia-diem",
      "name": "Chùa Ngọc Hoàng",
      "slug": "chua-ngoc-hoang",
      "district": "Quận 1",
      "cover_image_url": "https://example.com/image.jpg",
      "average_rating": 5.0
    }
  ],
  "pagination": {
    "totalItems": 26,
    "totalPages": 3,
    "currentPage": 1
  }
}
```

---

### **2. API cho Chức năng Tìm kiếm trên Bản đồ (TK-005 nâng cao)**

**Tin tốt:** Chúng ta **không cần tạo API mới**. Chúng ta sẽ tái sử dụng chính API ở trên, nhưng yêu cầu nó trả về thêm thông tin tọa độ.

#### **API Contract:**

*   **Endpoint:** `GET /api/places` (giống hệt ở trên)

#### **Mô tả hoạt động:**

1.  Người dùng truy cập trang bản đồ và gõ vào ô tìm kiếm (ví dụ: "bảo tàng").
2.  Frontend gọi API: `GET /api/places?q=bảo tàng&limit=50` (lấy nhiều kết quả để hiển thị hết trên bản đồ).
3.  Backend trả về một danh sách các địa điểm khớp với tìm kiếm. **Quan trọng:** Dữ liệu trả về lần này **phải bao gồm `latitude` và `longitude`**.
4.  Frontend nhận danh sách JSON.
5.  Frontend lặp qua từng đối tượng trong danh sách, lấy `latitude` và `longitude` để tạo một marker (ghim) và đặt nó lên bản đồ.
6.  Đồng thời, Frontend cũng dùng danh sách này để hiển thị list kết quả bên cạnh bản đồ.

#### **Response Body (200 OK) - Cần thêm tọa độ:**
```json
{
  "data": [
    {
      "id": "uuid-cua-dia-diem",
      "name": "Bảo tàng Chứng tích Chiến tranh",
      "slug": "bao-tang-chung-tich-chien-tranh",
      "district": "Quận 3",
      "cover_image_url": "...",
      "average_rating": 4.7,
      "latitude": 10.7793,
      "longitude": 106.6925
    }
  ],
  // ... pagination info
}
```

---

### **3. API cho Chức năng Sửa/Xóa Địa điểm (ND-002)**

Đây là các API dành riêng cho Admin, yêu cầu xác thực chặt chẽ.

#### **API Contract:**

*   **`PUT /api/admin/places/{id}` - Sửa thông tin địa điểm**
    *   **Xác thực:** Yêu cầu JWT Token với `role: ADMIN`.
    *   **Mục đích:** Cập nhật toàn bộ thông tin cho một địa điểm đã có, dựa vào `id` của nó.
    *   **Request Body:** Gửi lên một đối tượng JSON chứa tất cả các trường có thể sửa đổi.
        ```json
        {
          "name": "Tên địa điểm đã cập nhật",
          "description": "Mô tả mới...",
          "address_text": "Địa chỉ mới...",
          "district": "Quận mới",
          "latitude": 10.123456,
          "longitude": 106.654321,
          "cover_image_url": "...",
          "is_featured": true
        }
        ```
    *   **Response (200 OK):** Trả về đối tượng địa điểm đã được cập nhật.

*   **`DELETE /api/admin/places/{id}` - Xóa (Ẩn) địa điểm**
    *   **Xác thực:** Yêu cầu JWT Token với `role: ADMIN`.
    *   **Mục đích:** Thực hiện "soft delete" - ẩn một địa điểm khỏi trang web công khai nhưng không xóa vĩnh viễn khỏi database.
    *   **Mô tả hoạt động:**
        1.  Admin bấm nút xóa trên giao diện.
        2.  Frontend gửi request `DELETE` đến endpoint này với `id` của địa điểm.
        3.  Backend nhận request, tìm địa điểm tương ứng và cập nhật một trường trong database (ví dụ: `status = 'inactive'` hoặc `is_active = false`).
        4.  Backend KHÔNG xóa dòng dữ liệu đó.
    *   **Response (204 No Content):** Trả về mã trạng thái 204 để báo hiệu đã xóa thành công mà không cần gửi kèm nội dung.