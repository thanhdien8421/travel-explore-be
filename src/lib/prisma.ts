/**
 * Prisma Client Singleton
 * 
 * This ensures only ONE instance of PrismaClient is created and reused
 * throughout the application lifecycle, preventing connection pool exhaustion.
 * 
 * Why this matters:
 * - Creating new PrismaClient() on every request = new connection pool
 * - Supabase has connection limits (usually 15-60 depending on plan)
 * - Reusing one instance = efficient connection pooling
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development (hot reload)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use existing instance if available, otherwise create new one
export const prisma = global.prisma || new PrismaClient();

// In development, store instance globally to survive hot reloads
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
