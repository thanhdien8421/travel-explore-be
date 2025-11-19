import type { PlaceSummary, PlaceDetail } from "../types/place.types.js";
import { getImageUrl } from "../lib/supabase.js";
import { prisma } from "../lib/prisma.js";

// Helper function to remove Vietnamese diacritics
const removeDiacritics = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

interface SearchOptions {
  q?: string;
  category?: string;
  ward?: string;
  district?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}

interface SearchResponse {
  data: PlaceSummary[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}


export const getFeaturedPlaces = async (limit: number = 10): Promise<PlaceSummary[]> => {
  const places = await prisma.place.findMany({
    where: { isFeatured: true, isActive: true },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      district: true,
      latitude: true,
      longitude: true,
      coverImageUrl: true,
      averageRating: true,
    },
  });

  return places.map((p: typeof places[0]) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    slug: p.slug,
    district: p.district,
    latitude: p.latitude?.toNumber() ?? null,
    longitude: p.longitude?.toNumber() ?? null,
    cover_image_url: getImageUrl(p.coverImageUrl),
    average_rating: p.averageRating?.toNumber() ?? 0,
  }));
};

export const getAllPlaces = async (limit: number = 10): Promise<PlaceSummary[]> => {
  const places = await prisma.place.findMany({
    where: { isActive: true },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      district: true,
      latitude: true,
      longitude: true,
      coverImageUrl: true,
      averageRating: true,
    },
  });

  return places.map((p: typeof places[0]) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    slug: p.slug,
    district: p.district,
    latitude: p.latitude?.toNumber() ?? null,
    longitude: p.longitude?.toNumber() ?? null,
    cover_image_url: getImageUrl(p.coverImageUrl),
    average_rating: p.averageRating?.toNumber() ?? 0,
  }));
};

export const searchPlaces = async (options: SearchOptions): Promise<SearchResponse> => {
  const {
    q = "",
    category = "",
    ward = "",
    district = "",
    sortBy = "name_asc",
    limit = 10,
    page = 1,
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { isActive: true };

  // Search by name, description, or full_address_generated (case-insensitive)
  if (q) {
    where.OR = [
      {
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        fullAddressGenerated: {
          contains: q,
          mode: "insensitive",
        },
      },
    ];
  }

  // Filter by ward (primary filter)
  if (ward) {
    where.ward = {
      equals: ward,
      mode: "insensitive",
    };
  }

  // Filter by district (secondary filter - for backward compatibility)
  if (district && !ward) {
    where.district = {
      equals: district,
      mode: "insensitive",
    };
  }

  // Filter by category (Many-to-Many)
  if (category) {
    where.categories = {
      some: {
        category: {
          slug: {
            in: category.split(",").map(c => c.trim()),
          },
        },
      },
    };
  }

  // Sort options
  let orderBy: any = { name: "asc" };
  if (sortBy === "rating_desc") {
    orderBy = { averageRating: "desc" };
  } else if (sortBy === "rating_asc") {
    orderBy = { averageRating: "asc" };
  } else if (sortBy === "name_desc") {
    orderBy = { name: "desc" };
  }

  // Get total count
  const totalItems = await prisma.place.count({ where });
  const totalPages = Math.ceil(totalItems / limit);

  // Get paginated results
  const places = await prisma.place.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      district: true,
      latitude: true,
      longitude: true,
      coverImageUrl: true,
      averageRating: true,
    },
    orderBy,
    skip,
    take: limit,
  });

  const data = places.map((p: typeof places[0]) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    slug: p.slug,
    district: p.district,
    latitude: p.latitude?.toNumber() ?? null,
    longitude: p.longitude?.toNumber() ?? null,
    cover_image_url: getImageUrl(p.coverImageUrl),
    average_rating: p.averageRating?.toNumber() ?? 0,
  }));

  return {
    data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
    },
  };
};

/**
 * Lấy chi tiết một địa điểm theo slug
 */
export const getPlaceBySlug = async (slug: string, userId?: string): Promise<PlaceDetail | null> => {
  const place = await prisma.place.findUnique({
    where: { slug },
    include: {
      images: {
        select: {
          id: true,
          imageUrl: true,
          caption: true,
        },
      },
      reviews: { 
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
      userVisits: userId ? {
        where: { userId },
        select: { id: true },
      } : false,
    },
  });

  // Only return active places
  if (!place || !place.isActive) return null;

  type ImageRecord = typeof place.images[number];
  type ReviewRecord = typeof place.reviews[number];

  const result: PlaceDetail = {
    id: place.id,
    name: place.name,
    slug: place.slug,
    description: place.description,
    address_text: place.fullAddressGenerated,
    street_address: place.streetAddress,
    ward: place.ward,
    district: place.district,
    city: place.provinceCity,
    latitude: place.latitude?.toNumber() ?? null,
    longitude: place.longitude?.toNumber() ?? null,
    cover_image_url: getImageUrl(place.coverImageUrl),
    opening_hours: place.openingHours,
    price_info: place.priceInfo,
    contact_info: place.contactInfo,
    tips_notes: place.tipsNotes,
    is_featured: place.isFeatured,
    average_rating: place.averageRating?.toNumber() ?? 0,
    created_at: place.createdAt,
    updated_at: place.updatedAt,
    images: place.images.map((img: ImageRecord) => ({
      id: img.id,
      image_url: getImageUrl(img.imageUrl),
      caption: img.caption,
    })),
    reviews: place.reviews.map((r: ReviewRecord) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.createdAt,
      user: {
        full_name: r.user.fullName || "",
      },
    })),
  };

  if (userId) {
    result.visited = (place.userVisits?.length ?? 0) > 0;
  }

  return result;
};

