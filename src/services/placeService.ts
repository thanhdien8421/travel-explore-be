import type { PlaceSummary, PlaceDetail } from "../types/place.types.js";
import { getImageUrl } from "../lib/supabase.js";
import { prisma } from "../lib/prisma.js";


export const getFeaturedPlaces = async (limit: number = 10): Promise<PlaceSummary[]> => {
  const places = await prisma.place.findMany({
    where: { isFeatured: true },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      district: true,
      coverImageUrl: true,
      averageRating: true,
    },
  });

  return places.map((p: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    district: string | null;
    coverImageUrl: string | null;
    averageRating: any;
  }) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    slug: p.slug,
    district: p.district,
    cover_image_url: getImageUrl(p.coverImageUrl),
    average_rating: p.averageRating?.toNumber() ?? 0,
  }));
};

export const getAllPlaces = async (limit: number = 10): Promise<PlaceSummary[]> => {
  const places = await prisma.place.findMany({
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      district: true,
      coverImageUrl: true,
      averageRating: true,
    },
  });


  return places.map((p: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    district: string | null;
    coverImageUrl: string | null;
    averageRating: any;
  }) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    slug: p.slug,
    district: p.district,
    cover_image_url: getImageUrl(p.coverImageUrl),
    average_rating: p.averageRating?.toNumber() ?? 0,
  }));
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

  if (!place) return null;

  type ImageRecord = typeof place.images[number];
  type ReviewRecord = typeof place.reviews[number];

  const result: PlaceDetail = {
    id: place.id,
    name: place.name,
    slug: place.slug,
    description: place.description,
    address_text: place.addressText,
    district: place.district,
    city: place.city,
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

