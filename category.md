Vấn đề cần sửa 1:

 **Một địa điểm nên có khả năng nằm trong NHIỀU category.**

Việc cho phép một địa điểm thuộc về nhiều danh mục sẽ giúp sản phẩm của bạn trở nên **linh hoạt, mạnh mẽ và phản ánh đúng thực tế hơn rất nhiều.**

---

### **Tại sao nên chọn "Nhiều Category"?**

Hãy xem xét một ví dụ thực tế: **"Nhà sách Cá Chép"** ở TP. HCM.
*   Nó là một **"Hiệu sách"**.
*   Nó có một không gian **"Quán cà phê"** rất đẹp ở tầng trên.
*   Nó cũng thường tổ chức các **"Sự kiện/Workshop"** văn hóa.

Nếu bạn chỉ cho phép địa điểm này thuộc 1 category duy nhất, bạn sẽ rơi vào thế khó:
*   Nếu chọn "Hiệu sách", người dùng tìm kiếm "quán cafe yên tĩnh" sẽ bỏ lỡ nó.
*   Nếu chọn "Quán cà phê", người dùng tìm "hiệu sách độc đáo" sẽ không thấy nó.

Bằng cách cho phép nó thuộc cả 3 category trên, bạn đã tối đa hóa khả năng khám phá cho người dùng và mô tả địa điểm một cách chính xác nhất.

---

### **Vậy việc này sẽ ảnh hưởng đến Thiết kế Kỹ thuật như thế nào?**

Đây là một thay đổi quan trọng và cần được team Backend xử lý cẩn thận.

#### **1. Thay đổi về Cấu trúc Cơ sở dữ liệu (Database)**

Chúng ta không thể dùng một cột `category` (kiểu ENUM hoặc VARCHAR) trong bảng `places` được nữa. Thay vào đó, chúng ta sẽ áp dụng một cấu trúc quan hệ **Nhiều-Nhiều (Many-to-Many)**.

*   **Tạo một bảng mới: `categories`**
    *   `id` (UUID, Primary Key)
    *   `name` (VARCHAR(100), UNIQUE, NOT NULL) - Ví dụ: "Quán cà phê", "Nhà hàng", "Bảo tàng", "Điểm tham quan"...
    *   `slug` (VARCHAR(100), UNIQUE, NOT NULL) - Ví dụ: "quan-ca-phe", "nha-hang"...

*   **Tạo một bảng trung gian mới: `place_categories` (Bảng nối)**
    *   `place_id` (UUID, Foreign Key trỏ tới `places.id`)
    *   `category_id` (UUID, Foreign Key trỏ tới `categories.id`)
    *   **Primary Key:** Sẽ là cặp `(place_id, category_id)` để đảm bảo một địa điểm không bị gán vào cùng một category hai lần.

*   **Xóa cột `category` khỏi bảng `places`.**

#### **2. Thay đổi về API Contract**

*   **Endpoint Lấy chi tiết địa điểm (`GET /api/places/{slug}`):**
    *   Response Body cần được cập nhật để trả về một **mảng các đối tượng category**.
    ```json
    {
      "id": "...",
      "name": "Nhà sách Cá Chép",
      // ... các trường khác
      "categories": [
        { "id": "uuid-1", "name": "Hiệu sách", "slug": "hieu-sach" },
        { "id": "uuid-2", "name": "Quán cà phê", "slug": "quan-ca-phe" },
        { "id": "uuid-3", "name": "Sự kiện", "slug": "su-kien" }
      ]
    }
    ```

*   **Endpoint Lọc (`GET /api/places`):**
    *   Tham số truy vấn `?category=` vẫn có thể giữ nguyên (nhận nhiều giá trị cách nhau bởi dấu phẩy).
    *   Logic của Backend sẽ phải phức tạp hơn: thay vì `WHERE category IN (...)`, nó sẽ phải thực hiện một phép `JOIN` qua 3 bảng `places`, `place_categories`, và `categories` để lọc.

