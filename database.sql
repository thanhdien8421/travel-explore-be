-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public._prisma_migrations (
  id character varying NOT NULL,
  checksum character varying NOT NULL,
  finished_at timestamp with time zone,
  migration_name character varying NOT NULL,
  logs text,
  rolled_back_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0,
  CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.place_images (
  id text NOT NULL,
  place_id text NOT NULL,
  image_url character varying NOT NULL,
  caption character varying,
  CONSTRAINT place_images_pkey PRIMARY KEY (id),
  CONSTRAINT place_images_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id)
);
CREATE TABLE public.places (
  id text NOT NULL,
  name character varying NOT NULL,
  slug character varying NOT NULL,
  description text,
  address_text character varying,
  district character varying,
  city character varying NOT NULL DEFAULT 'TP. Hồ Chí Minh'::character varying,
  latitude numeric,
  longitude numeric,
  cover_image_url character varying,
  opening_hours character varying,
  price_info character varying,
  contact_info character varying,
  tips_notes text,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL,
  average_rating numeric NOT NULL DEFAULT 0.0,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT places_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reviews (
  id text NOT NULL,
  place_id text NOT NULL,
  user_id text NOT NULL,
  rating smallint NOT NULL,
  comment text,
  created_at timestamp with time zone NOT NULL,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_visits (
  id text NOT NULL,
  user_id text NOT NULL,
  place_id text NOT NULL,
  visited_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_visits_pkey PRIMARY KEY (id),
  CONSTRAINT user_visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_visits_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id)
);
CREATE TABLE public.users (
  id text NOT NULL,
  full_name character varying,
  email character varying NOT NULL,
  password_hash character varying NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'USER'::"UserRole",
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- -- Drop table if exists (for fresh start)
-- DROP TABLE IF EXISTS "Location";

-- -- Create Location table
-- CREATE TABLE "Location" (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     description TEXT NOT NULL,
--     location VARCHAR(255) NOT NULL,
--     image VARCHAR(500) NOT NULL,
--     rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Insert sample Ho Chi Minh City locations
-- INSERT INTO "Location" (name, description, location, image, rating) VALUES
-- ('Chợ Bến Thành', 'Ngôi chợ lâu đời ở Sài Gòn. Phù hợp với trải nghiệm ẩm thực địa phương và quà lưu niệm.', 'Quận 1, TP. Hồ Chí Minh', '/images/ben-thanh-market.jpg', 4.5),
-- ('Địa đạo Củ Chi', 'Hệ thống địa đạo rộng lớn được xây dựng trong các cuộc kháng chiến chống Pháp và chống Mỹ.', 'Huyện Củ Chi, TP. Hồ Chí Minh', '/images/cu-chi-tunnels.jpg', 4.7),
-- ('Nhà thờ Đức Bà Sài Gòn', 'Một trong những nhà thờ cổ nhất ở Sài Gòn, với kiến trúc Pháp cổ kính và uy nghi.', 'Quận 1, TP. Hồ Chí Minh', '/images/notre-dame-basilica.jpg', 4.3),
-- ('Bảo tàng chứng tích chiến tranh', 'Bảo tàng trưng bày những hiện vật, tư liệu về những sự kiện trong hai cuộc kháng chiến chống Pháp và chống Mỹ.', 'Quận 3, TP. Hồ Chí Minh', '/images/war-remnants-museum.jpg', 4.4),
-- ('Chùa Ngọc Hoàng', 'Một ngôi đền của người Hoa ở Sài Gòn với kiến trúc truyền thống và văn hóa đặc sắc.', 'Quận 1, TP. Hồ Chí Minh', '/images/jade-emperor-pagoda.jpg', 4.6),
-- ('Côn Đảo', 'Quần đảo hoang sơ nằm ở phía nam thành phố, với phong cảnh thiên nhiên hùng vĩ và những bãi cát trắng đầy nắng.', 'Phía Nam TP. Hồ Chí Minh', '/images/con-dao.jpg', 4.8);