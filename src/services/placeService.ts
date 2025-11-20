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
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      images: {
        select: {
          id: true,
          imageUrl: true,
          isCover: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
    },
  });

  return places.map((p: typeof places[0]) => {
    // Get cover image from images array if available
    const coverImage = p.images?.find(img => img.isCover);
    const cover_image_url = coverImage ? getImageUrl(coverImage.imageUrl) : getImageUrl(p.coverImageUrl);
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      slug: p.slug,
      district: p.district,
      latitude: p.latitude?.toNumber() ?? null,
      longitude: p.longitude?.toNumber() ?? null,
      cover_image_url,
      average_rating: p.averageRating?.toNumber() ?? 0,
      categories: p.categories.map(pc => pc.category),
    };
  });
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
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      images: {
        select: {
          id: true,
          imageUrl: true,
          isCover: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
    },
  });

  return places.map((p: typeof places[0]) => {
    // Get cover image from images array if available
    const coverImage = p.images?.find(img => img.isCover);
    const cover_image_url = coverImage ? getImageUrl(coverImage.imageUrl) : getImageUrl(p.coverImageUrl);
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      slug: p.slug,
      district: p.district,
      latitude: p.latitude?.toNumber() ?? null,
      longitude: p.longitude?.toNumber() ?? null,
      cover_image_url,
      average_rating: p.averageRating?.toNumber() ?? 0,
      categories: p.categories.map(pc => pc.category),
    };
  });
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
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      images: {
        select: {
          id: true,
          imageUrl: true,
          isCover: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
    },
    orderBy,
    skip,
    take: limit,
  });

  const data = places.map((p: typeof places[0]) => {
    // Get cover image from images array if available
    const coverImage = p.images?.find(img => img.isCover);
    const cover_image_url = coverImage ? getImageUrl(coverImage.imageUrl) : getImageUrl(p.coverImageUrl);
    
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      slug: p.slug,
      district: p.district,
      latitude: p.latitude?.toNumber() ?? null,
      longitude: p.longitude?.toNumber() ?? null,
      cover_image_url,
      average_rating: p.averageRating?.toNumber() ?? 0,
      categories: p.categories.map(pc => pc.category),
    };
  });

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
  console.time(`getPlaceBySlug-${slug}`);
  
  // Query 1: Get main place data
  console.time(`prisma-place-${slug}`);
  const place = await prisma.place.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      fullAddressGenerated: true,
      streetAddress: true,
      ward: true,
      district: true,
      provinceCity: true,
      latitude: true,
      longitude: true,
      coverImageUrl: true,
      openingHours: true,
      priceInfo: true,
      contactInfo: true,
      tipsNotes: true,
      isFeatured: true,
      averageRating: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  console.timeEnd(`prisma-place-${slug}`);

  if (!place || !place.isActive) return null;

  // Run queries 2, 3 in parallel (removed reviews query)
  console.time(`parallel-queries-${slug}`);
  const [images, visit] = await Promise.all([
    // Query 2: Get images
    prisma.placeImage.findMany({
      where: { placeId: place.id },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        isCover: true,
      },
    }),
    // Query 3: Check if user visited (only if userId provided)
    userId ? prisma.userVisit.findFirst({
      where: {
        placeId: place.id,
        userId: userId,
      },
      select: { id: true },
    }) : Promise.resolve(null),
  ]);
  console.timeEnd(`parallel-queries-${slug}`);

  console.time(`data-mapping-${slug}`);
  
  // Get cover image from images array if available, fallback to coverImageUrl
  const coverImage = images?.find(img => img.isCover);
  const cover_image_url = coverImage ? getImageUrl(coverImage.imageUrl) : getImageUrl(place.coverImageUrl);
  
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
    cover_image_url,
    opening_hours: place.openingHours,
    price_info: place.priceInfo,
    contact_info: place.contactInfo,
    tips_notes: place.tipsNotes,
    is_featured: place.isFeatured,
    average_rating: place.averageRating?.toNumber() ?? 0,
    created_at: place.createdAt,
    updated_at: place.updatedAt,
    images: images.map((img) => ({
      id: img.id,
      image_url: getImageUrl(img.imageUrl),
      caption: img.caption,
      is_cover: img.isCover,
    })),
    reviews: [], // Empty - will be fetched separately
    visited: !!visit,
  };
  console.timeEnd(`data-mapping-${slug}`);

  console.timeEnd(`getPlaceBySlug-${slug}`);
  return result;
};

