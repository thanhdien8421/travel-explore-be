import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "travel-explore-secret-key";
const JWT_EXPIRY = "7d";
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token for a user
 */
export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

/**
 * Register a new user
 */
export const registerUser = async (
  email: string,
  password: string,
  fullName: string
) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: "USER",
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate token
  const token = generateToken(user.id, user.role);

  return {
    user,
    token,
  };
};

/**
 * Login user with email and password
 */
export const loginUser = async (email: string, password: string) => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error("Account has been deactivated");
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  // Generate token
  const token = generateToken(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// ==================== ADMIN USER MANAGEMENT ====================

export interface UserFilters {
  search?: string;
  role?: "ADMIN" | "USER" | "PARTNER" | "CONTRIBUTOR";
  isActive?: boolean;
  sortBy?: "fullName" | "email" | "createdAt" | "role";
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
}

/**
 * Get all users with filtering and pagination (Admin only)
 */
export const getAllUsers = async (filters: UserFilters = {}) => {
  const {
    search,
    role,
    isActive,
    sortBy = "createdAt",
    sortOrder = "desc",
    limit = 20,
    page = 1,
  } = filters;

  const where: any = {};

  // Search by name or email
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter by role
  if (role) {
    where.role = role;
  }

  // Filter by isActive status
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Build orderBy
  const orderBy: any = {};
  if (sortBy === "fullName") {
    orderBy.fullName = sortOrder;
  } else if (sortBy === "email") {
    orderBy.email = sortOrder;
  } else if (sortBy === "role") {
    orderBy.role = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            createdPlaces: true,
            bookings: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (
  userId: string,
  newRole: "ADMIN" | "USER" | "PARTNER" | "CONTRIBUTOR"
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Create a new user account (Admin only)
 * Used to create PARTNER or CONTRIBUTOR accounts
 */
export const createUserByAdmin = async (data: {
  email: string;
  password: string;
  fullName: string;
  role: "ADMIN" | "USER" | "PARTNER" | "CONTRIBUTOR";
}) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: data.role,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Create partner account from PartnerLead (Admin only)
 */
export const createPartnerFromLead = async (
  leadId: string,
  password: string
) => {
  // Get the partner lead
  const lead = await prisma.partnerLead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error("Partner lead not found");
  }

  // Check if user already exists with this email
  const existingUser = await prisma.user.findUnique({
    where: { email: lead.email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user with PARTNER role
  const user = await prisma.user.create({
    data: {
      email: lead.email,
      passwordHash,
      fullName: lead.contactName,
      role: "PARTNER",
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });

  // Delete the partner lead after successful account creation
  await prisma.partnerLead.delete({
    where: { id: leadId },
  });

  return user;
};

/**
 * Delete a user - soft or hard delete (Admin only)
 * Soft delete: Sets isActive to false (default)
 * Hard delete: Permanently removes from database
 */
export const deleteUser = async (userId: string, permanent: boolean = false) => {
  if (permanent) {
    // Hard delete - permanently remove
    await prisma.user.delete({
      where: { id: userId },
    });
  } else {
    // Soft delete - deactivate user
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }
};

/**
 * Restore a soft-deleted user (Admin only)
 */
export const restoreUser = async (userId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Get user statistics (Admin only)
 */
export const getUserStats = async () => {
  const [totalUsers, activeUsers, inactiveUsers, roleStats] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),
  ]);

  const stats: Record<string, number> = {
    total: totalUsers,
    active: activeUsers,
    inactive: inactiveUsers,
    ADMIN: 0,
    USER: 0,
    PARTNER: 0,
    CONTRIBUTOR: 0,
  };

  roleStats.forEach((stat) => {
    stats[stat.role] = stat._count.role;
  });

  return stats;
};
