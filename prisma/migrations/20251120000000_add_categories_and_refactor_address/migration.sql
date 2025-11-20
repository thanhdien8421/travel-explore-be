-- AlterTable - Refactor address structure in places
ALTER TABLE "places" 
  DROP COLUMN IF EXISTS "address_text",
  DROP COLUMN IF EXISTS "category",
  DROP COLUMN IF EXISTS "city",
  ADD COLUMN "street_address" VARCHAR(255),
  ADD COLUMN "ward" VARCHAR(100) NOT NULL DEFAULT 'Phường/Xã',
  ADD COLUMN "location_description" TEXT,
  ADD COLUMN "full_address_generated" TEXT,
  ADD COLUMN "province_city" VARCHAR(100) NOT NULL DEFAULT 'TP. Hồ Chí Minh',
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
  ALTER COLUMN "district" DROP NOT NULL;

-- CreateTable - Categories
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable - PlaceCategory (Junction table for Many-to-Many)
CREATE TABLE "place_categories" (
    "place_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "place_categories_pkey" PRIMARY KEY ("place_id", "category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- AddForeignKey
ALTER TABLE "place_categories" ADD CONSTRAINT "place_categories_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "place_categories" ADD CONSTRAINT "place_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
