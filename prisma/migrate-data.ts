// /**
//  * Data Migration Script - 2 Options
//  * 
//  * Simple 2-step migration for Backup Database:
//  * 1. PULL: Kéo data từ Backup DB + thêm default fields → lưu JSON
//  * 2. PUSH: Đẩy data từ JSON vào Backup DB sau khi schema migrated
//  * 
//  * Usage:
//  *   npm run migrate:data pull   - Kéo data & lưu JSON
//  *   npm run migrate:data push   - Đẩy data từ JSON vào DB
//  * 
//  * Workflow:
//  * 1. npm run migrate:data pull   → Tạo backup JSON
//  * 2. npx prisma migrate deploy   → Tự migrate schema (bạn chọn)
//  * 3. npm run migrate:data push   → Đẩy data vào DB mới
//  */

// import { PrismaClient } from '@prisma/client';
// import fs from 'fs';
// import path from 'path';
// import dotenv from 'dotenv';

// dotenv.config();

// // Validate environment variables
// if (!process.env.DIRECT_URL) {
//   throw new Error('DIRECT_URL is not set in .env file');
// }

// // Create Prisma client for main database (currently in use)
// const backupDb = new PrismaClient({
//   datasources: {
//     db: {
//       url: process.env.DIRECT_URL
//     }
//   }
// });

// const BACKUP_DIR = path.join(process.cwd(), 'backups');

// const getBackupFile = () => {
//   if (!fs.existsSync(BACKUP_DIR)) {
//     fs.mkdirSync(BACKUP_DIR, { recursive: true });
//   }
//   // Get latest backup file or create new name
//   const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('pre-migration-backup-'));
//   if (files.length > 0) {
//     files.sort();
//     return path.join(BACKUP_DIR, files[files.length - 1]);
//   }
//   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//   return path.join(BACKUP_DIR, `pre-migration-backup-${timestamp}.json`);
// };

// async function pullData() {
//   console.log('📥 PULL: Kéo data từ DB chính + thêm default fields\n');
  
//   try {
//     console.log('📡 Connecting to BACKUP database...');
//     await backupDb.$connect();
//     console.log('✅ Connected\n');

//     console.log('📥 Fetching data...');
    
//     // Use raw SQL to include is_active (added by migration)
//     const places: any[] = await backupDb.$queryRaw`
//       SELECT 
//         id, name, slug, description, address_text, district, city,
//         latitude, longitude, cover_image_url, opening_hours, price_info,
//         contact_info, tips_notes, is_featured, is_active,
//         COALESCE(average_rating, 0.0) as average_rating,
//         created_at, updated_at
//       FROM places
//       ORDER BY created_at ASC
//     `;
    
//     const placeImages: any[] = await backupDb.$queryRaw`
//       SELECT * FROM place_images
//     `;
    
//     const users: any[] = await backupDb.$queryRaw`
//       SELECT id, full_name, email, password_hash, role, created_at FROM users
//     `;
    
//     const reviews: any[] = await backupDb.$queryRaw`
//       SELECT id, place_id, user_id, rating, comment, created_at FROM reviews
//     `;
    
//     const userVisits: any[] = await backupDb.$queryRaw`
//       SELECT id, user_id, place_id, visited_at FROM user_visits
//     `;

//     const allBackupData = {
//       places,
//       placeImages,
//       users,
//       reviews,
//       userVisits,
//     };

//     console.log(`✅ Found ${allBackupData.places.length} places`);
//     console.log(`✅ Found ${allBackupData.placeImages.length} place images`);
//     console.log(`✅ Found ${allBackupData.users.length} users`);
//     console.log(`✅ Found ${allBackupData.reviews.length} reviews`);
//     console.log(`✅ Found ${allBackupData.userVisits.length} user visits\n`);

//     console.log('🔧 Adding missing fields (isActive, averageRating)...');
    