*   **Endpoint Tạo/Sửa địa điểm của Admin (`POST`, `PUT`):**
    *   Request Body giờ đây cần nhận vào một **mảng các `category_id`**.
    ```json
    {
      "name": "Nhà sách Cá Chép",
      // ... các trường khác
      "categoryIds": ["uuid-1", "uuid-2", "uuid-3"] 
    }
    ```
    *   Backend sẽ xử lý logic để thêm/xóa các bản ghi tương ứng trong bảng nối `place_categories`.


Vấn đề cần sửa 2:

Cảm ơn bạn đã làm rõ và kiên quyết cập nhật thông tin này. Bạn hoàn toàn đúng, và đây là một ví dụ tuyệt vời về việc một dự án phần mềm phải đối mặt và thích ứng với những thay đổi trong thế giới thực. Việc tôi ở ngoài và dựa trên cấu trúc chung có thể không nắm bắt được những thay đổi mang tính thời sự và có lộ trình như vậy.

Việc bạn chọn OpenStreetMap API chính là một quyết định rất sáng suốt, vì nó là một trong những nền tảng cập nhật nhanh nhất với các thay đổi này.

Vậy, vấn đề của chúng ta bây giờ là: **Làm thế nào để thiết kế một hệ thống linh hoạt, có thể xử lý được tình trạng "quá độ" - nơi một số địa chỉ có cấp huyện/quận và một số khác thì không?**

Đây là một bài toán thiết kế rất hay. Chúng ta sẽ giải quyết nó bằng một chiến lược **"Linh hoạt và Ưu tiên Tọa độ"**.

---

### **Giải pháp chiến lược: Thiết kế lại để thích ứng**

Chúng ta sẽ không cố gắng ép buộc mọi địa chỉ phải theo một khuôn mẫu cũ. Thay vào đó, chúng ta sẽ làm cho hệ thống "thông minh" hơn.

#### **1. Thay đổi về Cấu trúc Cơ sở dữ liệu (Database) - Cực kỳ quan trọng**

Đây là thay đổi nền tảng nhất.

*   **Bảng `places`:**
    *   **`district` (VARCHAR):** Giữ lại cột này, nhưng chuyển nó thành **`NULLABLE` (có thể để trống)**. Đây là chìa khóa. Nó cho phép các địa điểm không có thông tin quận/huyện vẫn được lưu trữ hợp lệ.
    *   **Thêm cột mới `full_address` (TEXT, NOT NULL):** Đây sẽ là nơi lưu trữ chuỗi địa chỉ đầy đủ, **đúng như những gì API OpenStreetMap trả về**. Đây sẽ là "nguồn chân lý" về mặt hiển thị văn bản cho người dùng.

*   **Tọa độ là Vua (`latitude`, `longitude`):** Hai cột này trở nên quan trọng hơn bao giờ hết. Chúng là định danh vị trí **duy nhất và không thay đổi**, bất kể đơn vị hành chính thay đổi như thế nào.

#### **2. Thay đổi về Logic Backend (BE)**

*   **Khi tạo/sửa địa điểm (`POST`, `PUT`):**
    *   Logic gọi API OpenStreetMap giờ sẽ trở nên thông minh hơn.
    *   **Bước 1:** Lấy về đối tượng JSON kết quả từ API.
    *   **Bước 2:** **Luôn luôn** lấy chuỗi địa chỉ đã được định dạng đẹp nhất (thường là trường `display_name`) và lưu vào cột `full_address` của bạn.
    *   **Bước 3:** **Kiểm tra xem** trong đối tượng JSON trả về có tồn tại các khóa như `county` (huyện) hoặc `city_district` (quận) hay không.
        *   Nếu **CÓ**, lấy giá trị đó lưu vào cột `district`.
        *   Nếu **KHÔNG CÓ**, lưu giá trị `NULL` vào cột `district`.
    *   **Bước 4:** Luôn luôn lấy `lat` và `lon` lưu vào `latitude` và `longitude`.

