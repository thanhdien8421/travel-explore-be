import { PrismaClient } from "../generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });

// import { PrismaClient } from '@prisma/client';

// // Prevent multiple instances in development (hot reload)
// declare global {
//   // eslint-disable-next-line no-var
//   var prisma: PrismaClient | undefined;
// }

// // Use existing instance if available, otherwise create new one
// export const prisma = global.prisma || new PrismaClient({
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL || '',
//     },
//   },
// });

// // In development, store instance globally to survive hot reloads
// if (process.env.NODE_ENV !== 'production') {
//   global.prisma = prisma;
// }
