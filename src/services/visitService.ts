import { prisma } from "../lib/prisma.js";

interface PlaceImage {
  id: string;
  image_url: string;
  is_cover: boolean;
}

interface PlaceInfo {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
  images?: PlaceImage[];
}

interface UserVisitResponse {
  place: PlaceInfo;
  visitedAt: Date;
}

export const addUserVisit = async (userId: string, placeId: string) => {
  // Check if place exists, is active, and is approved
  const place = await prisma.place.findFirst({
    where: { 
      id: placeId,
      isActive: true,
      status: 'APPROVED'
    },
    select: { id: true },
  });

  if (!place) {
    throw new Error("Place not found or not available");
  }

  // Kiểm tra đã tồn tại chưa để tránh duplicate
  const existing = await prisma.userVisit.findFirst({
    where: { userId, placeId },
  });

  if (!existing) {
    await prisma.userVisit.create({
      data: {
        userId,
        placeId,
      },
    });
  }
};

export const getUserVisits = async (userId: string): Promise<UserVisitResponse[]> => {
  const visits = await prisma.userVisit.findMany({
    where: { 
      userId,
      place: { 
        isActive: true,
        status: 'APPROVED' // Only return visits to approved places
      }
    },
    include: {
      place: {
        select: {
          id: true,
          name: true,
          slug: true,
          coverImageUrl: true,
          images: {
            select: {
              id: true,
              imageUrl: true,
              isCover: true,
            },
          },
        },
      },
    },
    orderBy: {
      visitedAt: "desc",
    },
  });

  return visits.map((v: typeof visits[0]) => ({
    place: {
      id: v.place.id,
      name: v.place.name,
      slug: v.place.slug,
      coverImageUrl: v.place.coverImageUrl,
      images: v.place.images.map((img: { id: string; imageUrl: string; isCover: boolean }) => ({
        id: img.id,
        image_url: img.imageUrl,
        is_cover: img.isCover,
      })),
    },
    visitedAt: v.visitedAt,
  }));
};
