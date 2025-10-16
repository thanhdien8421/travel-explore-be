-- Drop table if exists (for fresh start)
DROP TABLE IF EXISTS "Location";

-- Create Location table
CREATE TABLE "Location" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    image VARCHAR(500) NOT NULL,
    rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample Ho Chi Minh City locations
INSERT INTO "Location" (name, description, location, image, rating) VALUES
('Chợ Bến Thành', 'Ngôi chợ lâu đời ở Sài Gòn. Phù hợp với trải nghiệm ẩm thực địa phương và quà lưu niệm.', 'Quận 1, TP. Hồ Chí Minh', '/images/ben-thanh-market.jpg', 4.5),
('Địa đạo Củ Chi', 'Hệ thống địa đạo rộng lớn được xây dựng trong các cuộc kháng chiến chống Pháp và chống Mỹ.', 'Huyện Củ Chi, TP. Hồ Chí Minh', '/images/cu-chi-tunnels.jpg', 4.7),
('Nhà thờ Đức Bà Sài Gòn', 'Một trong những nhà thờ cổ nhất ở Sài Gòn, với kiến trúc Pháp cổ kính và uy nghi.', 'Quận 1, TP. Hồ Chí Minh', '/images/notre-dame-basilica.jpg', 4.3),
('Bảo tàng chứng tích chiến tranh', 'Bảo tàng trưng bày những hiện vật, tư liệu về những sự kiện trong hai cuộc kháng chiến chống Pháp và chống Mỹ.', 'Quận 3, TP. Hồ Chí Minh', '/images/war-remnants-museum.jpg', 4.4),
('Chùa Ngọc Hoàng', 'Một ngôi đền của người Hoa ở Sài Gòn với kiến trúc truyền thống và văn hóa đặc sắc.', 'Quận 1, TP. Hồ Chí Minh', '/images/jade-emperor-pagoda.jpg', 4.6),
('Côn Đảo', 'Quần đảo hoang sơ nằm ở phía nam thành phố, với phong cảnh thiên nhiên hùng vĩ và những bãi cát trắng đầy nắng.', 'Phía Nam TP. Hồ Chí Minh', '/images/con-dao.jpg', 4.8);