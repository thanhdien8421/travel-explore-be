-- AlterTable
ALTER TABLE "places" ALTER COLUMN "ward" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "place_categories_category_id_idx" ON "place_categories"("category_id");

-- CreateIndex
CREATE INDEX "place_images_place_id_idx" ON "place_images"("place_id");

-- CreateIndex
CREATE INDEX "places_name_idx" ON "places"("name");

-- CreateIndex
CREATE INDEX "places_ward_idx" ON "places"("ward");

-- CreateIndex
CREATE INDEX "places_is_active_idx" ON "places"("is_active");

-- CreateIndex
CREATE INDEX "places_created_at_idx" ON "places"("created_at");

-- CreateIndex
CREATE INDEX "places_is_featured_idx" ON "places"("is_featured");

-- CreateIndex
CREATE INDEX "reviews_place_id_idx" ON "reviews"("place_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "user_visits_user_id_idx" ON "user_visits"("user_id");

-- CreateIndex
CREATE INDEX "user_visits_place_id_idx" ON "user_visits"("place_id");