#### **3. Thay đổi về Giao diện và Trải nghiệm người dùng (FE)**

Đây là nơi chúng ta quản lý sự thay đổi này một cách mượt mà nhất cho người dùng.

*   **Bộ lọc theo Khu vực (`TK-004`):**
    *   **Giữ lại bộ lọc theo Quận/Huyện.** Tại thời điểm này, phần lớn dữ liệu của TP.HCM vẫn sẽ có thông tin này.
    *   **Cách làm thông minh:** Danh sách các quận/huyện trong bộ lọc nên được **tạo ra một cách tự động** từ những giá trị `district` đang có trong database của bạn, thay vì hard-code.
    *   **Bổ sung:** Thêm một lựa chọn "Khu vực khác" vào bộ lọc để bao gồm các địa điểm có `district` là `NULL`.

*   **Hiển thị thông tin địa chỉ trên UI (Thẻ địa điểm, trang chi tiết):**
    *   Logic hiển thị sẽ là:
        *   **Luôn luôn hiển thị `full_address`** làm địa chỉ chính.
        *   Đối với thông tin tóm tắt (như trên thẻ), bạn có thể hiển thị `district` **nếu nó tồn tại**. Nếu không, có thể bỏ qua hoặc hiển thị một phần của `full_address`.

*   **Tìm kiếm trên Bản đồ (`TK-005` nâng cao):**
    *   Tính năng này **không bị ảnh hưởng và trở nên quan trọng hơn**. Vì nó hoạt động dựa trên tọa độ (`latitude`, `longitude`), nó hoàn toàn không phụ thuộc vào việc tên gọi các đơn vị hành chính thay đổi như thế nào.

---

Bạn đã phân tích vấn đề rất chính xác và sâu sắc. Việc nhận ra `full_address` từ API không đủ đẹp và **ưu tiên dữ liệu nhập tay chất lượng cao** là một quyết định đúng đắn về mặt sản phẩm.

Chúng ta sẽ thiết kế lại hệ thống theo hướng **"Hybrid" (Lai)**: Tận dụng sức mạnh của API để lấy tọa độ, nhưng trao toàn quyền kiểm soát dữ liệu hiển thị cho người quản trị.

Đây là giải pháp chi tiết để giải quyết vấn đề này một cách triệt để.

---

### **Giải pháp chiến lược: "Geocoding-First, Manual-Entry-Priority"**

**Ý tưởng:** Coi API bản đồ là công cụ để **lấy tọa độ (Geocoding)** chứ không phải là nguồn cung cấp dữ liệu văn bản cuối cùng. Dữ liệu văn bản sẽ được nhập tay vào các trường có cấu trúc.

#### **1. Thay đổi Cấu trúc Cơ sở dữ liệu (Database) - Nền tảng**

Chúng ta sẽ cấu trúc lại bảng `places` để phản ánh đúng thực tế và ưu tiên dữ liệu sạch.

*   **Bảng `places`:**
    *   **Xóa cột `address_text` cũ.**
    *   **Thêm các cột có cấu trúc:**
        *   `street_address` (VARCHAR): Lưu số nhà và tên đường. Ví dụ: "73 Mai Thị Lựu". **(Bắt buộc)**
        *   `ward` (VARCHAR): Lưu tên Phường/Xã. Ví dụ: "Phường Đa Kao". **(Bắt buộc, đây là cột thay thế vai trò chính của `district` cũ)**
        *   `district` (VARCHAR): Lưu tên Quận/Huyện/Thành phố thuộc tỉnh. Ví dụ: "Quận 1". **(Có thể để trống - `NULLABLE`)**
        *   `city` (VARCHAR): Lưu Tỉnh/Thành phố trực thuộc TW. Ví dụ: "TP. Hồ Chí Minh". **(Bắt buộc)**
    *   **Thêm cột `full_address_generated` (TEXT):** Cột này sẽ **không do người dùng nhập**, mà do hệ thống tự động ghép lại từ các trường có cấu trúc ở trên để phục vụ việc hiển thị nhanh.
    *   **Giữ nguyên `latitude` và `longitude`:** Vẫn là hai cột quan trọng nhất.

