/**
 * Seed Admin User Script
 * Usage: npx tsx prisma/seed-admin.ts
 * 
 * This script creates an admin user in the database with:
 * - Hashed password (using bcrypt with SALT_ROUNDS = 10)
 * - ADMIN role
 * - Safe: Won't create duplicate if email already exists
 */

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Admin credentials
const ADMIN_EMAIL = 'admin@travelexplore.com';
const ADMIN_PASSWORD = '123456'; // Change this in production!
const ADMIN_FULLNAME = 'Trần Văn';

async function seedAdmin() {
  try {
    console.log('🔐 Seeding admin user...\n');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin user with email '${ADMIN_EMAIL}' already exists!`);
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Created: ${existingAdmin.createdAt}\n`);
      console.log('💡 Tip: To create another admin, use a different email address.\n');
      await prisma.$disconnect();
      return;
    }

    // Hash password
    console.log('🔒 Hashing password with bcrypt (SALT_ROUNDS=10)...');
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    // Create admin user
    console.log('📝 Creating admin user in database...');
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        fullName: ADMIN_FULLNAME,
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Full Name: ${admin.fullName}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Created: ${admin.createdAt}\n`);

    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}\n`);

    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. Change the password immediately after first login!');
    console.log('   2. Do NOT commit this password to version control.');
    console.log('   3. In production, use a secure password generation method.');
    console.log('   4. Store credentials in a secure password manager.\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
