-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "address_text" VARCHAR(255),
    "district" VARCHAR(100),
    "city" VARCHAR(100) NOT NULL DEFAULT 'TP. Hồ Chí Minh',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(10,6),
    "cover_image_url" VARCHAR(255),
    "opening_hours" VARCHAR(100),
    "price_info" VARCHAR(100),
    "contact_info" VARCHAR(100),
    "tips_notes" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_images" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "caption" VARCHAR(255),

    CONSTRAINT "place_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "places_slug_key" ON "places"("slug");

-- AddForeignKey
ALTER TABLE "place_images" ADD CONSTRAINT "place_images_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