#### **2. Luồng công việc mới cho Admin khi Tạo/Sửa Địa điểm**

Đây là sự thay đổi lớn nhất về quy trình, giúp đảm bảo dữ liệu chất lượng cao.

*   **Bước 1: Lấy Tọa độ Tự động (Geocoding)**
    *   Trên form của Admin, sẽ chỉ có một ô nhập liệu ban đầu: "Nhập địa chỉ để tìm kiếm tọa độ" (ví dụ: "Chùa Ngọc Hoàng, Mai Thị Lựu").
    *   Bên cạnh có một nút **"Tìm trên bản đồ"**.
    *   Khi Admin bấm nút, Frontend sẽ gọi API OpenStreetMap để lấy về `lat` và `lon`. Sau đó, ghim một marker lên một bản đồ nhỏ để Admin xác nhận vị trí có đúng không.

*   **Bước 2: Nhập liệu chi tiết bằng tay**
    *   Sau khi tọa độ đã được xác định, các ô nhập liệu chi tiết sẽ hiện ra:
        *   **Số nhà, tên đường:** `[____________]`
        *   **Phường / Xã:** `[____________]`
        *   **Quận / Huyện (nếu có):** `[____________]`
        *   **Tỉnh / Thành phố:** `[____________]`
    *   Admin sẽ điền thông tin **đẹp và chính xác nhất** vào các ô này. Họ có thể tham khảo từ kết quả OpenStreetMap nhưng sẽ tự quyết định văn bản cuối cùng.

*   **Bước 3: Lưu trữ**
    *   Khi Admin bấm "Lưu", Frontend sẽ gửi tất cả các trường có cấu trúc này (`street_address`, `ward`, `district`, `city`) cùng với `latitude`, `longitude` lên cho Backend.
    *   Backend nhận dữ liệu, lưu vào các cột tương ứng. Đồng thời, Backend sẽ tự động ghép các chuỗi này lại để tạo ra `full_address_generated` (ví dụ: "73 Mai Thị Lựu, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh").

#### **3. Tác động đến API Contract**

*   **Endpoint Tạo/Sửa của Admin (`POST`, `PUT`):**
    *   Request Body sẽ nhận vào các trường có cấu trúc:
    ```json
    {
      "name": "Chùa Ngọc Hoàng",
      "description": "...",
      "street_address": "73 Mai Thị Lựu",
      "ward": "Phường Đa Kao",
      "district": "Quận 1",
      "city": "TP. Hồ Chí Minh",
      "latitude": 10.7895,
      "longitude": 106.6987,
      "categoryIds": ["..."]
    }
    ```

*   **Endpoint Lọc (`GET /api/places`):**
    *   Tham số truy vấn `?district=` sẽ được đổi thành **`?ward=`** để trở thành bộ lọc chính.
    *   Vẫn có thể giữ lại `?district=` làm bộ lọc phụ.
    *   Backend sẽ thực hiện `WHERE ward IN (...)` hoặc `WHERE district IN (...)`.

*   **Endpoint Lấy chi tiết (`GET /api/places/{slug}`):**
    *   Response Body sẽ trả về các trường địa chỉ có cấu trúc để Frontend có thể hiển thị linh hoạt.

#### **4. Tác động đến Giao diện Người dùng (FE)**

