import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TODO: Replace with actual UUIDs from user
const CATEGORIES = [
  { id: "UUID_1", name: "Nhà hàng - Quán ăn", slug: "nha-hang-quan-an" },
  { id: "UUID_2", name: "Quán cà phê", slug: "quan-ca-phe" },
  { id: "UUID_3", name: "Bar / Pub", slug: "bar-pub" },
  { id: "UUID_4", name: "Địa danh - Di tích", slug: "dia-danh-di-tich" },
  { id: "UUID_5", name: "Bảo tàng - Triển lãm", slug: "bao-tang-trien-lam" },
  { id: "UUID_6", name: "Thiên nhiên - Không gian xanh", slug: "thien-nhien-khong-gian-xanh" },
  { id: "UUID_7", name: "Mua sắm", slug: "mua-sam" },
  { id: "UUID_8", name: "Giải trí & Sáng tạo", slug: "giai-tri-sang-tao" },
];

// TODO: Replace with actual place UUIDs and names from user
const PLACE_CATEGORY_MAPPING: Record<string, string[]> = {
  // Format: "PLACE_UUID": ["CATEGORY_ID_1", "CATEGORY_ID_2", ...]
  // Example:
  // "place-uuid-1": ["UUID_1", "UUID_2"],  // Nhà hàng + Quán cà phê
  // "place-uuid-2": ["UUID_4"],             // Địa danh - Di tích
};

async function seedCategories() {
  console.log("🌱 Starting category reset and seeding...");

  try {
    // 1. Delete existing place_categories and categories
    console.log("🗑️  Cleaning up existing data...");
    await prisma.placeCategory.deleteMany({});
    console.log("  ✓ Deleted all place_categories");
    
    await prisma.category.deleteMany({});
    console.log("  ✓ Deleted all categories");

    // 2. Create new categories
    console.log("📝 Creating new categories...");
    const createdCategories = await Promise.all(
      CATEGORIES.map((cat) =>
        prisma.category.create({
          data: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
          },
        })
      )
    );
    console.log(`✅ Created ${createdCategories.length} categories:`);
    createdCategories.forEach((cat) => {
      console.log(`  • ${cat.name} (ID: ${cat.id})`);
    });

    // 3. Create place-category relations
    console.log("\n🔗 Creating place-category mappings...");
    let mappedCount = 0;
    
    for (const [placeId, categoryIds] of Object.entries(PLACE_CATEGORY_MAPPING)) {
      for (const categoryId of categoryIds) {
        await prisma.placeCategory.create({
          data: {
            placeId,
            categoryId,
          },
        });
        mappedCount++;
      }
    }
    
    console.log(`✅ Created ${mappedCount} place-category mappings`);
    console.log("🎉 Category seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
