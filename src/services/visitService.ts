import { prisma } from "../lib/prisma.js";

interface PlaceInfo {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
}

interface UserVisitResponse {
  place: PlaceInfo;
  visitedAt: Date;
}

export const addUserVisit = async (userId: string, placeId: string) => {
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
    where: { userId },
    include: {
      place: {
        select: {
          id: true,
          name: true,
          slug: true,
          coverImageUrl: true,
        },
      },
    },
    orderBy: {
      visitedAt: "desc",
    },
  });

  return visits.map((v: typeof visits[0]) => ({
    place: v.place,
    visitedAt: v.visitedAt,
  }));
};