*   **Bộ lọc (`TK-004`):**
    *   Bộ lọc chính nên được thay đổi từ "Quận/Huyện" thành **"Phường/Xã"** để có độ chi tiết cao hơn.
    *   Vẫn có thể có một bộ lọc cấp cao hơn là "Quận/Huyện". Danh sách các phường/xã và quận/huyện này nên được Backend cung cấp qua một API riêng để Frontend không phải hard-code.

---

### **Hành động cụ thể:**

1.  **PO (Bạn):** Phê duyệt thiết kế "Hybrid" này, ưu tiên dữ liệu sạch do người dùng nhập.
2.  **BA (Hiệp):** Cập nhật lại toàn bộ tài liệu:
    *   **ERD:** Vẽ lại cấu trúc mới của bảng `places`.
    *   **API Contract:** Viết lại các request/response cho các endpoint liên quan đến địa chỉ.
    *   **Wireframes/User Flow:** Thiết kế lại luồng tạo địa điểm của Admin với 2 bước (Tìm tọa độ -> Nhập liệu chi tiết).
3.  **Team BE:**
    *   Viết migration script để thay đổi cấu trúc bảng `places`.
    *   Cập nhật logic API để xử lý các trường địa chỉ mới.
4.  **Team FE:**
    *   Thiết kế lại Form của Admin.
    *   Thiết kế lại Bộ lọc cho trang khám phá.

Giải pháp này giải quyết được tất cả các vấn đề bạn đã nêu: thừa nhận sự thay đổi hành chính, không phụ thuộc vào dữ liệu "xấu" của API, và trao quyền kiểm soát chất lượng dữ liệu cho người quản trị.

Bạn đã đưa ra một trường hợp rất xác đáng. Các địa điểm tự nhiên như bãi biển, khu du lịch sinh thái, di tích trong rừng... hoàn toàn không có địa chỉ số nhà và tên đường.

Hệ thống của chúng ta phải đủ linh hoạt để xử lý cả hai trường hợp: địa chỉ đô thị có cấu trúc và địa chỉ tự nhiên, phi cấu trúc.

Cảm ơn bạn đã chỉ ra điểm này. Chúng ta sẽ điều chỉnh lại thiết kế để giải quyết nó một cách triệt để.

---

### **Giải pháp cập nhật: Cấu trúc linh hoạt hơn**

Chúng ta sẽ giữ lại ý tưởng "Geocoding-First, Manual-Entry-Priority", nhưng làm cho phần nhập liệu bằng tay trở nên linh hoạt hơn.

#### **1. Thay đổi (nhỏ) trong Cấu trúc Cơ sở dữ liệu**

*   **Bảng `places`:**
    *   `street_address` (VARCHAR): Chuyển cột này thành **`NULLABLE` (có thể để trống)**. Đây là thay đổi quan trọng nhất.
    *   `ward` (VARCHAR): Vẫn là **`NOT NULL` (bắt buộc)**.
    *   `district` (VARCHAR): Vẫn là `NULLABLE`.
    *   `city` (VARCHAR): **Đổi tên thành `province_city`** để bao괄 cả Tỉnh và Thành phố. Vẫn là **`NOT NULL`**.
    *   `full_address_generated` (TEXT): Giữ nguyên.

#### **2. Luồng công việc cập nhật cho Admin**

*   **Bước 1: Lấy Tọa độ Tự động (Không đổi)**
    *   Admin vẫn tìm kiếm theo tên chung hoặc tọa độ để ghim marker lên bản đồ.

