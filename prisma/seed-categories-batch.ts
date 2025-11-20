import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define categories
const CATEGORIES = [
  { name: "Ẩm thực", slug: "am-thuc" },
  { name: "Quán cà phê", slug: "quan-ca-phe" },
  { name: "Bar/Pub", slug: "bar-pub" },
  { name: "Du lịch", slug: "du-lich" },
  { name: "Văn hóa", slug: "van-hoa" },
  { name: "Bảo tàng", slug: "bao-tang" },
  { name: "Mua sắm", slug: "mua-sam" },
  { name: "Công viên", slug: "cong-vien" },
  { name: "Giải trí", slug: "giai-tri" },
  { name: "Giáo dục", slug: "giao-duc" },
  { name: "Thiên nhiên", slug: "thien-nhien" },
  { name: "Lịch sử", slug: "lich-su" },
];

// Map place names to categories
const PLACE_CATEGORY_MAPPING: Record<string, string[]> = {
  "chợ bến thành": ["mua-sam", "du-lich"],
  "chợ lớn": ["mua-sam", "du-lich"],
  "chợ bình tây": ["mua-sam"],
  "chợ tân định": ["mua-sam"],
  "hồ con rùa": ["cong-vien", "du-lich"],
  "công viên lê văn tám": ["cong-vien", "giai-tri"],
  "tao đàn park": ["cong-vien", "giai-tri"],
  "nhà thờ đức bà": ["van-hoa", "du-lich", "lich-su"],
  "dinh độc lập": ["van-hoa", "du-lich", "lich-su"],
  "bảo tàng chiến tranh": ["bao-tang", "giao-duc", "lich-su"],
  "bảo tàng mỹ thuật": ["bao-tang", "giao-duc"],
  "bảo tàng thành phố": ["bao-tang", "giao-duc"],
  "chùa phật giáo": ["van-hoa", "du-lich"],
  "hẻm hoa": ["am-thuc", "mua-sam"],
  "khu ẩm thực": ["am-thuc"],
  "nhà hàng": ["am-thuc"],
  "quán cà phê": ["quan-ca-phe", "giai-tri"],
  "phố ăn đêm": ["am-thuc"],
  "tháp nhôm": ["van-hoa", "du-lich"],
  "cung điện thống nhất": ["van-hoa", "du-lich", "lich-su"],
  "địa đạo": ["lich-su", "du-lich"],
  "bar": ["bar-pub", "giai-tri"],
  "pub": ["bar-pub", "giai-tri"],
};

async function seedCategories() {
  console.log("🌱 Starting category seeding...");

  try {
    // 1. Create categories
    console.log("📝 Creating categories...");
    const createdCategories = await Promise.all(
      CATEGORIES.map((cat) =>
        prisma.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat,
        })
      )
    );
    console.log(`✅ Created ${createdCategories.length} categories`);

    // 2. Get all places
    const places = await prisma.place.findMany();
    console.log(`📍 Found ${places.length} places`);

    // 3. Map places to categories
    let mappedCount = 0;
    for (const place of places) {
      const placeName = place.name.toLowerCase();
      let categorySlugs: string[] = [];

      // Find matching categories
      for (const [keyword, slugs] of Object.entries(PLACE_CATEGORY_MAPPING)) {
        if (placeName.includes(keyword)) {
          categorySlugs = [...new Set([...categorySlugs, ...slugs])]; // Avoid duplicates
        }
      }

      // If no match found, assign "Du lịch" as default
      if (categorySlugs.length === 0) {
        categorySlugs = ["du-lich"];
      }

      // Create place-category relations
      for (const slug of categorySlugs) {
        const category = createdCategories.find((c) => c.slug === slug);
        if (category) {
          await prisma.placeCategory.upsert({
            where: {
              placeId_categoryId: {
                placeId: place.id,
                categoryId: category.id,
              },
            },
            update: {},
            create: {
              placeId: place.id,
              categoryId: category.id,
            },
          });
          mappedCount++;
        }
      }

      console.log(`  ✓ ${place.name} → ${categorySlugs.join(", ")}`);
    }

    console.log(`\n✅ Seeded ${mappedCount} place-category mappings`);
    console.log("🎉 Category seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