//     // Map snake_case from raw SQL to camelCase for Prisma
//     const processedPlaces = allBackupData.places.map((place: any) => ({
//       id: place.id,
//       name: place.name,
//       slug: place.slug,
//       description: place.description,
//       addressText: place.address_text,
//       district: place.district,
//       city: place.city,
//       latitude: place.latitude,
//       longitude: place.longitude,
//       coverImageUrl: place.cover_image_url,
//       openingHours: place.opening_hours,
//       priceInfo: place.price_info,
//       contactInfo: place.contact_info,
//       tipsNotes: place.tips_notes,
//       isFeatured: place.is_featured,
//       isActive: place.is_active !== undefined ? place.is_active : true,
//       averageRating: place.average_rating || 0.0,
//       createdAt: place.created_at,
//       updatedAt: place.updated_at,
//     }));

//     console.log('✅ Processed\n');

//     // Save to JSON file
//     const backupFile = getBackupFile();
//     const dataToSave = {
//       ...allBackupData,
//       places: processedPlaces,
//     };
    
//     fs.writeFileSync(backupFile, JSON.stringify(dataToSave, null, 2), 'utf8');
//     console.log(`💾 Backup saved: ${backupFile}\n`);

//     console.log('✅ PULL completed!\n');
//     console.log('📋 Next steps:');
//     console.log('   1. Migrate schema: npx prisma migrate deploy');
//     console.log('   2. Push data: npm run migrate:data push\n');

//   } catch (error) {
//     console.error('❌ PULL failed:', error);
//     throw error;
//   } finally {
//     await backupDb.$disconnect();
//   }
// }

// async function pushData() {
//   console.log('📤 PUSH: Đẩy data từ JSON vào Backup DB\n');
  
//   try {
//     const backupFile = getBackupFile();
    
//     if (!fs.existsSync(backupFile)) {
//       throw new Error(`Backup file not found: ${backupFile}\nRun 'npm run migrate:data pull' first!`);
//     }

//     console.log(`📂 Reading backup: ${backupFile}\n`);
//     const dataToRestore = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

//     console.log('📡 Connecting to BACKUP database...');
//     await backupDb.$connect();
//     console.log('✅ Connected\n');

//     console.log('🗑️  Clearing existing data...');
//     await backupDb.userVisit.deleteMany({});
//     await backupDb.review.deleteMany({});
//     await backupDb.placeImage.deleteMany({});
//     await backupDb.place.deleteMany({});
//     await backupDb.user.deleteMany({});
//     console.log('✅ Cleared\n');

//     console.log('📤 Pushing data...\n');
//     let successCount = { places: 0, images: 0, users: 0, reviews: 0, visits: 0 };
//     let errorCount = 0;

//     // Migrate Users
//     console.log('👥 Migrating Users...');
//     console.log(`   📊 Total users to migrate: ${dataToRestore.users.length}`);
//     for (const user of dataToRestore.users) {
//       try {
//         await backupDb.user.create({
//           data: {
//             id: user.id,
//             fullName: user.full_name,
//             email: user.email,
//             passwordHash: user.password_hash,
//             role: user.role || 'USER',
//             createdAt: user.created_at,
//           }
//         });
//         successCount.users++;
//       } catch (error: any) {
//         errorCount++;
//         console.error(`   ❌ Failed user: ${user.email} - ${error.message}`);
//       }
//     }
//     console.log(`✅ Migrated ${successCount.users}/${dataToRestore.users.length} users\n`);

//     // Migrate Places
//     console.log('🏛️  Migrating Places...');
//     console.log(`   📊 Total places to migrate: ${dataToRestore.places.length}`);
//     for (const place of dataToRestore.places) {
//       try {
//         await backupDb.place.create({
//           data: {
//             id: place.id,
//             name: place.name,
//             description: place.description,
//             slug: place.slug,
//             addressText: place.addressText,
//             district: place.district,
//             city: place.city,
//             latitude: place.latitude,
//             longitude: place.longitude,
//             coverImageUrl: place.coverImageUrl,
//             openingHours: place.openingHours,
//             priceInfo: place.priceInfo,
//             contactInfo: place.contactInfo,
//             tipsNotes: place.tipsNotes,
//             isFeatured: place.isFeatured,
//             isActive: place.isActive,
//             averageRating: place.averageRating,
//             createdAt: place.createdAt,
//             updatedAt: place.updatedAt,
//           }
//         });
//         successCount.places++;
//       } catch (error: any) {
//         errorCount++;
//         console.error(`   ❌ Failed place: ${place.name} - ${error.message}`);
//       }
//     }
//     console.log(`✅ Migrated ${successCount.places}/${dataToRestore.places.length} places\n`);

