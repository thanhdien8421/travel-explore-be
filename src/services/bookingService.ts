import { prisma } from "../lib/prisma.js";
import { BookingStatus } from "@prisma/client";

export interface CreateBookingData {
  placeId: string;
  userId: string;
  bookingDate: string | Date;
  guestCount: number;
  note?: string;
}

export interface BookingFilters {
  userId?: string;
  placeId?: string;
  status?: BookingStatus;
  sortBy?: "date" | "createdAt";
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
}

/**
 * Create a new booking
 * Only allow booking for APPROVED and active places
 */
export async function createBooking(data: CreateBookingData) {
  // Verify place exists, is active, and is approved
  const place = await prisma.place.findFirst({
    where: { 
      id: data.placeId,
      isActive: true,
      status: 'APPROVED'
    },
    select: { id: true, name: true },
  });

  if (!place) {
    throw new Error("Place not found or not available for booking");
  }

  // Create booking with PENDING status
  const booking = await prisma.booking.create({
    data: {
      placeId: data.placeId,
      userId: data.userId,
      bookingDate: new Date(data.bookingDate),
      guestCount: data.guestCount,
      note: data.note || null,
      status: "PENDING",
    },
    include: {
      place: {
        select: {
          id: true,
          name: true,
          slug: true,
          coverImageUrl: true,
          averageRating: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return {
    id: booking.id,
    place: {
      id: booking.place.id,
      name: booking.place.name,
      slug: booking.place.slug,
      cover_image_url: booking.place.coverImageUrl,
      average_rating: booking.place.averageRating,
    },
    user: {
      id: booking.user.id,
      full_name: booking.user.fullName,
      email: booking.user.email,
    },
    booking_date: booking.bookingDate,
    guest_count: booking.guestCount,
    note: booking.note,
    status: booking.status,
    created_at: booking.createdAt,
  };
}

/**
 * Get user's bookings
 */
export async function getUserBookings(userId: string, filters: BookingFilters = {}) {
  const limit = filters.limit || 10;
  const page = filters.page || 1;
  const skip = (page - 1) * limit;
  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder || "desc";

  const where: any = { userId };
  if (filters.status) where.status = filters.status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true,
            coverImageUrl: true,
            averageRating: true,
            district: true,
          },
        },
      },
      orderBy: {
        [sortBy === "date" ? "bookingDate" : "createdAt"]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: bookings.map((b) => ({
      id: b.id,
      place: {
        id: b.place.id,
        name: b.place.name,
        slug: b.place.slug,
        cover_image_url: b.place.coverImageUrl,
        average_rating: b.place.averageRating,
        district: b.place.district,
      },
      booking_date: b.bookingDate,
      guest_count: b.guestCount,
      note: b.note,
      status: b.status,
      created_at: b.createdAt,
    })),
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
}

/**
 * Get all bookings (Admin)
 */
export async function getAllBookings(filters: BookingFilters = {}) {
  const limit = Math.min(filters.limit || 20, 100);
  const page = filters.page || 1;
  const skip = (page - 1) * limit;
  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder || "desc";

  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.placeId) where.placeId = filters.placeId;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true,
            coverImageUrl: true,
            district: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy === "date" ? "bookingDate" : "createdAt"]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: bookings.map((b) => ({
      id: b.id,
      place: {
        id: b.place.id,
        name: b.place.name,
        slug: b.place.slug,
        cover_image_url: b.place.coverImageUrl,
        district: b.place.district,
      },
      user: {
        id: b.user.id,
        full_name: b.user.fullName,
        email: b.user.email,
      },
      booking_date: b.bookingDate,
      guest_count: b.guestCount,
      note: b.note,
      status: b.status,
      created_at: b.createdAt,
    })),
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
}

/**
 * Update booking status
 */
export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
    include: {
      place: {
        select: {
          id: true,
          name: true,
          slug: true,
          coverImageUrl: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return {
    id: booking.id,
    place: {
      id: booking.place.id,
      name: booking.place.name,
      slug: booking.place.slug,
      cover_image_url: booking.place.coverImageUrl,
    },
    user: {
      id: booking.user.id,
      full_name: booking.user.fullName,
      email: booking.user.email,
    },
    booking_date: booking.bookingDate,
    guest_count: booking.guestCount,
    note: booking.note,
    status: booking.status,
    created_at: booking.createdAt,
  };
}

/**
 * Delete a booking
 */
export async function deleteBooking(bookingId: string) {
  await prisma.booking.delete({
    where: { id: bookingId },
  });
}