*   **Bước 2: Nhập liệu chi tiết bằng tay (Linh hoạt hơn)**
    *   Các ô nhập liệu sẽ được thiết kế lại để thể hiện sự bắt buộc và không bắt buộc.
        *   **Số nhà, tên đường:** `[____________]` *(Không bắt buộc)*
        *   **Phường / Xã:** `[____________]` **\*** *(Bắt buộc)*
        *   **Quận / Huyện / Thành phố thuộc tỉnh:** `[____________]` *(Không bắt buộc)*
        *   **Tỉnh / Thành phố:** `[____________]` **\*** *(Bắt buộc, đổi tên thành Tỉnh/Thành phố)*
    *   **Thêm một ô Mô tả Vị trí:**
        *   **Mô tả vị trí (Location Description):** `[_________________________]` *(Không bắt buộc)*
            *   **Mục đích:** Đây là ô cực kỳ quan trọng để Admin có thể mô tả vị trí một cách tự nhiên cho những nơi không có địa chỉ.
            *   **Ví dụ:** "Nằm trong khu du lịch sinh thái Cần Giờ", "Bãi biển phía Đông của Vũng Tàu", "Cách trung tâm thành phố 5km về phía Bắc".

*   **Bước 3: Lưu trữ (Logic Backend thông minh hơn)**
    *   Backend nhận tất cả các trường.
    *   Khi tạo `full_address_generated`, logic sẽ là:
        *   Nếu `street_address` tồn tại, ghép lại theo thứ tự: `street_address, ward, district, province_city`.
        *   Nếu `street_address` **không** tồn tại, ghép lại theo thứ tự: `location_description, ward, district, province_city`.
        *   Logic này đảm bảo chuỗi địa chỉ đầy đủ luôn có ý nghĩa.

#### **3. Tác động đến API Contract**

*   **Endpoint Tạo/Sửa của Admin (`POST`, `PUT`):**
    *   Request Body sẽ có thêm trường `location_description` và các trường bắt buộc/không bắt buộc sẽ được định nghĩa rõ.
    ```json
    {
      "name": "Bãi Sau Vũng Tàu",
      "description": "...",
      "street_address": null,  // hoặc không gửi trường này
      "location_description": "Trải dài từ chân Núi Nhỏ đến Cửa Lấp",
      "ward": "Phường Thắng Tam",
      "district": null,
      "province_city": "TP. Vũng Tàu",
      "latitude": 10.33,
      "longitude": 107.09,
      "categoryIds": ["..."]
    }
    ```

---

### **Tổng kết lại giải pháp cuối cùng:**

1.  **Ưu tiên tọa độ:** Luôn lấy `lat`/`lon` từ API bản đồ làm định danh vị trí chính.
2.  **Nhập tay có cấu trúc:**
    *   Bắt buộc nhập **Phường/Xã** và **Tỉnh/Thành phố** để có một neo vị trí hành chính tối thiểu.
    *   Cho phép để trống **Số nhà/Đường** và **Quận/Huyện**.
3.  **Thêm trường "Mô tả Vị trí":** Dùng cho các địa điểm tự nhiên, phi cấu trúc.
4.  **Hệ thống tự tạo địa chỉ đầy đủ:** Backend sẽ tự động ghép các mảnh thông tin lại thành một chuỗi địa chỉ hoàn chỉnh, có ý nghĩa để hiển thị cho người dùng.

Giải pháp này đạt được sự cân bằng hoàn hảo giữa việc có dữ liệu cấu trúc (để lọc) và sự linh hoạt để mô tả chính xác mọi loại địa điểm. Nó giải quyết triệt để vấn đề bạn đã nêu.


--Bổ sung thông tin về category-- 

Chúng ta cần một hệ thống vừa đủ chi tiết để hữu ích, vừa đủ tổng quát để không gây rối.

Dưới đây là một chiến lược toàn diện, bao gồm danh sách gợi ý và cách triển khai kỹ thuật.
1. Nguyên tắc thiết kế hệ thống Category

    Lấy người dùng làm trung tâm: Các danh mục nên phản ánh cách một du khách suy nghĩ và tìm kiếm (ví dụ: "Ăn gì?", "Chơi ở đâu?", "Mua gì?").

    Cho phép đa danh mục: Như chúng ta đã thống nhất, một địa điểm có thể thuộc nhiều danh mục (ví dụ: một khu tổ hợp vừa là "Quán cà phê", vừa là "Không gian sáng tạo").

    Có khả năng mở rộng: Hệ thống nên dễ dàng thêm/bớt các danh mục trong tương lai mà không cần phải sửa code quá nhiều.