//     // Migrate PlaceImages
//     console.log('🖼️  Migrating Place Images...');
//     console.log(`   📊 Total place images to migrate: ${dataToRestore.placeImages.length}`);
//     for (const image of dataToRestore.placeImages) {
//       try {
//         await backupDb.placeImage.create({
//           data: {
//             id: image.id,
//             placeId: image.placeId,
//             imageUrl: image.imageUrl,
//             caption: image.caption,
//           }
//         });
//         successCount.images++;
//       } catch (error: any) {
//         errorCount++;
//         console.error(`   ❌ Failed image: ${image.id} - ${error.message}`);
//       }
//     }
//     console.log(`✅ Migrated ${successCount.images}/${dataToRestore.placeImages.length} place images\n`);

//     // Migrate Reviews
//     console.log('⭐ Migrating Reviews...');
//     console.log(`   📊 Total reviews to migrate: ${dataToRestore.reviews.length}`);
//     for (const review of dataToRestore.reviews) {
//       try {
//         await backupDb.review.create({
//           data: {
//             id: review.id,
//             placeId: review.place_id,
//             userId: review.user_id,
//             rating: review.rating,
//             comment: review.comment,
//             createdAt: review.created_at,
//           }
//         });
//         successCount.reviews++;
//       } catch (error: any) {
//         errorCount++;
//         console.error(`   ❌ Failed review: ${review.id} - ${error.message}`);
//       }
//     }
//     console.log(`✅ Migrated ${successCount.reviews}/${dataToRestore.reviews.length} reviews\n`);

//     // Migrate UserVisits
//     console.log('📍 Migrating User Visits...');
//     console.log(`   📊 Total user visits to migrate: ${dataToRestore.userVisits.length}`);
//     for (const visit of dataToRestore.userVisits) {
//       try {
//         await backupDb.userVisit.create({
//           data: {
//             id: visit.id,
//             userId: visit.user_id,
//             placeId: visit.place_id,
//             visitedAt: visit.visited_at,
//           }
//         });
//         successCount.visits++;
//       } catch (error: any) {
//         errorCount++;
//         console.error(`   ❌ Failed visit: ${visit.id} - ${error.message}`);
//       }
//     }
//     console.log(`✅ Migrated ${successCount.visits}/${dataToRestore.userVisits.length} user visits\n`);

//     console.log('🎉 PUSH completed!');
//     console.log('📊 Summary:');
//     console.log(`   ✅ Users: ${successCount.users}`);
//     console.log(`   ✅ Places: ${successCount.places}`);
//     console.log(`   ✅ Place Images: ${successCount.images}`);
//     console.log(`   ✅ Reviews: ${successCount.reviews}`);
//     console.log(`   ✅ User Visits: ${successCount.visits}`);
//     if (errorCount > 0) {
//       console.log(`   ❌ Errors: ${errorCount}`);
//     }

//   } catch (error) {
//     console.error('❌ PUSH failed:', error);
//     throw error;
//   } finally {
//     await backupDb.$disconnect();
//   }
// }

// // Main
// const command = process.argv[2];

// if (!command || (command !== 'pull' && command !== 'push')) {
//   console.log('❌ Invalid command. Usage:');
//   console.log('   npm run migrate:data pull   - Kéo data & lưu JSON');
//   console.log('   npm run migrate:data push   - Đẩy data từ JSON\n');
//   process.exit(1);
// }

// if (command === 'pull') {
//   pullData()
//     .then(() => {
//       console.log('✨ Done!');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('💥 Failed:', error);
//       process.exit(1);
//     });
// } else if (command === 'push') {
//   pushData()
//     .then(() => {
//       console.log('✨ Done!');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('💥 Failed:', error);
//       process.exit(1);
//     });
// }
