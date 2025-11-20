-- Categories UUIDs
-- c79d95d6-add8-4957-92e4-57bbd9bf6a6f = Nhà hàng - Quán ăn
-- 304e7e8f-f87a-4431-a044-9edb489a31a7 = Quán cà phê
-- 1cb34489-b861-4d89-8af9-8fff962631eb = Bar/Pub
-- eeecf279-9029-4e9a-a0b4-9be91474db98 = Địa danh - Di tích
-- 8eae64be-da91-4eda-9ac8-a3fea0b7d375 = Bảo tàng - Triển lãm
-- 80f35840-a58f-4b0a-8638-3a120ad43898 = Thiên nhiên - Không gian xanh
-- 001deb93-b529-4be8-9112-9a1a22ea91a4 = Mua sắm
-- f5a2bc5b-ef4e-4f81-af64-1e16070aee9f = Giải trí - Sáng tạo

-- Insert place_categories mappings
INSERT INTO place_categories (place_id, category_id) VALUES
-- Dinh Độc Lập -> Địa danh - Di tích
('d9bfde1b-13c8-4a62-adbc-2b375596ffa5', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Bảo tàng Chứng tích Chiến tranh -> Bảo tàng - Triển lãm + Địa danh - Di tích
('63c3fa8a-a6af-4637-817c-d832e7e08419', '8eae64be-da91-4eda-9ac8-a3fea0b7d375'),
('63c3fa8a-a6af-4637-817c-d832e7e08419', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Nhà thờ Đức Bà Sài Gòn -> Địa danh - Di tích
('f3611fdc-a87f-49c6-b754-c5c66cc7ab6a', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Bưu điện Trung tâm Sài Gòn -> Địa danh - Di tích
('48fc8d72-240c-4e02-b934-339ee5d0eb9c', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Nhà hát Lớn Sài Gòn -> Giải trí - Sáng tạo + Địa danh - Di tích
('7de92ac0-2aec-437c-bbd6-3fc59e98fa69', 'f5a2bc5b-ef4e-4f81-af64-1e16070aee9f'),
('7de92ac0-2aec-437c-bbd6-3fc59e98fa69', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Chùa Ngọc Hoàng -> Địa danh - Di tích
('047f3a57-c219-4afe-818c-ba498c521dfe', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Chợ Bến Thành -> Mua sắm + Địa danh - Di tích
('5a1b18f7-d613-4360-8d01-8f237b79d070', '001deb93-b529-4be8-9112-9a1a22ea91a4'),
('5a1b18f7-d613-4360-8d01-8f237b79d070', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Chợ Lớn (Chợ Bình Tây) -> Mua sắm
('d75b2091-bfb5-4507-9a9f-2d2250073360', '001deb93-b529-4be8-9112-9a1a22ea91a4'),

-- Phố đi bộ Nguyễn Huệ -> Giải trí - Sáng tạo
('b09c24c9-4def-4f7c-ae7f-fc878d225d73', 'f5a2bc5b-ef4e-4f81-af64-1e16070aee9f'),

-- Phố Tây Bùi Viện -> Nhà hàng - Quán ăn + Giải trí - Sáng tạo
('e9b6626f-a4c7-4795-ad5e-535e362f3e11', 'c79d95d6-add8-4957-92e4-57bbd9bf6a6f'),
('e9b6626f-a4c7-4795-ad5e-535e362f3e11', 'f5a2bc5b-ef4e-4f81-af64-1e16070aee9f'),

-- Thảo Cầm Viên Sài Gòn -> Thiên nhiên - Không gian xanh
('e7e35001-2964-435a-ba06-00b6288a5652', '80f35840-a58f-4b0a-8638-3a120ad43898'),

-- Tòa nhà Bitexco Financial Tower -> Giải trí - Sáng tạo + Địa danh - Di tích
('be846a4b-3aaa-449f-8185-f28ec5fa3484', 'f5a2bc5b-ef4e-4f81-af64-1e16070aee9f'),
('be846a4b-3aaa-449f-8185-f28ec5fa3484', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Landmark 81 -> Giải trí - Sáng tạo
('afe32382-474b-4431-b9ea-ec1a9c0ae4b7', 'f5a2bc5b-ef4e-4f81-af64-1e16070aee9f'),

-- Hồ Con Rùa -> Thiên nhiên - Không gian xanh
('04d27b3f-51a8-4322-aac5-04bbeea27a03', '80f35840-a58f-4b0a-8638-3a120ad43898'),

-- Bảo tàng Mỹ thuật TP.HCM -> Bảo tàng - Triển lãm
('77d36794-cb1a-49b4-8d1d-f6c9e45cc59f', '8eae64be-da91-4eda-9ac8-a3fea0b7d375'),

-- Bảo tàng Lịch sử Việt Nam -> Bảo tàng - Triển lãm + Địa danh - Di tích
('7b0fd63d-7e7e-4274-9be8-6e0355114066', '8eae64be-da91-4eda-9ac8-a3fea0b7d375'),
('7b0fd63d-7e7e-4274-9be8-6e0355114066', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Tòa nhà Ủy ban Nhân dân TP.HCM -> Địa danh - Di tích
('b5a1b73a-b225-4097-aa2a-313b1564468f', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Chùa Bửu Long -> Địa danh - Di tích
('777a1750-d7a5-4ece-9b12-68f49b207980', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Địa đạo Củ Chi -> Địa danh - Di tích
('34c6b29b-f0ff-48b9-b22a-22d4b43bd18d', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- Công viên Văn hóa Suối Tiên -> Giải trí - Sáng tạo + Thiên nhiên - Không gian xanh
('7c294b7c-fa28-45ed-a6ff-6bc792fc1059', 'f5a2bc5b-ef4e-4f81-af64-1e16070aee9f'),
('7c294b7c-fa28-45ed-a6ff-6bc792fc1059', '80f35840-a58f-4b0a-8638-3a120ad43898'),

-- Hẻm Hào Sĩ Phường -> Nhà hàng - Quán ăn + Mua sắm
('af944a1e-2d34-4a3e-99ba-b2d6b1a220e9', 'c79d95d6-add8-4957-92e4-57bbd9bf6a6f'),
('af944a1e-2d34-4a3e-99ba-b2d6b1a220e9', '001deb93-b529-4be8-9112-9a1a22ea91a4'),

-- Bảo tàng Y học Cổ truyền Việt Nam (FITO Museum) -> Bảo tàng - Triển lãm
('c4f66f92-67f1-4d57-9977-57e84b3a6a5b', '8eae64be-da91-4eda-9ac8-a3fea0b7d375'),

-- Bảo tàng Biệt Động Sài Gòn -> Bảo tàng - Triển lãm + Địa danh - Di tích
('576253a9-941f-481a-92cc-f891e7c1a561', '8eae64be-da91-4eda-9ac8-a3fea0b7d375'),
('576253a9-941f-481a-92cc-f891e7c1a561', 'eeecf279-9029-4e9a-a0b4-9be91474db98'),

-- The Factory Contemporary Arts Centre -> Giải trí - Sáng tạo + Bảo tàng - Triển lãm
('758b3408-e81a-4d12-b970-2ef676f1d166', 'f5a2bc5b-ef4e-4f81-af64-1e16070aee9f'),
('758b3408-e81a-4d12-b970-2ef676f1d166', '8eae64be-da91-4eda-9ac8-a3fea0b7d375'),

-- Khu dự trữ sinh quyển rừng ngập mặn Cần Giờ -> Thiên nhiên - Không gian xanh
('452b9ff5-8521-4c67-9488-ac91bc1cc95c', '80f35840-a58f-4b0a-8638-3a120ad43898'),

-- Đầm sen Tam Đa -> Thiên nhiên - Không gian xanh + Giải trí - Sáng tạo
('372c25f2-b28a-41be-bc23-f25744f1df30', '80f35840-a58f-4b0a-8638-3a120ad43898'),
('372c25f2-b28a-41be-bc23-f25744f1df30', 'f5a2bc5b-ef4e-4f81-af64-1e16070aee9f'),

-- Bãi Sau Vũng Tàu -> Thiên nhiên - Không gian xanh
('185d0af8-75b7-497b-90c6-fa62c8fd35cf', '80f35840-a58f-4b0a-8638-3a120ad43898');