2. Danh sách Category đề xuất (Cho giai đoạn đầu)

Đây là một danh sách khởi đầu được cân bằng, tập trung vào các trải nghiệm mà dự án của bạn hướng tới. Tôi sẽ chia thành các nhóm lớn để dễ hình dung.
Nhóm 1: Ẩm thực & Đồ uống

    Nhà hàng: Các nơi ăn uống có không gian và phục vụ bài bản.

    Quán ăn: Các quán ăn bình dân, đặc sản địa phương.

    Quán cà phê: Bao gồm các quán cafe đa dạng phong cách.

    Bar/Pub: Các địa điểm cho buổi tối.

    Ăn vặt/Đường phố: Nơi tập trung các món ăn vặt, ẩm thực đường phố đặc trưng.

Nhóm 2: Tham quan & Văn hóa

    Điểm tham quan: Các địa danh nổi tiếng, mang tính biểu tượng (ví dụ: Nhà thờ Đức Bà, Bưu điện Thành phố).

    Di tích lịch sử: Các địa điểm mang đậm dấu ấn lịch sử (ví dụ: Dinh Độc Lập, Địa đạo Củ Chi).

    Bảo tàng & Triển lãm: Bao gồm các bảo tàng, phòng trưng bày nghệ thuật.

    Tôn giáo & Tín ngưỡng: Các ngôi chùa, nhà thờ, đền miếu có giá trị kiến trúc hoặc tâm linh.

Nhóm 3: Mua sắm & Giải trí

    Mua sắm: Các cửa hàng thời trang, đồ lưu niệm, cửa hàng đặc sản.

    Chợ địa phương: Các khu chợ truyền thống (ví dụ: Chợ Bến Thành, Chợ Lớn).

    Không gian sáng tạo: Các tổ hợp, phòng tranh, xưởng nghệ thuật, rạp phim độc lập.

Nhóm 4: Trải nghiệm & Thư giãn

    Công viên & Không gian xanh: Các công viên, khu vực công cộng để thư giãn.

    Làng nghề truyền thống: Các địa điểm làm gốm, sơn mài, v.v. (nếu có).

    Trải nghiệm & Workshop: Các lớp học nấu ăn, làm đồ thủ công...

3. Cách triển khai kỹ thuật (Quan trọng)

Để quản lý danh sách này một cách linh hoạt, team Backend cần triển khai như sau:

    Tạo bảng categories trong Database: Như đã thảo luận, chúng ta cần một bảng riêng để lưu trữ danh sách này (id, name, slug).

-- Bổ sung thông tin về cách hiện thực địa chỉ mới--

Chiến lược: "Địa chỉ Chính & Bí danh"

Ý tưởng cốt lõi: Hệ thống sẽ luôn lưu trữ và hiển thị một địa chỉ chính thức, cập nhật nhất theo cấu trúc. Đồng thời, nó sẽ có một "vùng ký ức" để lưu lại tất cả các tên gọi/địa chỉ cũ, địa chỉ không chính thức, hoặc tên gọi địa phương để phục vụ cho việc tìm kiếm.
1. Thay đổi cuối cùng về Cấu trúc Cơ sở dữ liệu

