/**
 * Data Migration Script
 * 
 * Migrates data from OLD database to NEW database
 * Usage: npm run migrate:data
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
if (!process.env.OLD_DIRECT_URL) {
  throw new Error('OLD_DIRECT_URL is not set in .env file');
}
if (!process.env.DIRECT_URL) {
  throw new Error('DIRECT_URL is not set in .env file');
}

// Create two separate Prisma clients
const oldDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.OLD_DIRECT_URL // Use direct connection for migration
    }
  }
});

const newDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL // Use direct connection for migration
    }
  }
});

async function migrateData() {
  console.log('🚀 Starting data migration...\n');
  
  try {
    // Test connections
    console.log('📡 Testing database connections...');
    await oldDb.$connect();
    console.log('✅ Connected to OLD database');
    await newDb.$connect();
    console.log('✅ Connected to NEW database\n');

    // Get data from old database
    console.log('📥 Fetching data from OLD database...');
    const places = await oldDb.place.findMany({
      orderBy: { createdAt: 'asc' }
    });
    console.log(`✅ Found ${places.length} places to migrate\n`);

    if (places.length === 0) {
      console.log('⚠️  No data to migrate. Old database is empty.');
      return;
    }

    // Clear existing data in new database (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data in NEW database...');
    const deletedCount = await newDb.place.deleteMany({});
    console.log(`✅ Deleted ${deletedCount.count} existing records\n`);

    // Migrate data to new database
    console.log('📤 Migrating data to NEW database...');
    let successCount = 0;
    let errorCount = 0;

    for (const place of places) {
      try {
        await newDb.place.create({
          data: {
            id: place.id,
            name: place.name,
            description: place.description,
            slug: place.slug,
            addressText: place.addressText,
            district: place.district,
            city: place.city,
            latitude: place.latitude,
            longitude: place.longitude,
            coverImageUrl: place.coverImageUrl,
            openingHours: place.openingHours,
            priceInfo: place.priceInfo,
            contactInfo: place.contactInfo,
            tipsNotes: place.tipsNotes,
            isFeatured: place.isFeatured,
            createdAt: place.createdAt,
            updatedAt: place.updatedAt,
          }
        });
        successCount++;
        console.log(`  ✓ Migrated: ${place.name} (${successCount}/${places.length})`);
      } catch (error: any) {
        errorCount++;
        console.error(`  ✗ Failed to migrate: ${place.name}`);
        console.error(`    Error: ${error.message}`);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${successCount} places`);
    if (errorCount > 0) {
      console.log(`❌ Failed to migrate: ${errorCount} places`);
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const newPlacesCount = await newDb.place.count();
    console.log(`✅ NEW database now has ${newPlacesCount} places`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Disconnect from both databases
    await oldDb.$disconnect();
    await newDb.$disconnect();
    console.log('\n👋 Disconnected from databases');
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed with error:', error);
    process.exit(1);
  });