Đây là cấu trúc được thiết kế để chống lại sự thay đổi.

    Bảng places:

        Các trường địa chỉ chính (Primary Address Fields):

            street_address (VARCHAR, NULLABLE)

            ward (VARCHAR, NOT NULL)

            district (VARCHAR, NULLABLE)

            province_city (VARCHAR, NOT NULL)

            Mục đích của các trường này: Lưu trữ địa chỉ chính thức và hiện hành. Đây là "Chính danh".

        Thêm cột mới cực kỳ quan trọng:

            address_aliases (TEXT, NULLABLE):

                Mục đích: Đây là nơi để lưu tất cả các thông tin địa chỉ cũ, tên gọi khác, hoặc các ghi chú định vị không chính thức. Đây là "Bí danh".

                Ví dụ: "Phường 5 cũ", "Gần chợ X", "Khu vực Chợ Lớn", "Đối diện công viên Y"... Bạn có thể lưu nhiều thông tin cách nhau bởi dấu phẩy.

        latitude, longitude, full_address_generated (Giữ nguyên).

2. Luồng công việc cập nhật cho Admin (Trải nghiệm người nhập liệu)

Form nhập liệu của Admin sẽ được thiết kế để giải quyết chính xác "nỗi đau" này.

    Phần 1: Tìm tọa độ (Không đổi)

        Vẫn là bước tìm kiếm để lấy lat/lon.

    Phần 2: Nhập Địa chỉ CHÍNH THỨC HIỆN TẠI

        Số nhà, tên đường: [____________]

        Phường / Xã: [____________] *

        Tỉnh / Thành phố: [____________] *

        Hướng dẫn cho Admin: "Điền thông tin địa chỉ chính xác nhất theo đơn vị hành chính mới."

    Phần 3: Nhập Địa chỉ CŨ hoặc Tên gọi KHÁC (Quan trọng nhất)

        Sẽ có một ô nhập liệu dạng text lớn với tiêu đề rõ ràng:

        Tên/Địa chỉ cũ hoặc Tên gọi khác (giúp người dùng dễ tìm kiếm):
        [__________________________________________________]

        Hướng dẫn cho Admin: "Nếu địa điểm này từng thuộc phường/quận cũ, hoặc có tên gọi địa phương khác, hãy điền vào đây. Ví dụ: Phường 5 cũ, Gần ngã tư X..."

3. Thay đổi về Logic Backend (Làm cho tìm kiếm "thông minh")

Đây là nơi phép màu xảy ra.

    Khi tìm kiếm (GET /api/places?q=...):

        Logic tìm kiếm của Backend sẽ không chỉ tìm trong cột name của địa điểm.

        Nó sẽ tìm kiếm từ khóa của người dùng trong cả 3 cột: name, full_address_generated, và address_aliases.

    Kết quả:

        Một người dùng lớn tuổi quen với địa chỉ cũ gõ "cafe phường 5 cũ", hệ thống vẫn tìm thấy quán cafe đó vì từ khóa khớp với nội dung trong address_aliases.

        Một người dùng trẻ quen địa chỉ mới gõ "cafe phường Đa Kao", hệ thống cũng tìm thấy vì khớp với full_address_generated.

4. Hiển thị trên Giao diện (Tránh gây hiểu lầm)

    Nguyên tắc: Luôn luôn ưu tiên hiển thị địa chỉ chính thức, hiện hành (lấy từ các trường có cấu trúc).

    Trên trang chi tiết: Bạn có thể có một dòng ghi chú nhỏ: "Tên gọi khác: [nội dung từ address_aliases]" để cung cấp thêm thông tin cho người dùng nếu cần.

Tổng kết lại giải pháp:

    Phân tách rõ ràng: Dữ liệu được chia làm 2 loại: "Chính danh" (địa chỉ hiện tại, có cấu trúc) và "Bí danh" (mọi thứ khác, phi cấu trúc).

    Nhập liệu có hướng dẫn: Form của Admin rõ ràng, cho phép nhập cả hai loại thông tin.

    Tìm kiếm thông minh: Hệ thống tìm kiếm trên cả dữ liệu mới và cũ, giúp mọi người dùng đều có thể tìm thấy thứ họ muốn.

    Hiển thị nhất quán: Giao diện luôn hiển thị địa chỉ mới nhất, tránh gây nhầm lẫn.